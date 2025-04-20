// environment.js - Contains the Environment class

class Environment {
    constructor(parent = null) {
        this.parent = parent;
        this.variables = new Map(); // Use Map for better handling of keys
    }

    // Define a new variable in the current scope
    define(name, value) {
        if (this.variables.has(name)) {
            // Optionally allow re-declaration or throw error
            // console.warn(`Variable '${name}' already defined in this scope.`);
        }
        this.variables.set(name, value); // Finish the set call
    }

     // Assign a value to an existing variable, searching up the scope chain
    assign(name, value) {
        if (this.variables.has(name)) {
            this.variables.set(name, value);
            return;
        }

        if (this.parent !== null) {
            this.parent.assign(name, value);
            return;
        }

        throw new Error(`Undefined variable '${name}'`);
    }

    // Get a variable's value, searching up the scope chain
    get(name) {
        if (this.variables.has(name)) {
            return this.variables.get(name);
        }

        if (this.parent !== null) {
            return this.parent.get(name);
        }

        throw new Error(`Undefined variable '${name}'`);
    }

    // Create a new child scope
    createChild() {
        return new Environment(this);
    }
}

export { Environment };
