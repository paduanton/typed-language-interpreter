import { expr, type, type BinaryOperator, type L2Expression, type L2Type } from "../l2/ast.js";
import { LexicalError, ParseError } from "../l2/errors.js";
import { lexerL2, toArrayAsync, type Token } from "../lexer/lexer.js";

export async function parse(source: string): Promise<L2Expression> {
  return parseTokens(await toArrayAsync(lexerL2().readStringAsync(source)));
}

export function parseTokens(tokens: readonly Token[]): L2Expression {
  const lexicalError = tokens.find((token) => token.kind === "Error");
  if (lexicalError) {
    throw new LexicalError(`${lexicalError.text} em ${lexicalError.location.row}:${lexicalError.location.col}.`);
  }

  const parser = new Parser(tokens);
  const expression = parser.parseExpression();
  parser.expectEOF();
  return expression;
}

class Parser {
  #position = 0;

  constructor(private readonly tokens: readonly Token[]) {}

  parseExpression(): L2Expression {
    return this.#parseSequence();
  }

  #parseSequence(): L2Expression {
    let expression = this.#parseAssignment();

    while (this.#matchPunctuation(";")) {
      expression = expr.seq(expression, this.#parseAssignment());
    }

    return expression;
  }

  #parseAssignment(): L2Expression {
    const reference = this.#parseComparison();

    if (this.#matchPunctuation(":=")) {
      return expr.assign(reference, this.#parseAssignment());
    }

    return reference;
  }

  #parseComparison(): L2Expression {
    let expression = this.#parseAddition();

    while (this.#matchPunctuation("<") || this.#matchPunctuation("=")) {
      const operator = this.#previous().text as BinaryOperator;
      expression = expr.binary(operator, expression, this.#parseAddition());
    }

    return expression;
  }

  #parseAddition(): L2Expression {
    let expression = this.#parseUnary();

    while (this.#matchPunctuation("+")) {
      expression = expr.binary("+", expression, this.#parseUnary());
    }

    return expression;
  }

  #parseUnary(): L2Expression {
    if (this.#matchKeyword("new")) return expr.newRef(this.#parseUnary());
    if (this.#matchPunctuation("!")) return expr.deref(this.#parseUnary());
    return this.#parsePrimary();
  }

  #parsePrimary(): L2Expression {
    if (this.#matchKind("Integer")) return expr.int(Number(this.#previous().text));
    if (this.#matchKeyword("true")) return expr.bool(true);
    if (this.#matchKeyword("false")) return expr.bool(false);
    if (this.#matchKind("Identifier")) return expr.variable(this.#previous().text);

    if (this.#matchKeyword("let")) {
      const name = this.#expectKind("Identifier").text;
      this.#expectPunctuation(":");
      const annotation = this.#parseType();
      this.#expectPunctuation("=");
      const value = this.parseExpression();
      this.#expectKeyword("in");
      return expr.letIn(name, annotation, value, this.parseExpression());
    }

    if (this.#matchKeyword("if")) {
      const condition = this.parseExpression();
      this.#expectKeyword("then");
      const thenBranch = this.parseExpression();
      this.#expectKeyword("else");
      return expr.ifThenElse(condition, thenBranch, this.parseExpression());
    }

    if (this.#matchKeyword("while")) {
      const condition = this.parseExpression();
      this.#expectKeyword("do");
      return expr.whileDo(condition, this.#parseAssignment());
    }

    if (this.#matchPunctuation("(")) {
      if (this.#matchPunctuation(")")) return expr.unit();

      const expression = this.parseExpression();
      this.#expectPunctuation(")");
      return expression;
    }

    throw this.#error(`Expressao esperada, obtido ${this.#describe(this.#peek())}.`);
  }

  #parseType(): L2Type {
    if (this.#matchKeyword("int")) return type.int();
    if (this.#matchKeyword("bool")) return type.bool();
    if (this.#matchKeyword("unit")) return type.unit();
    if (this.#matchKeyword("ref")) return type.ref(this.#parseType());

    if (this.#matchPunctuation("(")) {
      const parsedType = this.#parseType();
      this.#expectPunctuation(")");
      return parsedType;
    }

    throw this.#error(`Tipo esperado, obtido ${this.#describe(this.#peek())}.`);
  }

  expectEOF(): void {
    const token = this.#peek();
    if (token.kind !== "EOF") {
      throw this.#error(`Fim da entrada esperado, obtido ${this.#describe(token)}.`);
    }
    this.#position += 1;
  }

  #matchKind(kind: Token["kind"]): boolean {
    if (this.#peek().kind !== kind) return false;
    this.#position += 1;
    return true;
  }

  #matchKeyword(text: string): boolean {
    const token = this.#peek();
    if (token.kind !== "Keyword" || token.text !== text) return false;
    this.#position += 1;
    return true;
  }

  #matchPunctuation(text: string): boolean {
    const token = this.#peek();
    if (token.kind !== "Punctuation" || token.text !== text) return false;
    this.#position += 1;
    return true;
  }

  #expectKind(kind: Token["kind"]): Token {
    const token = this.#peek();
    if (token.kind !== kind) throw this.#error(`${kind} esperado, obtido ${this.#describe(token)}.`);
    this.#position += 1;
    return token;
  }

  #expectKeyword(text: string): void {
    if (!this.#matchKeyword(text)) throw this.#error(`'${text}' esperado, obtido ${this.#describe(this.#peek())}.`);
  }

  #expectPunctuation(text: string): void {
    if (!this.#matchPunctuation(text)) throw this.#error(`'${text}' esperado, obtido ${this.#describe(this.#peek())}.`);
  }

  #peek(): Token {
    return this.tokens[this.#position] ?? { kind: "EOF", text: "", location: this.#lastLocation() };
  }

  #previous(): Exclude<Token, { kind: "EOF" | "Error" }> {
    return this.tokens[this.#position - 1] as Exclude<Token, { kind: "EOF" | "Error" }>;
  }

  #lastLocation(): Token["location"] {
    return this.tokens[this.tokens.length - 1]?.location ?? { row: 1, col: 1 };
  }

  #describe(token: Token): string {
    if (token.kind === "EOF") return "fim da entrada";
    return `${token.kind} '${token.text}' em ${token.location.row}:${token.location.col}`;
  }

  #error(message: string): ParseError {
    return new ParseError(message);
  }
}
