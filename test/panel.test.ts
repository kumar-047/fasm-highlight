import * as fs from 'node:fs';
import * as path from 'node:path';

import { COLOR_ROLES } from '../src/colors/constants/colorPalette';
import { COLOR_PALETTES } from '../src/colors/constants/colorPalettes';
import { FONT_PALETTE, FONT_SIZES } from '../src/fonts/constants/fontPalette';
import { numberValuesText } from '../src/hover/numberHover';
import { renderPanelHtml } from '../src/panel/panelHtml';
import { parsePanelMessage } from '../src/panel/panelMessages';
import { convertNumber } from '../src/tools/numberConverter';

const ROOT = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const script = fs.readFileSync(path.join(ROOT, 'media', 'panel.js'), 'utf8');

describe('panel messages', () => {
    test.each([
        { type: 'ready' },
        { type: 'formatFile' },
        { type: 'resetColors' },
        { type: 'resetFont' },
        { type: 'openFontSettings' },
        { type: 'setPalette', id: COLOR_PALETTES[0].id },
        { type: 'setRoleColor', role: COLOR_ROLES[0], color: '#a1b2c3' },
        { type: 'setFont', family: FONT_PALETTE[0].family },
        { type: 'setFontSize', size: FONT_SIZES[0] },
        { type: 'convertNumber', text: '0FFh' },
        { type: 'copyValue', value: '255' }
    ])('accepts $type', (message) => {
        expect(parsePanelMessage(message)).toEqual(message);
    });

    test.each([
        [undefined],
        ['ready'],
        [{ type: 'runCommand' }],
        [{ type: 'setPalette', id: 'made-up' }],
        [{ type: 'setRoleColor', role: 'made-up', color: '#a1b2c3' }],
        [{ type: 'setRoleColor', role: COLOR_ROLES[0], color: 'red; x' }],
        [{ type: 'setFont', family: "'Evil', monospace" }],
        [{ type: 'setFontSize', size: 500 }],
        [{ type: 'convertNumber', text: 'x'.repeat(201) }],
        [{ type: 'copyValue', value: 5 }]
    ])('rejects %j', (message) => {
        expect(parsePanelMessage(message)).toBeUndefined();
    });

    test('every message the page sends is one the extension accepts', () => {
        const sent = [...script.matchAll(/send\(\{ type: '(\w+)'/g)].map((match) => match[1]);
        const actions = [...script.matchAll(/data-action="(\w+)"/g)].map((match) => match[1]).filter((action) => action !== 'toggleCustomize');
        const known = ['ready', 'formatFile', 'resetColors', 'resetFont', 'openFontSettings', 'setPalette', 'setRoleColor', 'setFont', 'setFontSize', 'convertNumber', 'copyValue'];
        expect(sent.length).toBeGreaterThan(0);
        expect(actions.length).toBeGreaterThan(0);
        expect(known).toEqual(expect.arrayContaining([...sent, ...actions]));
    });
});

describe('panel page', () => {
    const html = renderPanelHtml({ cspSource: 'vscode-resource:', nonce: 'abc', scriptUri: 'panel.js', iconsUri: 'icons.js', styleUri: 'panel.css' });

    test('it only runs its own scripts', () => {
        expect(html).toContain("default-src 'none'");
        expect(html).toContain("'nonce-abc'");
        expect(html).not.toContain('unsafe');
        expect(html.match(/<script /g)).toHaveLength(2);
    });

    test('it offers only the menu options, with no links', () => {
        expect(script).not.toMatch(/https?:|href=/);
        for (const option of ['Format File', 'Number', 'Colors', 'Fonts', 'Customize', 'Reset']) {
            expect(script).toContain(option);
        }
    });

    test('palettes are shown by name, with no Dark or Light headings', () => {
        expect(script).not.toMatch(/>(Dark|Light)</);
    });

    test('every icon it uses is included', () => {
        const icons = fs.readFileSync(path.join(ROOT, 'media', 'icons.js'), 'utf8');
        const used = [...script.matchAll(/(?:icon|heading)\((?:'[^']+', )?'([a-z-]+)'\)/g)].map((match) => match[1]);
        expect(used.length).toBeGreaterThan(0);
        for (const name of used) {
            expect(icons).toContain(`"${name}"`);
        }
    });
});

describe('panel manifest', () => {
    const { views, viewsContainers } = manifest.contributes;

    test('it can open on either side, and stays hidden until the extension is ready', () => {
        expect(viewsContainers.activitybar[0].id).toBe('fasmPanelLeft');
        expect(viewsContainers.secondarySidebar[0].id).toBe('fasmPanelRight');
        expect(views.fasmPanelLeft[0].when).toBe('fasm.panelReady && !fasm.panelOnRight');
        expect(views.fasmPanelRight[0].when).toBe('fasm.panelReady && fasm.panelOnRight');
    });

    test('its icon is in the package', () => {
        expect(fs.existsSync(path.join(ROOT, viewsContainers.activitybar[0].icon))).toBe(true);
        expect(fs.readFileSync(path.join(ROOT, '.vscodeignore'), 'utf8')).not.toMatch(/^media/m);
    });
});

describe('number hover', () => {
    test('each value links to the copy command', () => {
        const number = convertNumber('0FFh');
        expect(number).toBeDefined();
        const text = numberValuesText('0FFh', number as NonNullable<typeof number>);
        expect(text).toContain('**0FFh**');
        expect(text.match(/command:fasm\.copyValue/g)).toHaveLength(4);
    });
});
