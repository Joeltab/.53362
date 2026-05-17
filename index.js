#!/usr/bin/env node
'use strict';

// ─────────────────────────────────────────────────────────────────────────────
//  index.js  –  Punto de entrada del analizador
//
//  Uso:  node index.js [archivo]
//        Si no se especifica archivo, usa input.txt por defecto.
// ─────────────────────────────────────────────────────────────────────────────

const fs   = require('fs');
const path = require('path');

const { Lexer }                          = require('./src/Lexer');
const { Parser }                         = require('./src/Parser');
const { TreePrinter, JSCodeGen, Interpreter } = require('./src/Visitors');

// ── 0. Leer archivo fuente ────────────────────────────────────────────────────
const inputFile = process.argv[2] ?? 'input.txt';
const filePath  = path.resolve(inputFile);

if (!fs.existsSync(filePath)) {
  console.error(`\n  ERROR: No se encontró el archivo '${inputFile}'\n`);
  process.exit(1);
}

const source = fs.readFileSync(filePath, 'utf-8');

const LINE  = '═'.repeat(60);
const line2 = '─'.repeat(60);

console.log(`\n${LINE}`);
console.log(`  ANALIZADOR DE LENGUAJE  –  archivo: ${inputFile}`);
console.log(`${LINE}\n`);

// ── 1. Análisis Léxico ────────────────────────────────────────────────────────
const lexer  = new Lexer(source);
const tokens = lexer.tokenize();

// ── 2. Análisis Sintáctico ────────────────────────────────────────────────────
const parser = new Parser(tokens);
const ast    = parser.parsePrograma();

// Recolectar TODOS los errores (léxicos + sintácticos)
const allErrors = [
  ...lexer.errors.map(e => ({ ...e, fase: 'LÉXICO' })),
  ...parser.errors.map(e => ({ ...e, fase: 'SINTÁCTICO' })),
].sort((a, b) => a.line - b.line || a.col - b.col);

// ─── SECCIÓN 1: Estado general ───────────────────────────────────────────────
console.log('[ 1 ]  ANÁLISIS LÉXICO Y SINTÁCTICO');
console.log(line2);

if (allErrors.length === 0) {
  console.log('  ✔  La entrada es CORRECTA — sin errores léxicos ni sintácticos.\n');
} else {
  console.log(`  ✘  Se encontraron ${allErrors.length} error(es):\n`);
  allErrors.forEach(e => {
    console.log(`  • Línea ${e.line}, col ${e.col}  [${e.fase}]  ${e.msg}`);
  });
  console.log('');
}

// ─── SECCIÓN 2: Tabla de lexemas/tokens ──────────────────────────────────────
console.log('\n[ 2 ]  TABLA DE LEXEMAS – TOKENS');
console.log(line2);

const colW = [5, 7, 6, 18, 15];
const hdr  = [
  '#'.padEnd(colW[0]),
  'Línea'.padEnd(colW[1]),
  'Col'.padEnd(colW[2]),
  'Lexema'.padEnd(colW[3]),
  'Token',
];
console.log('  ' + hdr.join('  '));
console.log('  ' + colW.map(w => '-'.repeat(w)).join('  '));

tokens.forEach((t, i) => {
  if (t.type === 'EOF') return;
  const row = [
    String(i + 1).padEnd(colW[0]),
    String(t.line).padEnd(colW[1]),
    String(t.col).padEnd(colW[2]),
    t.value.padEnd(colW[3]),
    t.type,
  ];
  console.log('  ' + row.join('  '));
});

// ─── SECCIÓN 3: Árbol sintáctico ─────────────────────────────────────────────
console.log('\n\n[ 3 ]  ÁRBOL DE ANÁLISIS SINTÁCTICO');
console.log(line2);

const printer = new TreePrinter();
const tree    = printer.print(ast);
// Indentación global de 2 espacios
console.log(tree.split('\n').map(l => '  ' + l).join('\n'));

// ─── SECCIÓN 4: Código JS + Interpretación ───────────────────────────────────
console.log('\n[ 4 ]  CÓDIGO FUENTE EN JAVASCRIPT');
console.log(line2);

const gen    = new JSCodeGen();
const jsCode = gen.generate(ast);
console.log('\n' + jsCode.split('\n').map(l => '  ' + l).join('\n') + '\n');

console.log('\n[ 4b ] EJECUCIÓN (intérprete)');
console.log(line2);

if (allErrors.length > 0) {
  console.log('\n  ⚠  Ejecución omitida por errores en el análisis.\n');
} else {
  const interp = new Interpreter();
  try {
    interp.run(ast);
    console.log('\n  Salida del programa:\n');
    if (interp.output.length === 0) {
      console.log('  (sin salida — no hay instrucciones print)');
    } else {
      interp.output.forEach(line => console.log('  > ' + line));
    }
    console.log('\n  Variables finales:');
    Object.entries(interp.env).forEach(([k, v]) =>
      console.log(`  > ${k} = ${v}`)
    );
  } catch (err) {
    console.log(`\n  ✘  Error en tiempo de ejecución: ${err.message}`);
  }
  console.log('');
}

console.log(`${LINE}\n`);
