#Analizador Léxico y Sintáctico — Gramática EBNF

Proyecto Node.js que implementa un **analizador léxico y sintáctico** para un lenguaje simple definido mediante gramática EBNF.  
Realiza cuatro tareas principales: análisis léxico/sintáctico con reporte de errores, tabla de tokens, árbol sintáctico y ejecución como intérprete básico.



#Estructura del repositorio


/
├── src/
│   ├── Lexer.js       ← Analizador léxico (tokenizador)
│   ├── Parser.js      ← Analizador sintáctico (descendente recursivo)
│   └── Visitors.js    ← Árbol, generador JS e intérprete
├── ejemplos/
│   ├── ejemplo1_correcto.txt
│   ├── ejemplo2_correcto.txt
│   ├── ejemplo3_incorrecto.txt
│   └── ejemplo4_incorrecto.txt
├── index.js           ← Punto de entrada principal
├── input.txt          ← Archivo de entrada por defecto
├── gramatica.txt      ← Gramática EBNF del lenguaje
├── package.json
└── README.md



#Gramática del lenguaje

<programa>    ::= { <instruccion> } ;
<instruccion> ::= <asignacion> | <imprimir> ;
<asignacion>  ::= <id> "=" <expresion> ";" ;
<imprimir>    ::= "print" "(" <expresion> ")" ";" ;
<expresion>   ::= <termino> { ("+" | "-" | "*" | "/") <termino> } ;
<termino>     ::= <numero> | <id> | "(" <expresion> ")" ;
<id>          ::= [a-zA-Z]+ ;
<numero>      ::= [0-9]+ ;


#Requisitos previos

-**Node.js** versión 14 o superior  
  Verificar con: `node --version`

-No se necesitan dependencias externas. El proyecto funciona con Node.js puro (`npm install` no es necesario).


#Cómo ejecutar

#1. Clonar el repositorio

bash
git clone https://github.com/Joeltab/<.53362>.git
cd <.53362>


#2. Ejecutar con el archivo por defecto (`input.txt`)

bash
node index.js


o equivalentemente:

bash
node index.js input.txt


#3. Ejecutar con un archivo específico

bash
node index.js ejemplos/ejemplo1_correcto.txt
node index.js ejemplos/ejemplo2_correcto.txt
node index.js ejemplos/ejemplo3_incorrecto.txt
node index.js ejemplos/ejemplo4_incorrecto.txt


#4. Usando los scripts de npm (opcional)

bash
npm run ej1   # ejemplo1_correcto.txt
npm run ej2   # ejemplo2_correcto.txt
npm run ej3   # ejemplo3_incorrecto.txt
npm run ej4   # ejemplo4_incorrecto.txt




#Descripción de la salida

El analizador genera cuatro secciones en la consola:

#[ 1 ] Análisis léxico y sintáctico
Indica si la entrada es **correcta** o lista todos los **errores** con su línea, columna, fase (LÉXICO / SINTÁCTICO) y causa.


[ 1 ]  ANÁLISIS LÉXICO Y SINTÁCTICO
────────────────────────────────────────────────────────────
  ✔  La entrada es CORRECTA — sin errores léxicos ni sintácticos.


En caso de error:

  ✘  Se encontraron 2 error(es):

  • Línea 1, col 7  [LÉXICO]     Carácter desconocido: '@'
  • Línea 3, col 9  [SINTÁCTICO] Se esperaba 'PUNTOCOMA' pero se encontró 'print' (PRINT)


#[ 2 ] Tabla de lexemas – tokens
Tabla con cada token reconocido durante el análisis léxico:


  #      Línea    Col     Lexema              Token
  -----  -------  ------  ------------------  ---------------
  1      1        1       x                   ID
  2      1        3       =                   IGUAL
  3      1        5       10                  NUMERO
  ...


#[ 3 ] Árbol de análisis sintáctico
Árbol concreto en formato texto con conectores visuales:


  └── <programa>
      ├── <asignacion>  "x" =
      │   └── <numero>  "10"
      ├── <imprimir>  print(...)
      │   └── <expresion>  op='+'
      │       ├── <id>  "x"
      │       └── <numero>  "5"


#[ 4 ] Código JavaScript + ejecución
Muestra la traducción del código fuente a JavaScript y su resultado:

javascript
let x = 10;
let y = 20;
let z = x + y * 2;
console.log(z);



  Salida del programa:
  > 60

  Variables finales:
  > x = 10
  > y = 20
  > z = 60


-Si hay errores de análisis, la ejecución se omite mostrando un aviso.



#Ejemplos incluidos

| Archivo | Tipo | Descripción |
|---|---|---|
| `ejemplo1_correcto.txt` | Correcto | Asignaciones simples y print |
| `ejemplo2_correcto.txt` | Correcto | Expresiones con paréntesis y múltiples prints |
| `ejemplo3_incorrecto.txt` | Incorrecto | Falta de punto y coma, término inválido |
| `ejemplo4_incorrecto.txt` | Incorrecto | Carácter `@` desconocido, paréntesis sin cerrar |

---

#Arquitectura del analizador


Código fuente (.txt)
        │
        ▼
  ┌─────────────┐
  │    Lexer    │  → Tabla de tokens
  └─────────────┘
        │  tokens[]
        ▼
  ┌─────────────┐
  │    Parser   │  → AST (árbol sintáctico abstracto)
  └─────────────┘
        │  AST
        ├──────────────────────┐────────────────────┐
        ▼                      ▼                    ▼
  ┌───────────┐        ┌────────────┐       ┌─────────────┐
  │TreePrinter│        │ JSCodeGen  │       │ Interpreter │
  │ (árbol)   │        │ (JS code)  │       │ (ejecución) │
  └───────────┘        └────────────┘       └─────────────┘


| Módulo | Archivo | Responsabilidad |
|---|---|---|
| Lexer | `src/Lexer.js` | Tokenización del código fuente |
| Parser | `src/Parser.js` | Análisis sintáctico, construcción del AST |
| TreePrinter | `src/Visitors.js` | Impresión del árbol sintáctico |
| JSCodeGen | `src/Visitors.js` | Generación de código JavaScript |
| Interpreter | `src/Visitors.js` | Evaluación directa del AST |


## 📌 Notas

- Los identificadores son solo letras (`[a-zA-Z]+`); no se admiten dígitos en nombres de variables.
- Los números son enteros positivos (`[0-9]+`).
- La división entre enteros usa `Math.trunc()` (división entera).
- Si una variable no fue definida antes de usarla en `print`, el intérprete lanza un error en tiempo de ejecución.
