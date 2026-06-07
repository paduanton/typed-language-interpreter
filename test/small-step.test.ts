import assert from "node:assert/strict";
import test from "node:test";
import { l2IsTerminal, l2EvalSmallStep, SmallStepInterpreter } from "../src/evaluator/evaluator.js";
import { expr, type } from "../src/index.js";

const { binary, int, ifThenElse, letIn, unit, variable, seq } = expr;

test("Avalia Soma (+)", () => {
    const exp      = binary("+", int(34), int(35));
    const actual   = l2EvalSmallStep(exp);
    const expected = int(69);
    assert.strictEqual(l2IsTerminal(actual), true);
    assert.deepStrictEqual(actual, expected);
});

test("Avalia Then", () => {
    const exp = ifThenElse(binary("=", int(1), int(1)), int(69), int(420));
    const actual   = l2EvalSmallStep(exp);
    const expected = int(69);
    assert.strictEqual(l2IsTerminal(actual), true);
    assert.deepStrictEqual(actual, expected);
});

test("Avalia Else", () => {
    const exp = ifThenElse(binary("=", int(1), int(0)), int(69), int(420));
    const actual   = l2EvalSmallStep(exp);
    const expected = int(420);
    assert.strictEqual(l2IsTerminal(actual), true);
    assert.deepStrictEqual(actual, expected);
});

test("Avalia LetIn", () => {
    const interpreter = new SmallStepInterpreter();
    const exp         = letIn("nice", type.int(), int(69), unit());
    const result      = l2EvalSmallStep(exp, interpreter);
    assert.deepEqual(result, unit());
    assert.strictEqual(interpreter.bindings[0]?.name, "nice", "Let Name");
    assert.deepStrictEqual(interpreter.bindings[0]?.value, int(69), "Let Value");
});

test("Avalia var", () => {
    const exp         = letIn("nice", type.int(), int(69), variable("nice"));
    const result      = l2EvalSmallStep(exp);
    assert.deepStrictEqual(result, int(69));
});

test("Avalia nested var", () => {
    const exp         = letIn("a", type.int(), int(34), 
                            letIn("a", type.int(), int(35),
                                variable("a")
                            )
                        );
    const result      = l2EvalSmallStep(exp);
    assert.deepStrictEqual(result, int(35));
});

test("Avalia add a + b", () => {
    const exp         = letIn("a", type.int(), int(34), 
                            letIn("b", type.int(), int(35),
                                  binary("+", variable("a"), variable("b"))
                                 )
                             );
    const result      = l2EvalSmallStep(exp);
    assert.deepStrictEqual(result, int(69));
});

test("Hoisting nao ocorre em let in", () => {
    const exp         = letIn("a", type.int(), variable("b"), 
                              letIn("b", type.int(), int(35),
                                binary("+", variable("a"), variable("b"))
                                   )
                             );
    const result      = l2EvalSmallStep(exp);
    assert.notDeepStrictEqual(result, int(70));
});

test("Avalia Seq", () => {
    const exp         = seq(
        letIn("a", type.int(), int(420), variable("a")),
        variable("a")
    );
    const result      = l2EvalSmallStep(exp);
    assert.deepStrictEqual(result, variable("a"))
});
