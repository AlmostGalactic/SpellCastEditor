// lexer.js - Contains the Lexer class

class Lexer {
    tokenize(source) {
        const isDigit = (c) => /\d/.test(c);
        const isAlpha = (c) => /[a-zA-Z_]/.test(c);
        const isAlnum = (c) => isAlpha(c) || isDigit(c);

        const tokens = [];
        let i = 0;
        const length = source.length;

        while (i < length) {
            let c = source[i];

            // Skip whitespace
            if (/\s/.test(c)) {
                i += 1;
                continue;
            }

            // Comments (# to end of line)
            if (c === '#') {
                while (i < length && source[i] !== '\n') {
                    i += 1;
                }
                continue; // Skip the rest of the line including the newline
            }

            // Strings ("hello" or 'hello')
            if (c === '"' || c === "'") {
                const quote = c;
                i += 1;
                let start = i;
                while (i < length && source[i] !== quote) {
                     // Handle escaped quotes (optional, basic version doesn't need it)
                    // if (source[i] === '\\' && i + 1 < length) {
                    //     i += 2; // Skip backslash and the escaped character
                    //     continue;
                    // }
                    i += 1;
                }
                if (i >= length) {
                     throw new Error(`Unterminated string starting at position ${start-1}`);
                }
                const value = source.slice(start, i);
                tokens.push(['STRING', value]);
                i += 1;  // skip closing quote
                continue;
            }

            // Numbers (int or float)
            if (isDigit(c)) {
                let start = i;
                while (i < length && isDigit(source[i])) {
                    i += 1;
                }
                // Check for float
                if (i < length && source[i] === '.') {
                     // Ensure the character after '.' is a digit for a valid float
                     if (i + 1 < length && isDigit(source[i+1])) {
                         i += 1; // Consume the '.'
                         while (i < length && isDigit(source[i])) {
                             i += 1;
                         }
                         tokens.push(['FLOAT', source.slice(start, i)]);
                     } else {
                         // It's just an integer followed by a dot (e.g. for method calls if added later)
                         tokens.push(['INTEGER', source.slice(start, i)]);
                         // Don't continue yet, let the dot be tokenized separately if needed
                     }

                } else {
                    tokens.push(['INTEGER', source.slice(start, i)]);
                }
                continue;
            }

            // Identifiers and keywords (treat keywords as identifiers for now, parser differentiates)
            if (isAlpha(c)) {
                let start = i;
                while (i < length && isAlnum(source[i])) {
                    i += 1;
                }
                tokens.push(['IDENTIFIER', source.slice(start, i)]);
                continue;
            }

            // Symbols (basic, single char for now)
            // Be careful with multi-char operators if added later
             if ('{}()[]=;.,:+-*/'.includes(c)) {
                 tokens.push(['SYMBOL', c]);
                 i += 1;
                 continue;
             }

            // Unknown character
            throw new Error(`Unexpected character: '${c}' at position ${i}`);
        }

        tokens.push(['EOF', 'EOF']); // Add End Of File token
        return tokens;
    }
}

export { Lexer };
