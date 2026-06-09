import { readFile } from "node:fs/promises";
import { formatType, inferType, l2Evaluate, parse, type ValueExpression } from "./index.js";

const source = await readSource(process.argv.slice(2));
const expression = await parse(source);
const inferredType = inferType(expression);
const result = l2Evaluate(expression);

console.log(`type: ${formatType(inferredType)}`);
console.log(`value: ${formatValue(result.value)}`);
console.log(`steps: ${result.steps}`);

async function readSource(args: string[]): Promise<string> {
  if (args[0] === "-e" || args[0] === "--expr") return args.slice(1).join(" ");
  if (args[0]) return readFile(args[0], "utf8");

  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

function formatValue(value: ValueExpression): string {
  switch (value.kind) {
    case "int":
      return String(value.value);
    case "bool":
      return String(value.value);
    case "unit":
      return "()";
    case "location":
      return `loc(${value.address})`;
  }
}
