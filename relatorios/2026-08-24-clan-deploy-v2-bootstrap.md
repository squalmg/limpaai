# LimpaAí — Bootstrap Clan Deploy 2.0

## Estado

Branch de implantação inicial: `clan-deploy-v2-bootstrap`.

## Objetivo desta entrega

Criar o primeiro workload nativo do Clan Deploy 2.0 sem alterar o `main` do projeto.

## Arquivos executáveis adicionados

- `package.json`
- `server.mjs`
- `public/index.html`
- `Dockerfile`
- `.dockerignore`
- `clan-deploy.json`

## Contrato de runtime

- Node.js: 22+
- porta: `8080`
- healthcheck: `GET /healthz`
- version: `GET /version`
- Dockerfile: raiz
- build context: raiz
- primeiro ambiente: `staging`

## Regra de promoção

Não promover para produção nesta etapa. Primeiro validar build, start, healthcheck, proxy interno, logs e histórico dentro do Clan Deploy 2.0.

## Próximo passo

Instalar Clan Deploy 2.0, cadastrar o repositório `https://github.com/squalmg/limpaai.git` com a branch `clan-deploy-v2-bootstrap` e executar o primeiro deployment de staging.

Desenvolvido por Clan Digital — https://clanmarketing.com.br/
