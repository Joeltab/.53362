'use strict';

// ══════════════════════════════════════════════════════════════════════════════
//  1.  TreePrinter  –  árbol sintáctico concreto en texto
// ══════════════════════════════════════════════════════════════════════════════
class TreePrinter {
  print(node, prefix = '', isLast = true) {
    if (!node) return '';
    const branch      = isLast ? '└── ' : '├── ';
    const childPrefix = isLast ? '    ' : '│   ';
    let out = prefix + branch + this._label(node) + '\n';

    const kids = this._children(node);
    kids.forEach((k, i) => {
      out += this.print(k, prefix + childPrefix, i === kids.length - 1);
    });
    return out;
  }

  _label(n) {
    switch (n.type) {
      case 'programa':   return '<programa>';
      case 'asignacion': return `<asignacion>  "${n.id}" =`;
      case 'imprimir':   return '<imprimir>  print(...)';
      case 'binop':      return `<expresion>  op='${n.op}'`;
      case 'grupo':      return '<termino>  (...)';
      case 'numero':     return `<numero>  "${n.value}"`;
      case 'id':         return `<id>  "${n.value}"`;
      case 'error':      return '<error>';
      default:           return `<${n.type}>`;
    }
  }

  _children(n) {
    switch (n.type) {
      case 'programa':   return n.instrucciones;
      case 'asignacion': return [n.expr];
      case 'imprimir':   return [n.expr];
      case 'binop':      return [n.left, n.right];
      case 'grupo':      return [n.expr];
      default:           return [];
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  2.  JSCodeGen  –  traducción a JavaScript
// ══════════════════════════════════════════════════════════════════════════════
class JSCodeGen {
  generate(node) {
    switch (node.type) {
      case 'programa':
        return node.instrucciones.map(i => this.generate(i)).join('\n');
      case 'asignacion':
        return `let ${node.id} = ${this._expr(node.expr)};`;
      case 'imprimir':
        return `console.log(${this._expr(node.expr)});`;
      default:
        return '';
    }
  }

  _expr(n) {
    switch (n.type) {
      case 'numero': return n.value;
      case 'id':     return n.value;
      case 'grupo':  return `(${this._expr(n.expr)})`;
      case 'binop':  return `${this._expr(n.left)} ${n.op} ${this._expr(n.right)}`;
      default:       return '/* error */';
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  3.  Interpreter  –  evaluación directa del AST
// ══════════════════════════════════════════════════════════════════════════════
class Interpreter {
  constructor() {
    this.env    = {};   // tabla de variables
    this.output = [];   // líneas impresas
  }

  run(node) {
    switch (node.type) {
      case 'programa':
        node.instrucciones.forEach(i => this.run(i));
        break;
      case 'asignacion':
        this.env[node.id] = this._eval(node.expr);
        break;
      case 'imprimir': {
        const val = this._eval(node.expr);
        this.output.push(String(val));
        break;
      }
    }
  }

  _eval(n) {
    switch (n.type) {
      case 'numero': return Number(n.value);
      case 'id':
        if (n.value in this.env) return this.env[n.value];
        throw new Error(`Variable no definida: '${n.value}'`);
      case 'grupo':  return this._eval(n.expr);
      case 'binop': {
        const l = this._eval(n.left);
        const r = this._eval(n.right);
        switch (n.op) {
          case '+': return l + r;
          case '-': return l - r;
          case '*': return l * r;
          case '/':
            if (r === 0) throw new Error('División por cero');
            return Math.trunc(l / r);
        }
      }
      default: return 0;
    }
  }
}

module.exports = { TreePrinter, JSCodeGen, Interpreter };
