import assert from "node:assert/strict";
import test from "node:test";
import { expr, formatType, inferType, parse, type } from "../src/index.js";

test("parseia literais, variaveis, unit e operadores", async () => {
  assert.deepEqual(await parse("42"), expr.int(42));
  assert.deepEqual(await parse("-42"), expr.int(-42));
  assert.deepEqual(await parse("true"), expr.bool(true));
  assert.deepEqual(await parse("false"), expr.bool(false));
  assert.deepEqual(await parse("()"), expr.unit());
  assert.deepEqual(await parse("x"), expr.variable("x"));
  assert.deepEqual(await parse("1 + 2 < 4"), expr.binary("<", expr.binary("+", expr.int(1), expr.int(2)), expr.int(4)));
  assert.deepEqual(await parse("1 = 1"), expr.binary("=", expr.int(1), expr.int(1)));
});

test("parseia let, if, referencias, atribuicao, sequencia e while", async () => {
  const program = await parse("let x: ref int = new 0 in { while !x < 3 do { x := !x + 1 }; !x }");

  assert.deepEqual(
    program,
    expr.letIn(
      "x",
      type.ref(type.int()),
      expr.newRef(expr.int(0)),
      expr.seq(
        expr.whileDo(
          expr.binary("<", expr.deref(expr.variable("x")), expr.int(3)),
          expr.assign(expr.variable("x"), expr.binary("+", expr.deref(expr.variable("x")), expr.int(1))),
        ),
        expr.deref(expr.variable("x")),
      ),
    ),
  );
  assert.equal(formatType(inferType(program)), "int");
});

test("parseia anotacoes de tipo compostas", async () => {
  const program = await parse("let x: ref ref bool = new new true in { !!x }");

  assert.equal(formatType(inferType(program)), "bool");
});
