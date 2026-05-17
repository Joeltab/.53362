// ─────────────────────────────────────────────────────────────────────────────
//  LenguajeParser.js  –  Analizador sintáctico descendente recursivo
//  Equivalente al parser generado por ANTLR4 para Lenguaje.g4
//
//  Gramática soportada (EBNF):
//    programa   ::= { instruccion } EOF
//    instruccion::= asignacion | imprimir
//    asignacion ::= ID '=' expresion ';'
//    imprimir   ::= 'print' '(' expresion ')' ';'
//    expresion  ::= termino { ('+' | '-' | '*' | '/') termino }
//    termino    ::= NUMERO | ID | '(' expresion ')'
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { TokenType, TOKEN_NAMES } = require('./LenguajeLexer');

// ── Nodos del AST ─────────────────────────────────────────────────────────────
class ASTNode {
  constructor(type, attrs = {}) {
    this.type = type;
    Object.assign(this, attrs);
  }
}

// ── Parser ───────────────────────────────────────────────────────────────────
class LenguajeParser {
  constructor(tokens) {
    this.tokens  = tokens;
    this.pos     = 0;
    this.errors  = [];
  }

  // ── Utilidades ──────────────────────────────────────────────────────────────
  cur()  { return this.tokens[this.pos]; }
  peek() { return this.tokens[this.pos]; }

  consume(expectedType) {
    const tok = this.cur();
    if (tok.type === expectedType) {
      this.pos++;
      return tok;
    }
    // Error de sintaxis: se registra y se devuelve un token ficticio
    this.errors.push({
      line: tok.line,
      col:  tok.col,
      msg:  `Se esperaba '${TOKEN_NAMES[expectedType]}' ` +
            `pero se encontró '${tok.value}' (${TOKEN_NAMES[tok.type]})`,
    });
    // Recuperación mínima: se avanza si no es EOF
    if (tok.type !== TokenType.EOF) this.pos++;
    return tok;
  }

  match(...types) {
    return types.includes(this.cur().type);
  }

  // ── Reglas de la gramática ──────────────────────────────────────────────────

  /**
   * programa ::= { instruccion } EOF
   */
  parsePrograma() {
    const node = new ASTNode('programa', { instrucciones: [], line: 1 });

    while (!this.match(TokenType.EOF)) {
      // Recuperación ante errores: si encontramos algo inesperado lo saltamos
      if (this.cur().type === TokenType.ERROR_CHAR) {
        this.pos++;
        continue;
      }
      if (!this.match(TokenType.ID, TokenType.PRINT)) {
        this.errors.push({
          line: this.cur().line,
          col:  this.cur().col,
          msg:  `Instrucción inválida: token inesperado '${this.cur().value}' (${TOKEN_NAMES[this.cur().type]})`,
        });
        this.pos++;
        continue;
      }
      node.instrucciones.push(this.parseInstruccion());
    }

    this.consume(TokenType.EOF);
    return node;
  }

  /**
   * instruccion ::= asignacion | imprimir
   */
  parseInstruccion() {
    if (this.match(TokenType.PRINT)) return this.parseImprimir();
    return this.parseAsignacion();
  }

  /**
   * asignacion ::= ID '=' expresion ';'
   */
  parseAsignacion() {
    const line  = this.cur().line;
    const idTok = this.consume(TokenType.ID);
    this.consume(TokenType.IGUAL);
    const expr = this.parseExpresion();
    this.consume(TokenType.PUNTOCOMA);
    return new ASTNode('asignacion', { id: idTok.value, expr, line });
  }

  /**
   * imprimir ::= 'print' '(' expresion ')' ';'
   */
  parseImprimir() {
    const line = this.cur().line;
    this.consume(TokenType.PRINT);
    this.consume(TokenType.LPAREN);
    const expr = this.parseExpresion();
    this.consume(TokenType.RPAREN);
    this.consume(TokenType.PUNTOCOMA);
    return new ASTNode('imprimir', { expr, line });
  }

  /**
   * expresion ::= termino { ('+' | '-' | '*' | '/') termino }
   */
  parseExpresion() {
    const line = this.cur().line;
    let   left = this.parseTermino();

    const OPS = [TokenType.PLUS, TokenType.MINUS, TokenType.MUL, TokenType.DIV];
    while (this.match(...OPS)) {
      const opTok = this.tokens[this.pos++];
      const right = this.parseTermino();
      left = new ASTNode('binop', { op: opTok.value, left, right, line });
    }
    return left;
  }

  /**
   * termino ::= NUMERO | ID | '(' expresion ')'
   */
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
      this.pos++;                       // consume '('
      const expr = this.parseExpresion();
      this.consume(TokenType.RPAREN);   // consume ')'
      return new ASTNode('grupo', { expr, line: tok.line });
    }

    // Error: término inválido
    this.errors.push({
      line: tok.line,
      col:  tok.col,
      msg:  `Término inválido: se encontró '${tok.value}' (${TOKEN_NAMES[tok.type]})`,
    });
    if (tok.type !== TokenType.EOF) this.pos++;
    return new ASTNode('error', { line: tok.line });
  }
}

module.exports = { LenguajeParser, ASTNode };
