export class L2Error extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class TypeInferenceError extends L2Error {}
export class ParseError extends L2Error {}
export class NotImplementedL2Error extends L2Error {}
