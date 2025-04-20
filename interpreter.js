// interpreter.js - Contains the Interpreter class
import { Environment } from './environment.js';

class Interpreter {
    constructor(program, outputFn, inputFn) {
        this.program = program;
        this.outputFn = outputFn || console.log; // Default to console.log if no output function provided
        this.inputFn = inputFn || prompt;       // Default to prompt if no input function provided
        this.globalEnv = new Environment();
    }

     evaluate(node, env) {
        switch (node.type) {
            case "STRING":
            case "INTEGER":
            case "FLOAT":
                return node.value;

            case "IDENTIFIER":
                return env.get(node.value);

            case "CREATE":
                const createValue = this.evaluate(node.value, env);
                // Ensure name is treated as a string key, even if parsed as IDENTIFIER node
                const varNameCreate = node.name.value;
                 if (typeof varNameCreate !== 'string') {
                     throw new Error(`CREATE expects an identifier name, got ${typeof varNameCreate}`);
                 }
                env.define(varNameCreate, createValue);
                return null; // Statements don't produce values

            case "SET":
                const setValue = this.evaluate(node.value, env);
                 // Ensure name is treated as a string key
                 const varNameSet = node.name.value;
                 if (typeof varNameSet !== 'string') {
                     throw new Error(`SET expects an identifier name, got ${typeof varNameSet}`);
                 }
                env.assign(varNameSet, setValue);
                return null;

            case "PRINT":
                const printValue = this.evaluate(node.value, env);
                process.stdout.write(printValue); // Use the provided output function
                return null;

            case "ADD":
                 return this.evaluate(node.left, env) + this.evaluate(node.right, env);
            case "SUBTRACT":
                 return this.evaluate(node.left, env) - this.evaluate(node.right, env);
            case "MULTIPLY":
                 return this.evaluate(node.left, env) * this.evaluate(node.right, env);
            case "DIVIDE":
                 const rightDiv = this.evaluate(node.right, env);
                 if (rightDiv === 0) throw new Error("Division by zero is forbidden magic!");
                 return this.evaluate(node.left, env) / rightDiv;

            case "EQUAL":
                return this.evaluate(node.left, env) === this.evaluate(node.right, env);
            case "NOTEQUAL":
                 return this.evaluate(node.left, env) !== this.evaluate(node.right, env);
            case "GREATER":
                 return this.evaluate(node.left, env) > this.evaluate(node.right, env);
            case "LESS":
                 return this.evaluate(node.left, env) < this.evaluate(node.right, env);

            case "INPUT":
                const inputVal = this.inputFn("Enter the source of the messages:"); // Use the provided input function
                // Try to parse as number, otherwise keep as string
                const numVal = Number(inputVal);
                return isNaN(numVal) ? inputVal : numVal;


             case "ORD":
                const ordStr = this.evaluate(node.value, env);
                if (typeof ordStr !== 'string' || ordStr.length !== 1) {
                    throw new Error("The 'ord' spell requires a single character string.");
                }
                return ordStr.charCodeAt(0);

            case "CHR":
                const chrCode = this.evaluate(node.value, env);
                if (typeof chrCode !== 'number' || !Number.isInteger(chrCode)) {
                    throw new Error("The 'chr' spell requires an integer code.");
                }
                return String.fromCharCode(chrCode);


            case "IF":
                const condition = this.evaluate(node.condition, env);
                if (condition) { // Check for truthiness
                    this.executeBlock(node.code, env);
                } else if (node.else) {
                    this.executeBlock(node.else, env);
                }
                return null;

            case "WHILE":
                while (this.evaluate(node.condition, env)) {
                     this.executeBlock(node.code, env);
                }
                return null;

            default:
                throw new Error(`Unknown AST node type: ${node.type}`);
        }
    }

    // Executes a block of statements within a new scope (if needed, depends on language rules)
    // For SpellCast, loops and ifs might create new scopes to avoid variable leakage
    executeBlock(statements, parentEnv) {
        const blockEnv = parentEnv.createChild(); // Create a new scope for the block
        for (const statement of statements) {
            this.evaluate(statement, blockEnv);
            // Add checks for return/break/continue if the language supports them
        }
    }


    run() {
        try {
            for (const statement of this.program) {
                this.evaluate(statement, this.globalEnv);
            }
        } catch (error) {
            this.outputFn(`Runtime Error: ${error.message}`, 'error');
             console.error("Runtime Error Details:", error); // Log full error for debugging
        }
    }
}

export { Interpreter };
