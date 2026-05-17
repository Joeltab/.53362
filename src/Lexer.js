'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  Tipos de token  (equivalente a los literales de ANTLR4)
// ─────────────────────────────────────────────────────────────────────────────
const TokenType = {
  EOF:        'EOF',
  PRINT:      'PRINT',
  ID:         'ID',
  NUMERO:     'NUMERO',
  IGUAL:      'IGUAL',
  PUNTOCOMA:  'PUNTOCOMA',
  PLUS:       'PLUS',
  MINUS:      'MINUS',
  MUL:        'MUL',
  DIV:        'DIV',
  LPAREN:     'LPAREN',
  RPAREN:     'RPAREN',
  ERROR_CHAR: 'ERROR_CHAR',
};

class Token {
  constructor(type, value, line, col) {
    this.type  = type;
    this.value = value;
    this.line  = line;
    this.col   = col;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Lexer  –  análisis léxico
// ─────────────────────────────────────────────────────────────────────────────
class Lexer {
  constructor(source) {
    this.src    = source;
    this.pos    = 0;
    this.line   = 1;
    this.col    = 1;
    this.tokens = [];
    this.errors = [];
  }

  peek() { return this.src[this.pos] ?? null; }

  advance() {
    const ch = this.src[this.pos++];
    if (ch === '\n') { this.line++; this.col = 1; }
    else             { this.col++; }
    return ch;
  }

  tokenize() {
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

    while (this.pos < this.src.length) {
      const l = this.line, c = this.col;
      const ch = this.peek();

      // Espacios en blanco → descartar (WS -> skip)
      if (/[ \t\r\n]/.test(ch)) { this.advance(); continue; }

      // Número:  [0-9]+
      if (/[0-9]/.test(ch)) {
        let num = '';
        while (this.pos < this.src.length && /[0-9]/.test(this.peek()))
          num += this.advance();
        this.tokens.push(new Token(TokenType.NUMERO, num, l, c));
        continue;
      }

      // Identificador o 'print':  [a-zA-Z]+
      if (/[a-zA-Z]/.test(ch)) {
        let word = '';
        while (this.pos < this.src.length && /[a-zA-Z]/.test(this.peek()))
          word += this.advance();
        const type = word === 'print' ? TokenType.PRINT : TokenType.ID;
        this.tokens.push(new Token(type, word, l, c));
        continue;
      }

      // Símbolo conocido
      if (SYMBOLS[ch] !== undefined) {
        this.advance();
        this.tokens.push(new Token(SYMBOLS[ch], ch, l, c));
        continue;
      }

      // Carácter desconocido  (ERROR_CHAR)
      this.advance();
      this.tokens.push(new Token(TokenType.ERROR_CHAR, ch, l, c));
      this.errors.push({ line: l, col: c, msg: `Carácter desconocido: '${ch}'` });
    }

    this.tokens.push(new Token(TokenType.EOF, '<EOF>', this.line, this.col));
    return this.tokens;
  }
}

module.exports = { Lexer, Token, TokenType };
