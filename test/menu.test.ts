import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const contributes = manifest.contributes;

describe('right-click menu', () => {
    test('it only shows on FASM files', () => {
        expect(contributes.menus['editor/context'][0].when).toBe('editorLangId == fasm');
        expect(contributes.menus['editor/context'][0].submenu).toBe('fasm.contextMenu');
    });

    test('it has the four options', () => {
        expect(contributes.menus['fasm.contextMenu'].map((item: { command: string }) => item.command)).toEqual([
            'fasm.formatFile', 'fasm.checkNumber', 'fasm.changeFont', 'fasm.changeColors'
        ]);
    });

    test('fonts and colours are palettes', () => {
        const titles = contributes.commands.map((item: { title: string }) => item.title);
        expect(titles).toEqual(expect.arrayContaining(['Font Palette', 'Color Palette']));
    });

    test('every menu item is a real command', () => {
        const commands = contributes.commands.map((item: { command: string }) => item.command);
        for (const item of contributes.menus['fasm.contextMenu']) {
            expect(commands).toContain(item.command);
        }
    });
});

describe('what was removed', () => {
    test('there is no panel', () => {
        expect(contributes.viewsContainers).toBeUndefined();
        expect(contributes.views).toBeUndefined();
        expect(contributes.menus['editor/title']).toBeUndefined();
        expect(fs.existsSync(path.join(ROOT, 'src', 'panel'))).toBe(false);
        expect(fs.existsSync(path.join(ROOT, 'media'))).toBe(false);
    });

    test('there is no run command', () => {
        const commands = contributes.commands.map((item: { command: string }) => item.command);
        expect(commands).not.toContain('fasm.buildAndRun');
        expect(commands).not.toContain('fasm.stop');
    });
});

describe('documentation', () => {
    const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
    const snippets = JSON.parse(fs.readFileSync(path.join(ROOT, 'snippets', 'fasm.json'), 'utf8'));

    test('the README lists every snippet prefix', () => {
        for (const snippet of Object.values(snippets)) {
            expect(readme).toContain(`\`${(snippet as { prefix: string }).prefix}\``);
        }
        expect(readme).toContain('`program`');
    });

    test('the README lists every setting people change directly', () => {
        for (const setting of Object.keys(contributes.configuration.properties).filter((key) => key !== 'fasm.colors.overrides')) {
            expect(readme).toContain(`\`${setting}\``);
        }
    });

    test('the README and changelog name every menu option', () => {
        const changelog = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8');
        for (const option of ['Format File', 'Check Number Value', 'Font Palette', 'Color Palette']) {
            expect(readme).toContain(option);
            expect(changelog).toContain(option);
        }
    });

    test('neither one mentions the removed panel', () => {
        expect(readme).not.toMatch(/side panel|FASM panel|control panel/i);
    });
});

describe('settings', () => {
    test.each(['fasm.compilerPath', 'fasm.format.commentColumn', 'fasm.format.operandColumn', 'fasm.format.spaceAfterComma', 'fasm.format.maxBlankLines'])('%s exists', (setting) => {
        expect(contributes.configuration.properties[setting]).toBeDefined();
    });

    test('the version is newer than the published 0.2.1', () => {
        const [major, minor, patch] = manifest.version.split('.').map(Number);
        expect(major * 10000 + minor * 100 + patch).toBeGreaterThan(201);
    });
});
