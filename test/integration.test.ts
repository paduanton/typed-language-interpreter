import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { formatType, inferType, l2Evaluate, parse } from "../src/index.js";

test("executa programa L2 completo a partir de texto fonte", async () => {
  const source = "let x: ref int = new 0 in { while !x < 3 do { x := !x + 1 }; !x }";
  const expression = await parse(source);
  const inferredType = inferType(expression);
  const result = l2Evaluate(expression);

  assert.equal(formatType(inferredType), "int");
  assert.deepEqual(result.value, { kind: "int", value: 3 });
});

test("rejeita erro lexico antes da analise sintatica", async () => {
  await assert.rejects(() => parse("let x: int = 1 @ in { x }"), {
    name: "LexicalError",
  });
});

const exampleCases = [
  { file: "examples/basic.l2", type: "int", value: { kind: "int", value: 3 } },
  { file: "examples/let-if.l2", type: "int", value: { kind: "int", value: 11 } },
  { file: "examples/references.l2", type: "int", value: { kind: "int", value: 42 } },
  { file: "examples/sequence.l2", type: "int", value: { kind: "int", value: 3 } },
  { file: "examples/while.l2", type: "int", value: { kind: "int", value: 5 } },
] as const;

for (const example of exampleCases) {
  test(`executa exemplo ${example.file}`, async () => {
    const source = await readFile(example.file, "utf8");
    const expression = await parse(source);
    const inferredType = inferType(expression);
    const result = l2Evaluate(expression);

    assert.equal(formatType(inferredType), example.type);
    assert.deepEqual(result.value, example.value);
  });
}
