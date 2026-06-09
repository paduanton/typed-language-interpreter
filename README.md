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
npm run dev -- examples/basic.l2
npm run dev -- -e "let x: ref int = new 0 in (x := 1; !x)"
npm start -- examples/basic.l2
```

## Estado atual

A base atual inclui:

- Configuracao de Node.js LTS e TypeScript.
- Scripts de compilacao, checagem, execucao e teste.
- AST em TypeScript para representar programas L2 diretamente.
- Lexer e parser para gerar AST a partir da sintaxe concreta da L2.
- Inferencia/verificacao de tipos para as regras do enunciado.
- Avaliador small-step com store para referencias e localizacoes internas.
- CLI para executar programas L2 a partir de arquivo, stdin ou `-e`.

## Exemplo

```l2
let x: ref int = new 0 in (
  while !x < 3 do x := !x + 1;
  !x
)
```

```text
type: int
value: 3
steps: 32
```

O operador `=` tambem e aceito como extensao para igualdade entre valores do mesmo tipo.

## Documentacao

- [Enunciado L2](docs/enunciado.md)
