import { BinaryOperation, IfThenElse, L2Expression, LetExpression, SeqExpression, Variable } from "../l2/ast.js";

type LetBinding = { name: string, value: L2Expression };

export class SmallStepInterpreter {
    bindings:  LetBinding[] = [];
};

export function l2IsTerminal(expr: L2Expression) {
    return expr.kind == "int" 
        || expr.kind == "bool"
        || expr.kind == "unit";
}

export function l2EvalSmallStep(expr: L2Expression, interpreter: SmallStepInterpreter = new SmallStepInterpreter()): L2Expression {
    switch(expr.kind) {
    case "int": {
        return expr;
    }
    case "bool": {
        return expr;
    }
    case "unit": {
        return expr;
    }
    case "variable": {
        return l2EvalVar(expr, interpreter);
    }
    case "binary": {
        return l2EvalBinOp(expr, interpreter);
    }
    case "if": {
        return l2EvalIf(expr, interpreter);
    }
    case "let": {
        return l2EvalLetIn(expr, interpreter);
    }
    case "assign": {
        throw "TODO";
    }
    case "deref": {
        throw "TODO";
    }
    case "new": {
        throw "TODO";
    }
    case "seq": {
        return l2EvalSeq(expr, interpreter);
    }
    case "while": {
        throw "TODO";
    }
    default:
        throw "Unreachable";
    }
}

function l2EvalBinOp(binop: BinaryOperation, interpreter: SmallStepInterpreter): L2Expression {
    const { operator } = binop;
    let { left, right } = binop;
    
    left  = l2EvalSmallStep(left, interpreter);
    right = l2EvalSmallStep(right, interpreter);

    switch (operator) {
    case "+": {
        if (left.kind == "int" && right.kind == "int")
            return { kind: "int", value: left.value + right.value };
    } break;
    case "<": {
        if (left.kind == "int" && right.kind == "int")
            return { kind: "bool", value: left.value < right.value };
    } break;
    case "=": {
        if (left.kind == "int" && right.kind == "int")
            return { kind: "bool", value: left.value === right.value };
    } break;
    default:
        throw "Unreachable";
    }
    return binop;
}

function l2EvalIf(ifExp: IfThenElse, interpreter: SmallStepInterpreter): L2Expression {
    let { condition, thenBranch, elseBranch } = ifExp;
    
    condition = l2EvalSmallStep(condition, interpreter);
    if (condition.kind !== "bool") 
        return ifExp;
    if (condition.value)
        return l2EvalSmallStep(thenBranch, interpreter);
    else
        return l2EvalSmallStep(elseBranch, interpreter);
}

function l2EvalLetIn(letExp: LetExpression, interpreter: SmallStepInterpreter): L2Expression {
    let { name, value, body } = letExp;
    value = l2EvalSmallStep(value, interpreter);
    interpreter.bindings.push({ name, value });
    return l2EvalSmallStep(body, interpreter);
}

function l2EvalVar(varExp: Variable, interpreter: SmallStepInterpreter): L2Expression {
    for (let i = interpreter.bindings.length - 1; i >= 0; --i) {
        const binding = interpreter.bindings[i]!;
        if (binding.name === varExp.name) {
            return binding.value;
        }
    }
    return varExp;
}

function l2EvalSeq(seqExp: SeqExpression, interpreter: SmallStepInterpreter): L2Expression {
    const saved = interpreter.bindings.length;
    l2EvalSmallStep(seqExp.first, interpreter);
    interpreter.bindings.length = saved;
    return l2EvalSmallStep(seqExp.second, interpreter);
}
