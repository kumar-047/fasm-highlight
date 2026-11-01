import { COLOR_PALETTES } from '../src/colors/constants/colorPalettes';
import { COLOR_ROLES } from '../src/colors/constants/colorPalette';
import { FONT_PALETTE, FONT_SIZES } from '../src/fonts/constants/fontPalette';
import { MENU_COMMANDS } from '../src/menu/constants/menuConstants';
import { buildColorCard, buildMainCard, commandLink, numberValuesText } from '../src/menu/menuContent';
import type { MenuState } from '../src/menu/types';

const roleColors = Object.fromEntries(COLOR_ROLES.map((role) => [role, '#112233'])) as MenuState['roleColors'];
const state: MenuState = { colorsOn: true, palette: 'ember', fontFamily: FONT_PALETTE[1].family, fontSize: 14, roleColors };

function commandsIn(text: string): string[] {
    return [...text.matchAll(/\(command:([\w.]+)/g)].map((match) => match[1]);
}

describe('command links', () => {
    test('arguments are encoded so special characters stay safe', () => {
        const link = commandLink('x', 'fasm.setFont', ["'A B', mono"]);
        const encoded = /\?(.+)\)$/.exec(link)?.[1] ?? '';
        expect(JSON.parse(decodeURIComponent(encoded))).toEqual(["'A B', mono"]);
        expect(encoded).not.toMatch(/[\s"]/);
    });

    test.each([['main', buildMainCard(state)], ['colors', buildColorCard(state)]])('every link on the %s card is an allowed command', (_name, text) => {
        const allowed: readonly string[] = MENU_COMMANDS;
        expect(commandsIn(text).length).toBeGreaterThan(0);
        expect(commandsIn(text).filter((command) => !allowed.includes(command))).toEqual([]);
    });

    test('colored spans use the exact form the editor allows', () => {
        const styles = [...(buildMainCard(state) + buildColorCard(state)).matchAll(/style="([^"]*)"/g)].map((match) => match[1]);
        expect(styles.length).toBeGreaterThan(0);
        for (const style of styles) {
            expect(style).toMatch(/^color:#[0-9a-fA-F]{6};$/);
        }
    });
});

describe('main card', () => {
    const card = buildMainCard(state);

    test('it has one swatch per palette, labelled for hover', () => {
        for (const palette of COLOR_PALETTES) {
            expect(card).toContain(`"${palette.label}"`);
        }
    });

    test('it marks the current palette, font and size', () => {
        expect(card).toContain('&#10003;');
        expect(card).toContain(`**${FONT_PALETTE[1].label}**`);
        expect(card).toContain('**14**');
    });

    test('it offers every font and size, plus customize', () => {
        for (const font of FONT_PALETTE) {
            expect(card).toContain(font.label);
        }
        expect(commandsIn(card).filter((command) => command === 'fasm.setFontSize')).toHaveLength(FONT_SIZES.length);
        expect(card.match(/Customize/g)).toHaveLength(2);
    });

    test('it has Format File', () => {
        expect(commandsIn(card)).toContain('fasm.formatFile');
    });

    test('it explains the number section when there is no number', () => {
        expect(card).toContain('Right-click a number');
    });

    test('it shows the number when there is one', () => {
        const withNumber = buildMainCard({ ...state, numberText: '0FFh', number: { decimal: '255', hex: '0FFh', binary: '11111111b', octal: '377o' } });
        expect(withNumber).toContain('**0FFh**');
        expect(commandsIn(withNumber)).toContain('fasm.copyValue');
    });

    test('Reset only appears when colors are on', () => {
        expect(commandsIn(card)).toContain('fasm.turnOffColors');
        expect(commandsIn(buildMainCard({ ...state, colorsOn: false }))).not.toContain('fasm.turnOffColors');
    });
});

describe('customize card', () => {
    const card = buildColorCard(state);

    test('it lists every kind of word with swatches', () => {
        expect(commandsIn(card).filter((command) => command === 'fasm.setRoleColor').length).toBe(COLOR_ROLES.length * 11);
    });

    test('it can go back', () => {
        expect(commandsIn(card)).toContain('fasm.openMenu');
    });
});

test('number values can each be copied', () => {
    const text = numberValuesText('255', { decimal: '255', hex: '0FFh', binary: '11111111b', octal: '377o' });
    expect(commandsIn(text)).toEqual(['fasm.copyValue', 'fasm.copyValue', 'fasm.copyValue', 'fasm.copyValue']);
});
