import assert from "node:assert/strict";
import test from "node:test";
import { lexerL2, Token } from "../src/lexer/Lexer.js";
import { ReadStream } from "node:fs";
import { Readable } from 'stream';

async function toArrayAsync<T>(async: AsyncGenerator<T>): Promise<T[]> {
    const array = [];
    for await (const item of async) {
        array.push(item);
    }
    return array;
}

test("Aceita n", async () => {
    const l = lexerL2();
    const actual = await toArrayAsync(l.readStreamAsync(Readable.from("0 1 2 3 4 5 6 7 8 9") as ReadStream));

    const expected:Token[] = [
        { kind: "Natural", text: "0", location: { row:1, col:1  } },
        { kind: "Natural", text: "1", location: { row:1, col:3  } },
        { kind: "Natural", text: "2", location: { row:1, col:5  } },
        { kind: "Natural", text: "3", location: { row:1, col:7  } },
        { kind: "Natural", text: "4", location: { row:1, col:9  } },
        { kind: "Natural", text: "5", location: { row:1, col:11 } },
        { kind: "Natural", text: "6", location: { row:1, col:13 } },
        { kind: "Natural", text: "7", location: { row:1, col:15 } },
        { kind: "Natural", text: "8", location: { row:1, col:17 } },
        { kind: "Natural", text: "9", location: { row:1, col:19 } },
        { kind: "EOF",     text: "",  location: { row:2, col:1 } },
    ];

    assert.deepEqual(actual, expected);
});

test("Aceita b", async () => {
    const l = lexerL2();
    const actual = await toArrayAsync(l.readStreamAsync(Readable.from("true false") as ReadStream));

    const expected:Token[] = [
        { location: { row:1, col:1  }, kind: "Keyword", text: "true"  },
        { location: { row:1, col:6  }, kind: "Keyword", text: "false" },
        { location: { row:2, col:1 }, kind: "EOF",     text: ""      },
    ];

    assert.deepEqual(actual, expected);
});

