import * as fs from 'node:fs';
import * as path from 'node:path';

import { OLD_THEME_NAME } from '../src/colors/constants/colorPalette';
import { usesOldTheme } from '../src/colors/themeUpgrade';

const ROOT = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const snippets = JSON.parse(fs.readFileSync(path.join(ROOT, 'snippets', 'fasm.json'), 'utf8'));

// 0.2.1 is published with these, and existing users depend on them. Changing any of them breaks their upgrade.
describe('existing users keep what they have', () => {
    test('the identity is unchanged, so they receive this as an update', () => {
        expect(manifest.publisher).toBe('kumar-047');
        expect(manifest.name).toBe('fasm-highlight');
        expect(manifest.displayName).toBe('FASM Highlight');
        expect(manifest.icon).toBe('icon.png');
        expect(manifest.repository.url).toBe('https://github.com/kumar-047/fasm-highlight');
    });

    test.each(['fasm.build'])('command %s still exists', (command) => {
        expect(manifest.contributes.commands.map((item: { command: string }) => item.command)).toContain(command);
    });

    test('the Build shortcut is unchanged', () => {
        expect(manifest.contributes.keybindings).toEqual([
            { command: 'fasm.build', key: 'ctrl+shift+b', when: 'editorLangId == fasm' }
        ]);
    });

    test.each(['fasm.compilerPath', 'fasm.memoryLimit', 'fasm.passesLimit', 'fasm.generateSymbols'])('setting %s still exists', (setting) => {
        expect(manifest.contributes.configuration.properties[setting]).toBeDefined();
    });

    test('the language and file types are unchanged', () => {
        const [language] = manifest.contributes.languages;
        expect(language.id).toBe('fasm');
        expect(language.extensions).toEqual(['.asm', '.inc']);
        expect(manifest.contributes.grammars[0].scopeName).toBe('source.fasm');
    });

    test('every snippet prefix is still there', () => {
        const prefixes = Object.values(snippets).map((snippet) => (snippet as { prefix: string }).prefix);
        expect(prefixes).toEqual(expect.arrayContaining([
            'win32', 'win64', 'linux', 'proc', 'proc64', 'macro', 'struct', 'if', 'repeat', 'include',
            'msgbox32', 'msgbox64', 'datasec', 'loop', 'linux32', 'macos64', 'elfobj', 'coffobj'
        ]));
    });
});

describe('the upgrade is explained', () => {
    const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');

    test('the README explains the removed theme', () => {
        expect(readme).toContain(OLD_THEME_NAME);
    });
});

describe('people on the old theme', () => {
    test('they are recognised', () => {
        expect(usesOldTheme(OLD_THEME_NAME)).toBe(true);
    });

    test.each(['Default Dark Modern', undefined])('others are left alone: %s', (theme) => {
        expect(usesOldTheme(theme)).toBe(false);
    });
});
