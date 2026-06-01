import * as readline from 'node:readline';
import * as fs from 'fs';
import { Readable } from 'node:stream';

export type Location = {
    row: number;
    col: number;
};

export type Token = { location: Location; kind: 'EOF';         text: ''     }  
                  | { location: Location; kind: 'Identifier';  text: string }  
                  | { location: Location; kind: 'Natural';     text: string }  
                  | { location: Location; kind: 'Keyword';     text: string }  
                  | { location: Location; kind: 'Punctuation'; text: string }
                  | { location: Location; kind: 'Error';       text: string }
                  ;  

export class Lexer {
    #punctuations:       string[];
    #keywords:           string[];
    #identifierPattern:  RegExp;
    #naturalPattern:     RegExp;
    #location:           Location;
    
    #fixRegex(regex: RegExp): RegExp {
        return new RegExp(`^(${regex.source})$`, regex.flags);
    }

    constructor(punctuations: string[], keywords: string[], identifierPattern: RegExp, naturalPattern: RegExp) {
        this.#punctuations      = punctuations;
        this.#keywords          = keywords;
        this.#identifierPattern = this.#fixRegex(identifierPattern);
        this.#naturalPattern    = this.#fixRegex(naturalPattern);
        this.#location          = {row:1,col:1};
        
        this.#punctuations.sort((a, b) => b.length - a.length);
    }
    
    #isAtomic(word: string): boolean {
        return this.#identifierPattern.test(word) || this.#naturalPattern.test(word);
    }

    #isSpace(word: string): boolean {
        return /\s/.test(word);
    }

    async *readStreamAsync(inputStream: Readable): AsyncGenerator<Token> {
        const lines = readline.createInterface({
            input: inputStream
        });
        for await (let line of lines) {
            let wordCursor = 0;
            Q0: while(wordCursor < line.length) {
                
                while (wordCursor < line.length && this.#isSpace(line[wordCursor]!)) {
                    wordCursor++;
                }

                let wordEnd = wordCursor; 
                while(wordEnd < line.length && this.#isAtomic(line[wordEnd]!)) {
                    wordEnd++;
                }

                if (wordCursor === wordEnd && wordEnd < line.length) {
                    while (wordEnd < line.length && !this.#isSpace(line[wordEnd]!)) {
                        wordEnd++;
                    }
                }

                const rest = line.slice(wordCursor, wordEnd);
                const location = { row: this.#location.row, col: wordCursor + 1 };
                 
                for (const punct of this.#punctuations) {
                    if (rest.startsWith(punct)) {
                        yield { location, kind: 'Punctuation', text: punct };
                        wordCursor += punct.length;
                        continue Q0;
                    }
                }

                const identMatch = rest.match(this.#identifierPattern);
                if (identMatch) {
                    const text = identMatch[0];
                    const isKeyword = this.#keywords.includes(text);
                    
                    yield { 
                        location, 
                        kind: isKeyword ? 'Keyword' : 'Identifier', 
                        text 
                    };
                    wordCursor += text.length;
                    continue Q0;
                }

                const naturalMatch = rest.match(this.#naturalPattern);
                if (naturalMatch) {
                    const text = naturalMatch[0];
                    yield { location, kind: 'Natural', text };
                    wordCursor += text.length;
                    continue Q0;
                }
                
                yield { location, kind: 'Error', text: `Invalid Token: "${rest}"`};
                return;
            }
            this.#location.row += 1;
        }
        yield { location: this.#location, kind: "EOF", text:"" };
    }

    async *readFileAsync(filePath: string): AsyncGenerator<Token> {
        yield* this.readStreamAsync(fs.createReadStream(filePath));
    }

    async *readStringAsync(string: string): AsyncGenerator<Token> {
        yield* this.readStreamAsync(Readable.from(string));
    }
}

export async function toArrayAsync<T>(async: AsyncGenerator<T>): Promise<T[]> {
  const array: T[] = [];
  for await (const item of async) {
    array.push(item);
  }
  return array;
};

export function lexerL2(): Lexer {
    return new Lexer(
        ["=>", ":=", "+", "-", "*", "!", ">", "<", "(", ")", ";", "=", ":"],
        ["new", "while", "let", "if", "then", "else", "in", "int", "bool", "unit", "ref", "true", "false"],
        /[_a-zA-Z][_a-zA-Z0-9]*/,
        /[1-9][0-9]*|0/
    );
}
