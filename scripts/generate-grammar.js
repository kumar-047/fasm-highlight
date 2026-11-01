// Writes syntaxes/fasm.tmLanguage.json from the compiled symbol table. Runs as part of `npm run compile`.
const fs = require('fs');
const path = require('path');
const { buildGrammar } = require('../out/grammar/buildGrammar');

const target = path.join(__dirname, '..', 'syntaxes', 'fasm.tmLanguage.json');
fs.writeFileSync(target, `${JSON.stringify(buildGrammar(), null, 2)}\n`);
