# RUNBOOK — Continuidade do projeto LimpaAí

## Início de cada sessão

1. Ler `GOAL.md`.
2. Ler `AGENT-CONTEXT.md`.
3. Ler o relatório mais recente em `relatorios/`.
4. Auditar o estado real do repositório, ambiente e banco.
5. Escolher somente um objetivo verificável para a rodada.

## Antes de alterar

- Registrar o problema observado.
- Identificar arquivos e componentes afetados.
- Definir testes de aceite.
- Criar backup ou ponto de restauração.

## Após alterar

- Rodar testes locais.
- Rodar lint, tipagem, build e testes automatizados.
- Validar migrações em ambiente seguro.
- Publicar em homologação.
- Executar teste público do fluxo alterado.
- Registrar evidências no relatório.

## Regra de relatório

Criar um arquivo em `relatorios/YYYY-MM-DD_HHMM_<objetivo>.md` contendo:

- objetivo;
- estado anterior;
- alterações;
- arquivos afetados;
- testes executados;
- resultados;
- falhas;
- rollback ou correção;
- estado final honesto;
- próximo passo recomendado.

## Estados permitidos

- `OK`: todos os testes obrigatórios aprovados.
- `PARCIAL`: parte concluída, com pendências explícitas.
- `FALHOU`: objetivo não alcançado ou regressão detectada.
- `BLOQUEADO`: depende de credencial, decisão, fornecedor ou arquivo ausente.

Nunca registrar `OK` se algum teste obrigatório falhar.
