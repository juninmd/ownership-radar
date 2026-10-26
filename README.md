# Ownership Radar

Extensão de navegador (Manifest V3) para o GitHub que analisa o histórico recente de commits
dos arquivos de um Pull Request e sugere revisores/donos de código, mostrando o "porquê" de cada
sugestão direto na interface do GitHub.

## Como funciona

- O content script roda em `https://github.com/*/*/pull/*`.
- Busca os arquivos do PR e os commits recentes de cada arquivo via `https://api.github.com`.
- Calcula a propriedade por autor e exibe um widget "Suggested Reviewers (Radar)" na barra lateral.
- Também há suporte a CODEOWNERS, detecção de monorepo, tendências e exportação CSV
  (`src/csv-exporter.js`).

## Desenvolvimento

```bash
npm install
npm run typecheck   # tsc --noEmit
npm test            # vitest + node:test
npm run build       # vite build (gera dist/content.js)
```

Para testar localmente: rode `npm run build`, abra `chrome://extensions`, ative o modo de
desenvolvedor e use "Carregar sem compactação" apontando para esta pasta.

## Segurança

Valores exportados em CSV que começam com `=`, `+`, `-` ou `@` recebem um apóstrofo inicial
para evitar injeção de fórmulas em planilhas.
