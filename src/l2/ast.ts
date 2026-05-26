export type L2Type =
  | { kind: "int" }
  | { kind: "bool" }
  | { kind: "unit" }
  | { kind: "ref"; valueType: L2Type };

export type BinaryOperator = "+" | "<" | "=";

export type L2Expression =
  | { kind: "int"; value: number }
  | { kind: "bool"; value: boolean }
  | { kind: "unit" }
  | { kind: "variable"; name: string }
  | { kind: "binary"; operator: BinaryOperator; left: L2Expression; right: L2Expression }
  | { kind: "if"; condition: L2Expression; thenBranch: L2Expression; elseBranch: L2Expression }
  | { kind: "let"; name: string; annotation: L2Type; value: L2Expression; body: L2Expression }
  | { kind: "assign"; reference: L2Expression; value: L2Expression }
  | { kind: "deref"; reference: L2Expression }
  | { kind: "new"; value: L2Expression }
  | { kind: "seq"; first: L2Expression; second: L2Expression }
  | { kind: "while"; condition: L2Expression; body: L2Expression };

export const type = {
  int: (): L2Type => ({ kind: "int" }),
  bool: (): L2Type => ({ kind: "bool" }),
  unit: (): L2Type => ({ kind: "unit" }),
  ref: (valueType: L2Type): L2Type => ({ kind: "ref", valueType }),
};

export const expr = {
  int: (value: number): L2Expression => ({ kind: "int", value }),
  bool: (value: boolean): L2Expression => ({ kind: "bool", value }),
  unit: (): L2Expression => ({ kind: "unit" }),
  variable: (name: string): L2Expression => ({ kind: "variable", name }),
  binary: (operator: BinaryOperator, left: L2Expression, right: L2Expression): L2Expression => ({
    kind: "binary",
    operator,
    left,
    right,
  }),
  ifThenElse: (condition: L2Expression, thenBranch: L2Expression, elseBranch: L2Expression): L2Expression => ({
    kind: "if",
    condition,
    thenBranch,
    elseBranch,
  }),
  letIn: (name: string, annotation: L2Type, value: L2Expression, body: L2Expression): L2Expression => ({
    kind: "let",
    name,
    annotation,
    value,
    body,
  }),
  assign: (reference: L2Expression, value: L2Expression): L2Expression => ({ kind: "assign", reference, value }),
  deref: (reference: L2Expression): L2Expression => ({ kind: "deref", reference }),
  newRef: (value: L2Expression): L2Expression => ({ kind: "new", value }),
  seq: (first: L2Expression, second: L2Expression): L2Expression => ({ kind: "seq", first, second }),
  whileDo: (condition: L2Expression, body: L2Expression): L2Expression => ({ kind: "while", condition, body }),
};
