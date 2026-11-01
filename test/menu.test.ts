import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const contributes = manifest.contributes;

describe('right-click menu', () => {
    test('it has one FASM item, only on FASM files', () => {
        expect(contributes.menus['editor/context']).toEqual([{ command: 'fasm.openMenu', when: 'editorLangId == fasm', group: '1_modification@9' }]);
    });

    test('it opens the panel, with nothing in the top bar', () => {
        expect(contributes.menus['editor/title']).toBeUndefined();
        const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
            entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
        for (const file of walk(path.join(ROOT, 'src'))) {
            expect(fs.readFileSync(file, 'utf8')).not.toMatch(/showQuickPick|showInputBox/);
        }
    });
});

describe('what was removed', () => {
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
        for (const option of ['Format File', 'Customize', 'Fonts', 'Colors']) {
            expect(readme).toContain(option);
            expect(changelog).toContain(option);
        }
    });
});

describe('secrets', () => {
    const lines = (file: string) => fs.readFileSync(path.join(ROOT, file), 'utf8').split(/\r?\n/);

    test('git ignores .env but keeps the example', () => {
        expect(lines('.gitignore')).toEqual(expect.arrayContaining(['.env', '.env.*', '!.env.example']));
    });

    test('the extension package leaves out every .env file', () => {
        expect(lines('.vscodeignore')).toEqual(expect.arrayContaining(['.env', '.env.*']));
    });

    test('the example file holds no token', () => {
        expect(lines('.env.example')).toContain('OVSX_PAT=');
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
