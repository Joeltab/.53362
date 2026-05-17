grammar Lenguaje;

// ─────────────────────────────────────────────
//  REGLAS SINTÁCTICAS  (parser)
// ─────────────────────────────────────────────

programa
    : instruccion* EOF
    ;

instruccion
    : asignacion
    | imprimir
    ;

asignacion
    : ID IGUAL expresion PUNTOCOMA
    ;

imprimir
    : PRINT LPAREN expresion RPAREN PUNTOCOMA
    ;

expresion
    : termino ((PLUS | MINUS | MUL | DIV) termino)*
    ;

termino
    : NUMERO
    | ID
    | LPAREN expresion RPAREN
    ;

// ─────────────────────────────────────────────
//  REGLAS LÉXICAS  (lexer)
// ─────────────────────────────────────────────

PRINT      : 'print' ;
ID         : [a-zA-Z]+ ;
NUMERO     : [0-9]+ ;
IGUAL      : '=' ;
PUNTOCOMA  : ';' ;
PLUS       : '+' ;
MINUS      : '-' ;
MUL        : '*' ;
DIV        : '/' ;
LPAREN     : '(' ;
RPAREN     : ')' ;

WS         : [ \t\r\n]+ -> skip ;
ERROR_CHAR : . ;          // captura cualquier carácter desconocido
