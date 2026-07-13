"use strict";

function formToObject(form) {
  const data = new FormData(form);
  const result = {};

  for (const [key, value] of data.entries()) {
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      result[key] = Array.isArray(result[key])
        ? [...result[key], value]
        : [result[key], value];
    } else {
      result[key] = value;
    }
  }

  return result;
}

async function submitResearchForm(form, type, notice) {
  notice.className = "notice";
  notice.textContent = "";

  try {
    const response = await fetch(`/api/responses/${type}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formToObject(form)),
    });

    const payload = await response.json();

    if (!response.ok) {
      const message = Array.isArray(payload.errors)
        ? payload.errors.join(" ")
        : payload.error || "Não foi possível salvar.";
      throw new Error(message);
    }

    notice.className = "notice success";
    notice.textContent = "Resposta registrada com sucesso.";
    form.reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    notice.className = "notice error";
    notice.textContent = error.message;
  }
}
