# typed-language-interpreter

Interpretador em Node.js + TypeScript para L2.

## Requisitos

- Node.js 24.16.0 ou superior na linha 24 LTS
- npm 11.13.0, incluido no Node.js 24.16.0
- TypeScript 6.0.3 ou superior, instalado pelas dependencias do projeto

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

## Estado atual

A base atual inclui:

- Configuracao de Node.js LTS e TypeScript.
- Scripts de compilacao, checagem, execucao e teste.
- AST em TypeScript para representar programas L2 diretamente.
- Lexer e parser para gerar AST a partir da sintaxe concreta da L2.
- Inferencia/verificacao de tipos para as regras do enunciado.
- Estrutura reservada para avaliador small-step, ainda sem implementacao.

## Documentacao

- [Enunciado L2](docs/enunciado.md)
