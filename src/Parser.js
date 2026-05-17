'use strict';

const { TokenType } = require('./Lexer');

// ─────────────────────────────────────────────────────────────────────────────
//  Nodos del Árbol Sintáctico Abstracto (AST)
// ─────────────────────────────────────────────────────────────────────────────
class ASTNode {
  constructor(type, attrs = {}) {
    this.type = type;
    Object.assign(this, attrs);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Parser  –  análisis sintáctico descendente recursivo
//  Implementa exactamente la gramática EBNF provista.
// ─────────────────────────────────────────────────────────────────────────────
class Parser {
  constructor(tokens) {
    this.tokens = tokens.filter(t => t.type !== TokenType.ERROR_CHAR);
    this.all    = tokens;          // incluye ERROR_CHAR para errores léxicos
    this.pos    = 0;
    this.errors = [];
  }

  cur()  { return this.tokens[this.pos]; }

  consume(expected) {
    const tok = this.cur();
    if (tok.type === expected) { this.pos++; return tok; }
    this.errors.push({
      line: tok.line,
      col:  tok.col,
      msg:  `Se esperaba '${expected}' pero se encontró '${tok.value}' (${tok.type})`,
    });
    // Recuperación: avanzar si no es EOF
    if (tok.type !== TokenType.EOF) this.pos++;
    return tok;
  }

  match(...types) { return types.includes(this.cur().type); }

  // ── Reglas de la gramática ─────────────────────────────────────────────────

  /* programa ::= { instruccion } EOF */
  parsePrograma() {
    const node = new ASTNode('programa', { instrucciones: [], line: 1 });
    while (!this.match(TokenType.EOF)) {
      if (!this.match(TokenType.ID, TokenType.PRINT)) {
        this.errors.push({
          line: this.cur().line, col: this.cur().col,
          msg:  `Token inesperado '${this.cur().value}' (${this.cur().type})`,
        });
        this.pos++; continue;
      }
      node.instrucciones.push(this.parseInstruccion());
    }
    this.consume(TokenType.EOF);
    return node;
  }

  /* instruccion ::= asignacion | imprimir */
  parseInstruccion() {
    if (this.match(TokenType.PRINT)) return this.parseImprimir();
    return this.parseAsignacion();
  }

  /* asignacion ::= ID '=' expresion ';' */
  parseAsignacion() {
    const line  = this.cur().line;
    const idTok = this.consume(TokenType.ID);
    this.consume(TokenType.IGUAL);
    const expr = this.parseExpresion();
    this.consume(TokenType.PUNTOCOMA);
    return new ASTNode('asignacion', { id: idTok.value, expr, line });
  }

  /* imprimir ::= 'print' '(' expresion ')' ';' */
  parseImprimir() {
    const line = this.cur().line;
    this.consume(TokenType.PRINT);
    this.consume(TokenType.LPAREN);
    const expr = this.parseExpresion();
    this.consume(TokenType.RPAREN);
    this.consume(TokenType.PUNTOCOMA);
    return new ASTNode('imprimir', { expr, line });
  }

  /* expresion ::= termino { ('+' | '-' | '*' | '/') termino } */
  parseExpresion() {
    const line = this.cur().line;
    let left   = this.parseTermino();
    const OPS  = [TokenType.PLUS, TokenType.MINUS, TokenType.MUL, TokenType.DIV];
    while (this.match(...OPS)) {
      const opTok = this.tokens[this.pos++];
      const right = this.parseTermino();
      left = new ASTNode('binop', { op: opTok.value, left, right, line });
    }
    return left;
  }

  /* termino ::= NUMERO | ID | '(' expresion ')' */
  parseTermino() {
    const tok = this.cur();
    if (tok.type === TokenType.NUMERO) {
      this.pos++;
      return new ASTNode('numero', { value: tok.value, line: tok.line });
    }
    if (tok.type === TokenType.ID) {
      this.pos++;
      return new ASTNode('id', { value: tok.value, line: tok.line });
    }
    if (tok.type === TokenType.LPAREN) {
      this.pos++;
      const expr = this.parseExpresion();
      this.consume(TokenType.RPAREN);
      return new ASTNode('grupo', { expr, line: tok.line });
    }
    // Error
    this.errors.push({
      line: tok.line, col: tok.col,
      msg:  `Término inválido: se encontró '${tok.value}' (${tok.type})`,
    });
    if (tok.type !== TokenType.EOF) this.pos++;
    return new ASTNode('error', { line: tok.line });
  }
}

module.exports = { Parser, ASTNode };
