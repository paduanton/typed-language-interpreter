# typed-language-interpreter

Interpretador em Node.js + TypeScript para a linguagem L2 do enunciado, com construcoes imperativas, referencias, atribuicao, sequenciamento e avaliacao small-step.

## Requisitos

- Node.js 24.16.0 ou superior na linha 24 LTS
- npm 11.13.0, incluido no Node.js 24.16.0
- TypeScript 6.0.3 ou superior, instalado pelas dependencias do projeto

Nota: em 26 de maio de 2026, Node.js 26.2.0 e a release oficial mais recente no canal `Current`, mas ainda nao e LTS. Como vamos usar a opcao mais conservadora, o projeto mira Node.js 24.16.0 LTS.

## Comandos

```bash
nvm use
npm install
npm run check
npm test
npm run build
npm run dev
npm start
```

## Estado inicial

A base deste primeiro commit inclui somente:

- Configuracao de Node.js LTS e TypeScript.
- Scripts de compilacao, checagem, execucao e teste.
- Estrutura inicial em `src/`.
- Roadmap para implementar o interpretador nas proximas etapas.

O plano incremental esta em [docs/roadmap.md](docs/roadmap.md).
