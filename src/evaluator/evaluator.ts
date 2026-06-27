import { expr, type L2Expression, type ValueExpression } from "../l2/ast.js";
import { RuntimeError } from "../l2/errors.js";

export type Store = ReadonlyMap<number, ValueExpression>;

export type SmallStepState = {
  expression: L2Expression;
  store: Store;
};

export type EvaluationResult = SmallStepState & {
  value: ValueExpression;
  steps: number;
};

export class SmallStepInterpreter {
  readonly store: Store;

  constructor(store: Store = new Map()) {
    this.store = store;
  }
}

export function l2IsTerminal(expression: L2Expression): expression is ValueExpression {
  return (
    expression.kind === "int" ||
    expression.kind === "bool" ||
    expression.kind === "unit" ||
    expression.kind === "location"
  );
}

export function l2StepSmallStep(state: SmallStepState): SmallStepState | null {
  const { expression, store } = state;

  if (l2IsTerminal(expression)) return null;

  switch (expression.kind) {
    case "variable":
      throw new RuntimeError(`Variavel livre durante avaliacao: '${expression.name}'.`);
    case "binary":
      return stepBinary(expression, store);
    case "if":
      return stepIf(expression, store);
    case "let":
      return stepLet(expression, store);
    case "assign":
      return stepAssign(expression, store);
    case "deref":
      return stepDeref(expression, store);
    case "new":
      return stepNew(expression, store);
    case "seq":
      return stepSeq(expression, store);
    case "while":
      return {
        expression: expr.ifThenElse(
          expression.condition,
          expr.seq(expression.body, expression),
          expr.unit(),
        ),
        store,
      };
  }
}

export function l2Evaluate(
  expression: L2Expression,
  initialStore: Store = new Map(),
  maxSteps = 10_000,
): EvaluationResult {
  let current: SmallStepState = { expression, store: initialStore };

  for (let steps = 0; steps <= maxSteps; steps += 1) {
    if (l2IsTerminal(current.expression)) {
      return { ...current, value: current.expression, steps };
    }

    const next = l2StepSmallStep(current);
    if (!next) throw new RuntimeError("Avaliacao parou antes de produzir um valor.");
    current = next;
  }

  throw new RuntimeError(`Limite de ${maxSteps} passos excedido.`);
}

export function l2EvalSmallStep(
  expression: L2Expression,
  interpreter: SmallStepInterpreter = new SmallStepInterpreter(),
): L2Expression {
  return l2Evaluate(expression, interpreter.store).value;
}

function stepBinary(expression: Extract<L2Expression, { kind: "binary" }>, store: Store): SmallStepState {
  if (!l2IsTerminal(expression.left)) {
    const next = l2StepSmallStep({ expression: expression.left, store });
    if (!next) throw new RuntimeError("Operando esquerdo irredutivel em operacao binaria.");
    return { expression: { ...expression, left: next.expression }, store: next.store };
  }

  if (!l2IsTerminal(expression.right)) {
    const next = l2StepSmallStep({ expression: expression.right, store });
    if (!next) throw new RuntimeError("Operando direito irredutivel em operacao binaria.");
    return { expression: { ...expression, right: next.expression }, store: next.store };
  }

  if (expression.operator === "+") {
    assertInt(expression.left, "O lado esquerdo de + deve avaliar para int.");
    assertInt(expression.right, "O lado direito de + deve avaliar para int.");
    return { expression: expr.int(expression.left.value + expression.right.value), store };
  }

  if (expression.operator === "<") {
    assertInt(expression.left, "O lado esquerdo de < deve avaliar para int.");
    assertInt(expression.right, "O lado direito de < deve avaliar para int.");
    return { expression: expr.bool(expression.left.value < expression.right.value), store };
  }

  return { expression: expr.bool(valueEquals(expression.left, expression.right)), store };
}

function stepIf(expression: Extract<L2Expression, { kind: "if" }>, store: Store): SmallStepState {
  if (!l2IsTerminal(expression.condition)) {
    const next = l2StepSmallStep({ expression: expression.condition, store });
    if (!next) throw new RuntimeError("Condicao irredutivel em if.");
    return { expression: { ...expression, condition: next.expression }, store: next.store };
  }

  if (expression.condition.kind !== "bool") {
    throw new RuntimeError("A condicao de if deve avaliar para bool.");
  }

  return { expression: expression.condition.value ? expression.thenBranch : expression.elseBranch, store };
}

function stepLet(expression: Extract<L2Expression, { kind: "let" }>, store: Store): SmallStepState {
  if (!l2IsTerminal(expression.value)) {
    const next = l2StepSmallStep({ expression: expression.value, store });
    if (!next) throw new RuntimeError("Expressao ligada por let irredutivel.");
    return { expression: { ...expression, value: next.expression }, store: next.store };
  }

  return { expression: substitute(expression.body, expression.name, expression.value), store };
}

