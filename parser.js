// parser.js - Contains the Parser class

class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.current = 0;
        this.program = [];
    }

    isAtEnd() {
        return this.current >= this.tokens.length || this.peek().type === 'EOF';
    }

    peek() {
        return this.tokens[this.current];
    }

    previous() {
        return this.tokens[this.current - 1];
    }

    advance() {
        if (!this.isAtEnd()) {
            this.current++;
        }
        return this.previous();
    }

    check(type) {
         if (this.isAtEnd()) return false;
         return this.peek()[0] === type;
    }

    checkVal(val) {
        if (this.isAtEnd()) return false;
        return this.peek()[0] === 'IDENTIFIER' && this.peek()[1] === val;
    }

     match(type, val = null) {
        if (val) {
             if (this.checkVal(val)) {
                 this.advance();
                 return true;
             }
             throw new Error(`Expected token IDENTIFIER:'${val}' but found ${this.peek()[0]}:'${this.peek()[1]}' at position ${this.current}`);
        } else {
            if (this.check(type)) {
                this.advance();
                return true;
            }
             throw new Error(`Expected token of type '${type}' but found ${this.peek()[0]}:'${this.peek()[1]}' at position ${this.current}`);
        }
    }


     // Helper to consume a sequence of identifier tokens (keywords)
     consumeKeywords(keywordString) {
        const keywords = keywordString.split(" ");
        for (const keyword of keywords) {
             if (this.checkVal(keyword)) {
                 this.advance();
             } else {
                const foundToken = this.peek();
                throw new Error(`Expected keyword '${keyword}' but found ${foundToken[0]}:'${foundToken[1]}' at position ${this.current}`);
             }
        }
     }


    parse() {
        while (!this.isAtEnd()) {
            try {
                const statement = this.parseStatement();
                if (statement) {
                    this.program.push(statement);
                } else {
                    break; // Exit loop if parseStatement returns null
                }
            } catch (error) {
                 console.error("Parsing error:", error);
                 // Potentially add error recovery here if needed
                 throw error; // Re-throw for now
            }
        }
        return this.program;
    }

    parseBlock() {
        const block = [];
        this.consumeKeywords('do');
        while (!this.isAtEnd() && !this.checkVal('done') && !this.checkVal('else')) {
            block.push(this.parseStatement());
        }
        // 'done' or 'else' will be consumed by the calling function (parseIfStatement, parseWhileStatement)
        return block;
    }

     // Primary expression parsing (handles literals, identifiers, and potentially grouping)
     parsePrimary() {
        if (this.check('STRING')) {
            return { type: "STRING", value: this.advance()[1] };
        }
        if (this.check('INTEGER')) {
            return { type: "INTEGER", value: parseInt(this.advance()[1], 10) };
        }
        if (this.check('FLOAT')) {
            return { type: "FLOAT", value: parseFloat(this.advance()[1]) };
        }

         // Handle special keyword-based expressions FIRST
        if (this.checkVal("combine")) {
            this.advance();
            this.consumeKeywords("the power of");
            const left = this.parseExpression(); // Recursively parse left operand
            this.consumeKeywords("and");
            const right = this.parseExpression(); // Recursively parse right operand
            return { type: "ADD", left, right };
        }
        if (this.checkVal("remove")) {
             this.advance();
             this.consumeKeywords("the power of");
             const right = this.parseExpression();
             this.consumeKeywords("from");
             const left = this.parseExpression();
             return { type: "SUBTRACT", left, right };
        }
        if (this.checkVal("duplicate")) {
             this.advance();
             this.consumeKeywords("the power of");
             const left = this.parseExpression();
             const right = this.parseExpression();
             this.consumeKeywords("times");
             return { type: "MULTIPLY", left, right };
        }
        if (this.checkVal("split")) {
             this.advance();
             this.consumeKeywords("the power of");
             const left = this.parseExpression();
             const right = this.parseExpression();
             this.consumeKeywords("times");
             return { type: "DIVIDE", left, right };
        }
        if (this.checkVal("find")) {
             this.advance();
             this.consumeKeywords("the source of the messages");
             return { type: "INPUT" };
        }
         if (this.checkVal("may")) {
             this.advance();
             this.consumeKeywords("the sorcerers cast their spells on");
             const ordChar = this.parseExpression();
             return { type: "ORD", value: ordChar };
         }
         if (this.checkVal("get")) {
             this.advance();
             this.consumeKeywords("the character from the spell");
             const chrChar = this.parseExpression();
             return { type: "CHR", value: chrChar };
         }

         // Handle boolean checks (part of expressions)
         // 'is' check needs to be handled carefully, maybe as a separate expression type or within parseExpression
         if (this.checkVal("is")) {
            this.advance(); // Consume 'is'
            const left = this.parseExpression(); // Get the left side (often an identifier evaluated)

            if (this.checkVal("equal")) {
                this.advance(); this.consumeKeywords("to");
                const right = this.parseExpression();
                return { type: "EQUAL", left, right };
            } else if (this.checkVal("not")) {
                this.advance(); this.consumeKeywords("equal to");
                const right = this.parseExpression();
                return { type: "NOTEQUAL", left, right };
            } else if (this.checkVal("greater")) {
                this.advance(); this.consumeKeywords("than");
                const right = this.parseExpression();
                return { type: "GREATER", left, right };
            } else if (this.checkVal("less")) {
                this.advance(); this.consumeKeywords("than");
                const right = this.parseExpression();
                return { type: "LESS", left, right };
            } else {
                 throw new Error(`Unexpected token after 'is': ${this.peek()[1]}`);
            }
         }


        // Default to identifier if none of the above match
        if (this.check('IDENTIFIER')) {
             // Check if it's a simple identifier lookup
            return { type: "IDENTIFIER", value: this.advance()[1] };
        }


        // If none of the above, it's an error
        const currentToken = this.peek();
        throw new Error(`Unexpected token type '${currentToken[0]}' with value '${currentToken[1]}' when parsing primary expression.`);
    }

    // Placeholder for higher precedence operations if needed later (e.g., unary)
    parseUnary() {
        // Add unary operators like '-' or '!' here if language supports them
        return this.parsePrimary();
    }

    // Placeholder for multiplicative operations (*, /)
    parseFactor() {
         // Add multiplicative operators here if using standard precedence
        return this.parseUnary();
    }

    // Placeholder for additive operations (+, -)
    parseTerm() {
        // Add additive operators here if using standard precedence
        return this.parseFactor();
    }

    // Placeholder for comparison operations (<, >, <=, >=)
    parseComparison() {
         // Add comparison operators here if using standard precedence
         // Note: SpellCast uses 'is equal to', 'is greater than', etc. handled in parsePrimary for now
        return this.parseTerm();
    }

    // Placeholder for equality operations (==, !=)
    parseEquality() {
        // Add equality operators here if using standard precedence
        // Note: SpellCast uses 'is equal to', 'is not equal to', handled in parsePrimary for now
        return this.parseComparison();
    }


    // Main entry point for parsing any expression
    // Currently delegates directly, but can implement precedence climbing later
    parseExpression() {
         // For now, SpellCast grammar seems to handle complex expressions via keywords directly in parsePrimary
         // If standard operators (+, -, *, / etc.) were primary, this would handle precedence.
        return this.parsePrimary();
    }


    // Parse different types of statements
    parseStatement() {
        // Debugging: Log the current token
        console.log("parseStatement - Current token:", this.peek());

        if (this.isAtEnd()) {
            console.warn("parseStatement - Reached end of tokens, returning null.");
            return null;
        }

        if (this.checkVal('shout')) {
            return this.parsePrintStatement();
        }
        if (this.checkVal('create')) {
            return this.parseCreateStatement();
        }
        if (this.checkVal('cast')) {
            return this.parseIfStatement();
        }
        if (this.checkVal('set')) {
            return this.parseSetStatement();
        }
        if (this.checkVal('whilst')) {
            return this.parseWhileStatement();
        }

        // If it's not a recognized statement keyword, assume it's an expression statement
        // (though SpellCast might not have these - e.g., just `5` on a line might be invalid)
        // For now, let's assume statements MUST start with a keyword.
        // If expression statements are allowed, call this: return this.parseExpressionStatement();
         return null;
    }

     // Specific statement parsing functions
    parsePrintStatement() {
        this.consumeKeywords('shout the many cries of');
        const value = this.parseExpression();
        return { type: "PRINT", value: value };
    }

    parseCreateStatement() {
        this.consumeKeywords('create a new spell named');
        if (!this.check('IDENTIFIER')) throw new Error("Expected identifier for spell name after 'named'");
        const name = this.parseExpression(); // Should be an IDENTIFIER node
        this.consumeKeywords('with the power of');
        const value = this.parseExpression();
        return { type: "CREATE", name, value };
    }

    parseSetStatement() {
         this.consumeKeywords('set the power of');
         if (!this.check('IDENTIFIER')) throw new Error("Expected identifier for spell name after 'of'");
         const name = this.parseExpression(); // Should be an IDENTIFIER node
         this.consumeKeywords('to');
         const value = this.parseExpression();
         return { type: "SET", name, value };
     }


    parseIfStatement() {
        this.consumeKeywords('cast only if the spell');
        const condition = this.parseExpression(); // Parse the condition expression
        this.consumeKeywords('is true'); // Consume 'is true'
        const thenBranch = this.parseBlock(); // Parse the 'do...done/else' block

        let elseBranch = null;
        if (this.checkVal('else')) {
            this.advance(); // Consume 'else'
            elseBranch = this.parseBlock(); // Parse the 'do...done' block for else
        }

        this.match('IDENTIFIER', 'done'); // Expect 'done' at the end

        return { type: "IF", condition, code: thenBranch, else: elseBranch };
    }


    parseWhileStatement() {
        this.consumeKeywords('whilst the spell');
        const condition = this.parseExpression();
        this.consumeKeywords('is true');
        const body = this.parseBlock();
        this.match('IDENTIFIER', 'done'); // Expect 'done' at the end
        return { type: "WHILE", condition, code: body };
    }

     // If expression statements were allowed:
     // parseExpressionStatement() {
     //     const expr = this.parseExpression();
     //     // Optionally check for a semicolon or newline here if required
     //     return { type: "EXPRESSION_STATEMENT", expression: expr };
     // }

}

export { Parser };
