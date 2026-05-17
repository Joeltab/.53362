// ─────────────────────────────────────────────────────────────────────────────
//  LenguajeLexer.js  –  Analizador léxico (equivalente al generado por ANTLR4)
//  Gramática: Lenguaje.g4
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

// Tipos de token  (mirrors ANTLR4 token type constants)
const TokenType = {
  EOF:       0,
  PRINT:     1,
  ID:        2,
  NUMERO:    3,
  IGUAL:     4,
  PUNTOCOMA: 5,
  PLUS:      6,
  MINUS:     7,
  MUL:       8,
  DIV:       9,
  LPAREN:    10,
  RPAREN:    11,
  ERROR_CHAR:12,
};

const TOKEN_NAMES = {
  0:  'EOF',
  1:  'PRINT',
  2:  'ID',
  3:  'NUMERO',
  4:  'IGUAL',
  5:  'PUNTOCOMA',
  6:  'PLUS',
  7:  'MINUS',
  8:  'MUL',
  9:  'DIV',
  10: 'LPAREN',
  11: 'RPAREN',
  12: 'ERROR_CHAR',
};

class Token {
  constructor(type, value, line, col) {
    this.type  = type;
    this.value = value;
    this.line  = line;
    this.col   = col;
  }
  toString() {
    return `Token(${TOKEN_NAMES[this.type]}, '${this.value}', L${this.line}:${this.col})`;
  }
}

class LenguajeLexer {
  constructor(input) {
    this.input  = input;
    this.pos    = 0;
    this.line   = 1;
    this.col    = 1;
    this.tokens = [];
    this.errors = [];
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  peek()    { return this.input[this.pos] ?? null; }
  advance() {
    const ch = this.input[this.pos++];
    if (ch === '\n') { this.line++; this.col = 1; }
    else             { this.col++; }
    return ch;
  }
  isAlpha(c)  { return /[a-zA-Z]/.test(c); }
  isDigit(c)  { return /[0-9]/.test(c); }
  isSpace(c)  { return /[ \t\r\n]/.test(c); }

  // ── Tokenizer principal ───────────────────────────────────────────────────
  tokenize() {
    while (this.pos < this.input.length) {
      const startLine = this.line;
      const startCol  = this.col;
      const ch        = this.peek();

      // Espacios → skip (como la regla WS -> skip de ANTLR)
      if (this.isSpace(ch)) { this.advance(); continue; }

      // Número
      if (this.isDigit(ch)) {
        let num = '';
        while (this.pos < this.input.length && this.isDigit(this.peek())) {
          num += this.advance();
        }
        this.tokens.push(new Token(TokenType.NUMERO, num, startLine, startCol));
        continue;
      }

      // Identificador o palabra reservada 'print'
      if (this.isAlpha(ch)) {
        let word = '';
        while (this.pos < this.input.length && this.isAlpha(this.peek())) {
          word += this.advance();
        }
        const type = word === 'print' ? TokenType.PRINT : TokenType.ID;
        this.tokens.push(new Token(type, word, startLine, startCol));
        continue;
      }

      // Símbolos de un carácter
      const SYMBOLS = {
        '=': TokenType.IGUAL,
        ';': TokenType.PUNTOCOMA,
        '+': TokenType.PLUS,
        '-': TokenType.MINUS,
        '*': TokenType.MUL,
        '/': TokenType.DIV,
        '(': TokenType.LPAREN,
        ')': TokenType.RPAREN,
      };

      if (SYMBOLS[ch] !== undefined) {
        this.advance();
        this.tokens.push(new Token(SYMBOLS[ch], ch, startLine, startCol));
        continue;
      }

      // Carácter desconocido  (ERROR_CHAR en la gramática ANTLR)
      this.advance();
      const errTok = new Token(TokenType.ERROR_CHAR, ch, startLine, startCol);
      this.tokens.push(errTok);
      this.errors.push({
        line: startLine, col: startCol,
        msg: `Carácter desconocido: '${ch}'`,
      });
    }

    // Token centinela EOF
    this.tokens.push(new Token(TokenType.EOF, '<EOF>', this.line, this.col));
    return this.tokens;
  }
}

module.exports = { LenguajeLexer, Token, TokenType, TOKEN_NAMES };
