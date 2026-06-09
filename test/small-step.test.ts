import assert from "node:assert/strict";
import test from "node:test";
import { l2Evaluate, l2EvalSmallStep, l2IsTerminal, l2StepSmallStep } from "../src/evaluator/evaluator.js";
import { expr, RuntimeError, type } from "../src/index.js";

const { assign, binary, bool, deref, ifThenElse, int, letIn, newRef, seq, unit, variable, whileDo } = expr;

test("avalia operadores +, < e =", () => {
  assert.deepStrictEqual(l2EvalSmallStep(binary("+", int(34), int(35))), int(69));
  assert.deepStrictEqual(l2EvalSmallStep(binary("<", int(34), int(35))), bool(true));
  assert.deepStrictEqual(l2EvalSmallStep(binary("=", int(35), int(35))), bool(true));
});

test("avalia if por small-step", () => {
  assert.deepStrictEqual(l2EvalSmallStep(ifThenElse(bool(true), int(69), int(420))), int(69));
  assert.deepStrictEqual(l2EvalSmallStep(ifThenElse(bool(false), int(69), int(420))), int(420));
});

test("avalia let por substituicao com shadowing lexico", () => {
  const program = letIn(
    "a",
    type.int(),
    int(34),
    letIn("a", type.int(), int(35), variable("a")),
  );

  assert.deepStrictEqual(l2EvalSmallStep(program), int(35));
});

test("nao vaza escopo de let para fora da sequencia", () => {
  const program = seq(
    letIn("a", type.int(), int(420), unit()),
    variable("a"),
  );

  assert.throws(() => l2EvalSmallStep(program), RuntimeError);
});

test("avalia new, deref e atribuicao com store", () => {
  const program = letIn(
    "x",
    type.ref(type.int()),
    newRef(int(0)),
    seq(assign(variable("x"), int(41)), binary("+", deref(variable("x")), int(1))),
  );

  const result = l2Evaluate(program);
  assert.deepStrictEqual(result.value, int(42));
  assert.deepStrictEqual(result.store.get(0), int(41));
});

test("avalia while por desdobramento para if", () => {
  const program = letIn(
    "x",
    type.ref(type.int()),
    newRef(int(0)),
    seq(
      whileDo(
        binary("<", deref(variable("x")), int(3)),
        assign(variable("x"), binary("+", deref(variable("x")), int(1))),
      ),
      deref(variable("x")),
    ),
  );

  assert.deepStrictEqual(l2EvalSmallStep(program), int(3));
});

test("executa um passo por vez", () => {
  const first = l2StepSmallStep({ expression: binary("+", int(1), int(2)), store: new Map() });

  assert.deepStrictEqual(first?.expression, int(3));
  assert.strictEqual(l2IsTerminal(first!.expression), true);
});
