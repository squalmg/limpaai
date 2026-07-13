"use strict";

const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || "127.0.0.1";
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const PUBLIC_DIR = path.join(ROOT, "public");

const DATASETS = {
  clients: path.join(DATA_DIR, "clients.json"),
  professionals: path.join(DATA_DIR, "professionals.json"),
};

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(PUBLIC_DIR));

async function ensureDataFiles() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  for (const file of Object.values(DATASETS)) {
    try {
      await fs.access(file);
    } catch {
      await fs.writeFile(file, "[]\n", "utf8");
    }
  }
}

async function readRows(type) {
  const file = DATASETS[type];

  if (!file) {
    const error = new Error("Tipo de pesquisa inválido.");
    error.statusCode = 400;
    throw error;
  }

  const raw = await fs.readFile(file, "utf8");
  const parsed = JSON.parse(raw || "[]");

  if (!Array.isArray(parsed)) {
    throw new Error(`Arquivo inválido: ${path.basename(file)}`);
  }

  return parsed;
}

async function writeRows(type, rows) {
  const file = DATASETS[type];
  const temp = `${file}.tmp`;
  await fs.writeFile(temp, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
  await fs.rename(temp, file);
}

function normalizeYes(value) {
  return String(value || "").trim().toLowerCase() === "sim";
}

function percentage(numerator, denominator) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  return [value];
}

function validatePayload(type, body) {
  const errors = [];

  if (!String(body.city || "").trim()) errors.push("Cidade é obrigatória.");
  if (!String(body.neighborhood || "").trim()) errors.push("Bairro é obrigatório.");

  if (type === "clients") {
    if (!String(body.usedCleaningService || "").trim()) {
      errors.push("Informe se já contratou serviço de limpeza.");
    }
    if (!String(body.platformInterest || "").trim()) {
      errors.push("Informe o interesse em contratar pela plataforma.");
    }
  }

  if (type === "professionals") {
    if (!String(body.yearsExperience || "").trim()) {
      errors.push("Informe os anos de experiência.");
    }
    if (!String(body.platformInterest || "").trim()) {
      errors.push("Informe o interesse em usar a plataforma.");
    }
  }

  return errors;
}

function clientSummary(rows) {
  const total = rows.length;
  const difficulty = rows.filter((row) =>
    ["alta", "média"].includes(String(row.findingDifficulty || "").toLowerCase())
  ).length;
  const platform = rows.filter((row) => normalizeYes(row.platformInterest)).length;
  const fee = rows.filter((row) => normalizeYes(row.acceptsTenPercentFee)).length;
  const prepaid = rows.filter((row) => normalizeYes(row.acceptsPrepaid)).length;
  const pilot = rows.filter((row) => normalizeYes(row.pilotInterest)).length;
  const trustOrSecurity = rows.filter((row) => {
    const priorities = asArray(row.priorities).map((item) =>
      String(item).toLowerCase()
    );
    return priorities.includes("confiança") || priorities.includes("segurança");
  }).length;

  return {
    total,
    metrics: {
      difficulty: percentage(difficulty, total),
      platform: percentage(platform, total),
      fee: percentage(fee, total),
      prepaid: percentage(prepaid, total),
      pilot: percentage(pilot, total),
      trustOrSecurity: percentage(trustOrSecurity, total),
    },
    counts: { difficulty, platform, fee, prepaid, pilot, trustOrSecurity },
  };
}

function professionalSummary(rows) {
  const total = rows.length;
  const platform = rows.filter((row) => normalizeYes(row.platformInterest)).length;
  const training = rows.filter((row) => normalizeYes(row.acceptsTraining)).length;
  const documents = rows.filter((row) => normalizeYes(row.acceptsDocuments)).length;
  const commission = rows.filter((row) =>
    ["sim", "talvez"].includes(
      String(row.acceptsProgressiveCommission || "").trim().toLowerCase()
    )
  ).length;
  const freedom = rows.filter((row) => normalizeYes(row.valuesFreedom)).length;
  const pilot = rows.filter((row) => normalizeYes(row.pilotInterest)).length;

  return {
    total,
    metrics: {
      platform: percentage(platform, total),
      training: percentage(training, total),
      documents: percentage(documents, total),
      commission: percentage(commission, total),
      freedom: percentage(freedom, total),
      pilot: percentage(pilot, total),
    },
    counts: { platform, training, documents, commission, freedom, pilot },
  };
}

function csvEscape(value) {
  const text = Array.isArray(value)
    ? value.join(" | ")
    : value === null || value === undefined
      ? ""
      : String(value);

  return `"${text.replaceAll('"', '""')}"`;
}

function rowsToCsv(rows) {
  if (!rows.length) return "\ufeff";

  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const lines = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ];

  return `\ufeff${lines.join("\r\n")}\r\n`;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "limpaai-validation-app" });
});

app.get("/api/summary", async (_req, res, next) => {
  try {
    const [clients, professionals] = await Promise.all([
      readRows("clients"),
      readRows("professionals"),
    ]);

    res.json({
      generatedAt: new Date().toISOString(),
      clients: clientSummary(clients),
      professionals: professionalSummary(professionals),
      targets: {
        clients: {
          minimumSample: 20,
          difficulty: 60,
          platform: 50,
          fee: 40,
        },
        professionals: {
          minimumSample: 15,
          platform: 60,
          training: 50,
          documents: 50,
          commission: 40,
          freedom: 70,
          minimumPilotCandidates: 5,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/responses/:type", async (req, res, next) => {
  try {
    const rows = await readRows(req.params.type);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

app.post("/api/responses/:type", async (req, res, next) => {
  try {
    const { type } = req.params;
    const errors = validatePayload(type, req.body);

    if (errors.length) {
      return res.status(400).json({ ok: false, errors });
    }

    const rows = await readRows(type);
    const record = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...req.body,
    };

    rows.push(record);
    await writeRows(type, rows);

    res.status(201).json({ ok: true, id: record.id });
  } catch (error) {
    next(error);
  }
});

app.get("/api/export/:type.csv", async (req, res, next) => {
  try {
    const rows = await readRows(req.params.type);
    const csv = rowsToCsv(rows);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${req.params.type}-limpaai.csv"`
    );
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  const status = Number(error.statusCode || 500);
  res.status(status).json({
    ok: false,
    error: status === 500 ? "Erro interno." : error.message,
  });
});

ensureDataFiles()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`LimpaAí Validation App: http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Falha ao iniciar:", error);
    process.exit(1);
  });
