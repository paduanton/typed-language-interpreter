# Roadmap de desenvolvimento

Este projeto implementa a linguagem L2 do enunciado em Node.js com TypeScript, tratando TypeScript como a alternativa estaticamente tipada ao OCaml solicitado originalmente.

## Etapas

1. Base do projeto
   - Configurar Node.js 24.16.0+ na linha LTS 24, npm 11.13.0, TypeScript 6.0.3+, scripts de build/teste e CLI.
   - Manter o primeiro commit sem implementacao da linguagem, apenas com o projeto compilando e rodando.
   - Definir AST, tipos, erros, formatadores e testes de sanidade.

2. Analise lexica e sintatica
   - Evoluir o lexer para reportar linha/coluna.
   - Cobrir toda a gramatica concreta combinada com a sintaxe abstrata do enunciado.
   - Adicionar testes de precedencia, associatividade e mensagens de erro.

3. Sistema de tipos
   - Validar todas as regras `T-INT`, `T-BOOL`, `T-OP+`, `T-OP<`, `T-IF`, `T-VAR`, `T-LET`, `T-ATR`, `T-DEREF`, `T-NEW`, `T-UNIT`, `T-WHILE` e `T-SEQ`.
   - Separar testes positivos e negativos por regra.

4. Avaliador small-step
   - Implementar e testar cada regra operacional do enunciado.
   - Manter a memoria como estrutura imutavel para facilitar depuracao e testes.
   - Expor modo de rastreamento dos passos na CLI.

5. Entrega
   - Documentar sintaxe concreta aceita.
   - Incluir exemplos representativos.
   - Garantir `npm run check`, `npm test` e `npm run build` verdes.
