import assert from "node:assert/strict";
import test from "node:test";
import { lexerL2, toArrayAsync } from "../src/lexer/lexer.js";
import type { Token } from "../src/lexer/lexer.js";

test("Aceita n", async () => {
    const l = lexerL2();
    const actual = await toArrayAsync(l.readStringAsync("0 1 2 3 4 5 6 7 8 9 -10"));

    const expected:Token[] = [
        { kind: "Integer", text: "0", location: { row:1, col:1  } },
        { kind: "Integer", text: "1", location: { row:1, col:3  } },
        { kind: "Integer", text: "2", location: { row:1, col:5  } },
        { kind: "Integer", text: "3", location: { row:1, col:7  } },
        { kind: "Integer", text: "4", location: { row:1, col:9  } },
        { kind: "Integer", text: "5", location: { row:1, col:11 } },
        { kind: "Integer", text: "6", location: { row:1, col:13 } },
        { kind: "Integer", text: "7", location: { row:1, col:15 } },
        { kind: "Integer", text: "8", location: { row:1, col:17 } },
        { kind: "Integer", text: "9", location: { row:1, col:19 } },
        { kind: "Integer", text: "-10", location: { row:1, col:21 } },
        { kind: "EOF",     text: "",  location: { row:2, col:1 } },
    ];

    assert.deepEqual(actual, expected);
});

test("Aceita b", async () => {
    const l = lexerL2();
    const actual = await toArrayAsync(l.readStringAsync("true false"));

    const expected:Token[] = [
        { location: { row:1, col:1  }, kind: "Keyword", text: "true"  },
        { location: { row:1, col:6  }, kind: "Keyword", text: "false" },
        { location: { row:2, col:1 }, kind: "EOF",     text: ""      },
    ];

    assert.deepEqual(actual, expected);
});

test("Aceita identificador", async () => {
    const l = lexerL2();
    const actual = await toArrayAsync(l.readStringAsync("let foo"));

    const expected:Token[] = [
        { location: { row:1, col:1  }, kind: "Keyword",     text: "let"  },
        { location: { row:1, col:5  }, kind: "Identifier",  text: "foo"  },
        { location: { row:2, col:1 },  kind: "EOF",          text: ""    },
    ];

    assert.deepEqual(actual, expected);
});

test("Aceita pontuacoes da L2", async () => {
    const l = lexerL2();
    const actual = await toArrayAsync(l.readStringAsync(":= + ! < ( ) { } ; = :"));

    const expected: Token[] = [
        { location: { row: 1, col: 1  }, kind: "Punctuation", text: ":=" },
        { location: { row: 1, col: 4  }, kind: "Punctuation", text: "+"  },
        { location: { row: 1, col: 6  }, kind: "Punctuation", text: "!"  },
        { location: { row: 1, col: 8  }, kind: "Punctuation", text: "<"  },
        { location: { row: 1, col: 10 }, kind: "Punctuation", text: "("  },
        { location: { row: 1, col: 12 }, kind: "Punctuation", text: ")"  },
        { location: { row: 1, col: 14 }, kind: "Punctuation", text: "{"  },
        { location: { row: 1, col: 16 }, kind: "Punctuation", text: "}"  },
        { location: { row: 1, col: 18 }, kind: "Punctuation", text: ";"  },
        { location: { row: 1, col: 20 }, kind: "Punctuation", text: "="  },
        { location: { row: 1, col: 22 }, kind: "Punctuation", text: ":"  },
        { location: { row: 2, col: 1  }, kind: "EOF", text: "" },
    ];

    assert.deepEqual(actual, expected);
});

test("Nao acumula localizacao entre leituras da mesma instancia", async () => {
    const l = lexerL2();

    await toArrayAsync(l.readStringAsync("let x"));
    const actual = await toArrayAsync(l.readStringAsync("true"));

    assert.deepEqual(actual, [
        { location: { row: 1, col: 1 }, kind: "Keyword", text: "true" },
        { location: { row: 2, col: 1 }, kind: "EOF", text: "" },
    ]);
});

test("Rejeita identificador invalido", async () => {
    const l = lexerL2();
    const actual = await toArrayAsync(l.readStringAsync("let 1foo"));
    assert.equal(actual[1]?.kind, "Error");
});


