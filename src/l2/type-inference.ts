import type { L2Expression, L2Type } from "./ast.js";
import { TypeInferenceError } from "./errors.js";

export type TypeEnvironment = ReadonlyMap<string, L2Type>;

export function inferType(expression: L2Expression, environment: TypeEnvironment = new Map()): L2Type {
  switch (expression.kind) {
    case "int":
      return { kind: "int" };
    case "bool":
      return { kind: "bool" };
    case "unit":
      return { kind: "unit" };
    case "variable":
      return inferVariable(expression.name, environment);
    case "binary":
      return inferBinaryExpression(expression, environment);
    case "if":
      expectType(inferType(expression.condition, environment), { kind: "bool" }, "A condicao do if deve ter tipo bool.");
      return inferIfBranches(expression.thenBranch, expression.elseBranch, environment);
    case "let":
      expectType(
        inferType(expression.value, environment),
        expression.annotation,
        `A expressao ligada a '${expression.name}' deve respeitar a anotacao.`,
      );
      return inferType(expression.body, extendEnvironment(environment, expression.name, expression.annotation));
    case "assign": {
      const referenceType = inferType(expression.reference, environment);
      if (referenceType.kind !== "ref") throw new TypeInferenceError("O lado esquerdo de := deve ter tipo ref T.");
      expectType(
        inferType(expression.value, environment),
        referenceType.valueType,
        "O valor atribuido deve ter o tipo armazenado pela referencia.",
      );
      return { kind: "unit" };
    }
    case "deref": {
      const referenceType = inferType(expression.reference, environment);
      if (referenceType.kind !== "ref") {
        throw new TypeInferenceError("O operador ! espera uma expressao de tipo ref T.");
      }
      return referenceType.valueType;
    }
    case "new":
      return { kind: "ref", valueType: inferType(expression.value, environment) };
    case "seq":
      expectType(
        inferType(expression.first, environment),
        { kind: "unit" },
        "A primeira expressao de uma sequencia deve ter tipo unit.",
      );
      return inferType(expression.second, environment);
    case "while":
      expectType(inferType(expression.condition, environment), { kind: "bool" }, "A condicao do while deve ter tipo bool.");
      expectType(inferType(expression.body, environment), { kind: "unit" }, "O corpo do while deve ter tipo unit.");
      return { kind: "unit" };
  }
}

export function typeEquals(left: L2Type, right: L2Type): boolean {
  if (left.kind !== right.kind) return false;
  if (left.kind === "ref" && right.kind === "ref") return typeEquals(left.valueType, right.valueType);
  return true;
}

export function formatType(type: L2Type): string {
  switch (type.kind) {
    case "int":
    case "bool":
    case "unit":
      return type.kind;
    case "ref":
      return `ref ${formatType(type.valueType)}`;
  }
}

function inferVariable(name: string, environment: TypeEnvironment): L2Type {
  const variableType = environment.get(name);
  if (!variableType) throw new TypeInferenceError(`Variavel nao declarada: '${name}'.`);
  return variableType;
}

function inferBinaryExpression(
  expression: Extract<L2Expression, { kind: "binary" }>,
  environment: TypeEnvironment,
): L2Type {
  if (expression.operator === "+") {
    expectType(inferType(expression.left, environment), { kind: "int" }, "O lado esquerdo de + deve ter tipo int.");
    expectType(inferType(expression.right, environment), { kind: "int" }, "O lado direito de + deve ter tipo int.");
    return { kind: "int" };
  }

  if (expression.operator === "<") {
    expectType(inferType(expression.left, environment), { kind: "int" }, "O lado esquerdo de < deve ter tipo int.");
    expectType(inferType(expression.right, environment), { kind: "int" }, "O lado direito de < deve ter tipo int.");
    return { kind: "bool" };
  }

  const leftType = inferType(expression.left, environment);
  const rightType = inferType(expression.right, environment);
  expectType(rightType, leftType, "Os dois lados de = devem ter o mesmo tipo.");
  return { kind: "bool" };
}

function inferIfBranches(thenBranch: L2Expression, elseBranch: L2Expression, environment: TypeEnvironment): L2Type {
  const thenType = inferType(thenBranch, environment);
  const elseType = inferType(elseBranch, environment);
  expectType(elseType, thenType, "Os dois ramos do if devem ter o mesmo tipo.");
  return thenType;
}

function expectType(actual: L2Type, expected: L2Type, message: string): void {
  if (!typeEquals(actual, expected)) {
    throw new TypeInferenceError(`${message} Esperado ${formatType(expected)}, obtido ${formatType(actual)}.`);
  }
}

function extendEnvironment(environment: TypeEnvironment, name: string, valueType: L2Type): TypeEnvironment {
  const nextEnvironment = new Map(environment);
  nextEnvironment.set(name, valueType);
  return nextEnvironment;
}
