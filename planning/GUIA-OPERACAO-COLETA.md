# GUIA DE OPERAÇÃO DA COLETA — LIMPAÍ

## Objetivo

Aplicar entrevistas reais sem confundir criação da ferramenta com validação do
negócio.

## Iniciar no computador

```powershell
cd D:\CLI\tiago\limpaai
.\scripts\start-validation-app.ps1
```

Abrir:

- http://localhost:4173

## Usar pelo celular na mesma rede

```powershell
.\scripts\start-validation-app.ps1 -Lan
```

O script exibirá o endereço IP local.

Use somente em rede Wi-Fi confiável.

## Encerrar

```powershell
.\scripts\stop-validation-app.ps1
```

## Criar backup

```powershell
.\scripts\backup-validation-data.ps1
```

Com CSV:

```powershell
.\scripts\backup-validation-data.ps1 -ExportCsv
```

## Meta mínima

- 20 clientes;
- 15 profissionais.

## Regras de aplicação

- registrar somente respostas reais;
- não induzir resposta positiva;
- não prometer serviço ou renda;
- não inventar preço aceito;
- solicitar contato apenas com autorização;
- não publicar os arquivos JSON no Git;
- criar backup ao fim de cada dia de entrevistas.

## Sequência sugerida

1. Entrevistar 5 clientes.
2. Entrevistar 5 profissionais.
3. Revisar se as perguntas estão sendo compreendidas.
4. Corrigir apenas problemas claros de formulário.
5. Completar as amostras mínimas.
6. Exportar CSV.
7. Consolidar a matriz.
8. Atualizar o relatório do GOAL.

## Critério de parada

Se as primeiras 10 entrevistas mostrarem rejeição forte ou incompreensão
generalizada, interromper a coleta e revisar a hipótese antes de ampliar a
amostra.

Desenvolvido por Clan Digital — https://clanmarketing.com.br
