import assert from "node:assert/strict";
import test from "node:test";
import { expr, formatType, inferType, type, TypeInferenceError } from "../src/index.js";

test("infere literais, unit e operacoes aritmeticas/comparativas", () => {
  assert.equal(formatType(inferType(expr.int(1))), "int");
  assert.equal(formatType(inferType(expr.bool(true))), "bool");
  assert.equal(formatType(inferType(expr.unit())), "unit");
  assert.equal(formatType(inferType(expr.binary("+", expr.int(1), expr.int(2)))), "int");
  assert.equal(formatType(inferType(expr.binary("<", expr.int(1), expr.int(2)))), "bool");
});

test("infere variaveis, let e if", () => {
  const program = expr.letIn(
    "x",
    type.int(),
    expr.int(10),
    expr.ifThenElse(expr.binary("<", expr.variable("x"), expr.int(20)), expr.variable("x"), expr.int(0)),
  );

  assert.equal(formatType(inferType(program)), "int");
});

test("infere referencias, atribuicao, dereferencia, sequencia e while", () => {
  const program = expr.letIn(
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
  );

  assert.equal(formatType(inferType(program)), "int");
});

test("rejeita programas que violam regras de tipos", () => {
  assert.throws(() => inferType(expr.binary("+", expr.bool(true), expr.int(1))), TypeInferenceError);
  assert.throws(() => inferType(expr.ifThenElse(expr.bool(true), expr.int(1), expr.bool(false))), TypeInferenceError);
  assert.throws(() => inferType(expr.assign(expr.deref(expr.newRef(expr.int(1))), expr.int(2))), TypeInferenceError);
  assert.throws(() => inferType(expr.deref(expr.int(1))), TypeInferenceError);
  assert.throws(() => inferType(expr.whileDo(expr.bool(true), expr.int(1))), TypeInferenceError);
});