function stepAssign(expression: Extract<L2Expression, { kind: "assign" }>, store: Store): SmallStepState {
  if (!l2IsTerminal(expression.value)) {
    const next = l2StepSmallStep({ expression: expression.value, store });
    if (!next) throw new RuntimeError("Valor de atribuicao irredutivel.");
    return { expression: { ...expression, value: next.expression }, store: next.store };
  }

  if (expression.reference.kind !== "location") {
    throw new RuntimeError("O lado esquerdo de := deve ser uma localizacao interna.");
  }

  if (!store.has(expression.reference.address)) {
    throw new RuntimeError(`Localizacao inexistente: ${expression.reference.address}.`);
  }

  const nextStore = new Map(store);
  nextStore.set(expression.reference.address, expression.value);
  return { expression: expr.unit(), store: nextStore };
}

function stepDeref(expression: Extract<L2Expression, { kind: "deref" }>, store: Store): SmallStepState {
  if (!l2IsTerminal(expression.reference)) {
    const next = l2StepSmallStep({ expression: expression.reference, store });
    if (!next) throw new RuntimeError("Referencia de dereferencia irredutivel.");
    return { expression: { ...expression, reference: next.expression }, store: next.store };
  }

  if (expression.reference.kind !== "location") {
    throw new RuntimeError("O operador ! deve avaliar uma expressao de tipo ref para localizacao.");
  }

  const value = store.get(expression.reference.address);
  if (!value) throw new RuntimeError(`Localizacao inexistente: ${expression.reference.address}.`);
  return { expression: value, store };
}

function stepNew(expression: Extract<L2Expression, { kind: "new" }>, store: Store): SmallStepState {
  if (!l2IsTerminal(expression.value)) {
    const next = l2StepSmallStep({ expression: expression.value, store });
    if (!next) throw new RuntimeError("Valor de new irredutivel.");
    return { expression: { ...expression, value: next.expression }, store: next.store };
  }

  const address = nextAddress(store);
  const nextStore = new Map(store);
  nextStore.set(address, expression.value);
  return { expression: expr.location(address), store: nextStore };
}

function stepSeq(expression: Extract<L2Expression, { kind: "seq" }>, store: Store): SmallStepState {
  if (expression.first.kind === "unit") {
    return { expression: expression.second, store };
  }

  if (l2IsTerminal(expression.first)) {
    throw new RuntimeError("A primeira expressao de uma sequencia deve avaliar para unit.");
  }

  const next = l2StepSmallStep({ expression: expression.first, store });
  if (!next) throw new RuntimeError("Primeira expressao da sequencia irredutivel.");
  return { expression: { ...expression, first: next.expression }, store: next.store };
}

function substitute(expression: L2Expression, name: string, value: ValueExpression): L2Expression {
  switch (expression.kind) {
    case "int":
    case "bool":
    case "unit":
    case "location":
      return expression;
    case "variable":
      return expression.name === name ? value : expression;
    case "binary":
      return {
        ...expression,
        left: substitute(expression.left, name, value),
        right: substitute(expression.right, name, value),
      };
    case "if":
      return {
        ...expression,
        condition: substitute(expression.condition, name, value),
        thenBranch: substitute(expression.thenBranch, name, value),
        elseBranch: substitute(expression.elseBranch, name, value),
      };
    case "let":
      return expression.name === name
        ? { ...expression, value: substitute(expression.value, name, value) }
        : {
            ...expression,
            value: substitute(expression.value, name, value),
            body: substitute(expression.body, name, value),
          };
    case "assign":
      return {
        ...expression,
        reference: substitute(expression.reference, name, value),
        value: substitute(expression.value, name, value),
      };
    case "deref":
      return { ...expression, reference: substitute(expression.reference, name, value) };
    case "new":
      return { ...expression, value: substitute(expression.value, name, value) };
    case "seq":
      return {
        ...expression,
        first: substitute(expression.first, name, value),
        second: substitute(expression.second, name, value),
      };
    case "while":
      return {
        ...expression,
        condition: substitute(expression.condition, name, value),
        body: substitute(expression.body, name, value),
      };
  }
}

function nextAddress(store: Store): number {
  return store.size === 0 ? 0 : Math.max(...store.keys()) + 1;
}

function assertInt(expression: ValueExpression, message: string): asserts expression is Extract<ValueExpression, { kind: "int" }> {
  if (expression.kind !== "int") throw new RuntimeError(message);
}

function valueEquals(left: ValueExpression, right: ValueExpression): boolean {
  if (left.kind !== right.kind) return false;

  switch (left.kind) {
    case "int":
    case "bool":
      return left.value === (right as typeof left).value;
    case "unit":
      return true;
    case "location":
      return left.address === (right as typeof left).address;
  }
}
