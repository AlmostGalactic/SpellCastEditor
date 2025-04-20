import { Lexer, Parser, Interpreter, Environment } from './spellcast.js';

require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs' }});

require(['vs/editor/editor.main'], function() {
    // --- Register Language ---
    monaco.languages.register({ id: 'spellcast' });

    // --- Define Monarch Tokens ---
    monaco.languages.setMonarchTokensProvider('spellcast', {
        // Set defaultToken to invalid to see what fails to tokenize
        // defaultToken: 'invalid',

        keywords: [
            'shout', 'create', 'cast', 'whilst', 'set',
            'the', 'many', 'cries', 'of', 'a', 'new', 'spell', 'named',
            'with', 'power', 'only', 'if', 'is', 'true', 'do', 'done',
            'else', 'combine', 'remove', 'from', 'duplicate', 'split',
            'and', 'times', 'equal', 'to', 'not', 'greater', 'than',
            'less', 'find', 'source', 'messages', 'may', 'sorcerers',
            'their', 'spells', 'on', 'get', 'character'
        ],

        operators: [
            '+', '-', '*', '/', '=', '.' // Include dot for potential floats? Handled by numbers though.
        ],

        symbols: /[=(){}\[\];,.:+\-*/]+/, // Basic symbols from lexer

        escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

        tokenizer: {
            root: [
                // Identifiers and keywords
                [/[a-zA-Z_][\w$]*/, {
                    cases: {
                        '@keywords': 'keyword',
                        'cast': 'keyword.control', // Special emphasis for block start/end
                        'do': 'keyword.control', // Special emphasis for block start/end
                        'create': 'keyword.control', // Special emphasis for block start/end
                        'done': 'keyword.control',
                        '@default': 'identifier'
                    }
                }],

                // Comments
                [/#.*$/, 'comment'],

                // Whitespace
                { include: '@whitespace' },

                // Delimiters and operators
                [/[{}()\[\]]/, '@brackets'],
                [/[<>](?!@symbols)/, '@brackets'],
                [/@symbols/, {
                    cases: {
                        '@operators': 'operator',
                        '@default': ''
                    }
                }],

                // Numbers
                [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
                [/\d+/, 'number'],

                // Strings
                [/"([^"\\]|\\.)*$/, 'string.invalid'], // non-teminated string
                [/'([^'\\]|\\.)*$/, 'string.invalid'], // non-teminated string
                [/"/, 'string', '@string_double'],
                [/'/, 'string', '@string_single'],
            ],

            comment: [
                [/[^#]+/, 'comment'],
                [/#.*$/, 'comment'], // Ensure rest of line is comment
                [/./, 'comment']
            ],

            whitespace: [
                [/[ \t\r\n]+/, 'white'],
            ],

            string_double: [
                [/[^\\"]+/, 'string'],
                [/@escapes/, 'string.escape'],
                [/\\./, 'string.escape.invalid'],
                [/"/, 'string', '@pop']
            ],
            string_single: [
                [/[^\\']+/, 'string'],
                [/@escapes/, 'string.escape'],
                [/\\./, 'string.escape.invalid'],
                [/'/, 'string', '@pop']
            ],
        }
    });

    // --- Define Custom Theme ---
    monaco.editor.defineTheme('spellcastTheme', {
        base: 'vs-dark', // Base theme: 'vs', 'vs-dark', 'hc-black'
        inherit: true, // Inherit rules from base theme
        rules: [
            { token: 'keyword', foreground: 'C586C0', fontStyle: 'bold' }, // Magenta for keywords
            { token: 'keyword.control', foreground: '4EC9B0', fontStyle: 'bold' }, // Teal for special identifiers like do/done
            { token: 'identifier', foreground: '9CDCFE' }, // Light blue for identifiers
            { token: 'number', foreground: 'B5CEA8' },      // Green for numbers
            { token: 'string', foreground: 'CE9178' },      // Orange for strings
            { token: 'comment', foreground: '6A9955', fontStyle: 'italic' }, // Green and italic for comments
            { token: 'operator', foreground: 'D4D4D4' },    // Default text color for operators
            { token: 'brackets', foreground: 'FFD700' },    // Gold for brackets
            { token: 'string.escape', foreground: 'D7BA7D' }, // Yellowish for escape chars
        ],
        colors: {
            'editor.background': '#1E1E1E', // Ensure editor background matches theme
        }
    });

    // --- Create Editor Instance ---
    const editor = monaco.editor.create(document.getElementById('editor'), {
        value: getInitialCode(),
        language: 'spellcast',
        theme: 'spellcastTheme',
        automaticLayout: true // Adjust layout on resize
    });

    // --- Run Button Logic ---
    const runButton = document.getElementById('run-button');
    const outputElement = document.getElementById('output');

    function clearOutput() {
        outputElement.innerHTML = '';
    }

    function appendOutput(message, type = 'log') {
        const span = document.createElement('span');
        span.textContent = message + '\n';
        if (type === 'error') {
            span.classList.add('output-error');
        } else if (type === 'info') {
             span.classList.add('output-info');
        }
        outputElement.appendChild(span);
        outputElement.scrollTop = outputElement.scrollHeight; // Scroll to bottom
    }

    function handleInput(promptMessage) {
        // Use the browser's prompt function
        return prompt(promptMessage);
    }


    runButton.addEventListener('click', () => {
        clearOutput();
        const code = editor.getValue();
        const lexer = new Lexer();
        let tokens;
        let program;
        let interpreter;

        try {
            appendOutput('Casting spell...', 'info');
            tokens = lexer.tokenize(code);
            // console.log("Tokens:", tokens); // Optional: log tokens for debugging

            const parser = new Parser(tokens);
            program = parser.parse();
            // console.log("AST:", JSON.stringify(program, null, 2)); // Optional: log AST

            interpreter = new Interpreter(program, appendOutput, handleInput);
            interpreter.run();
            appendOutput('Spell finished.', 'info');

        } catch (error) {
            console.error("SpellCast Error:", error);
            appendOutput(`Error: ${error.message}`, 'error');
            // Optionally provide more detailed error info if available
            if (error.stack) {
                 appendOutput(`Stack: ${error.stack}`, 'error');
            }
        }
    });

    // --- Initial Code ---
    function getInitialCode() {
        return `shout the many cries of "Enter in first number: "
shout the many cries of
    get the character from the spell 10
create a new spell named first with the power of
    find the source of the messages
shout the many cries of "Enter in second number: "
shout the many cries of
    get the character from the spell 10
create a new spell named second with the power of
    find the source of the messages
shout the many cries of "Enter in operator (+ - * /): "
shout the many cries of
    get the character from the spell 10
create a new spell named op with the power of
    find the source of the messages
cast only if the spell is op equal to "+" is true do
    shout the many cries of
        combine the power of first and second
else do
    cast only if the spell is op equal to "-" is true do
        shout the many cries of
            remove the power of second from first
    else do
        cast only if the spell is op equal to "*" is true do
            shout the many cries of
                duplicate the power of first second times
        else do
            cast only if the spell is op equal to "/" is true do
                shout the many cries of
                    split the power of first second times
            else do
                shout the many cries of "Invalid Operator!"
            done
        done
    done
done
`;
    }
});
