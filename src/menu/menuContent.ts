import { COLOR_ROLES } from '../colors/constants/colorPalette';
import { COLOR_PALETTES } from '../colors/constants/colorPalettes';
import { roleLabel } from '../colors/colorRules';
import { FONT_PALETTE, FONT_SIZES } from '../fonts/constants/fontPalette';
import type { ConvertedNumber } from '../tools/types';
import { CUSTOM_COLORS } from './constants/menuConstants';
import type { MenuCommand } from './constants/menuConstants';
import type { MenuState } from './types';

const LINE = '\n\n';

export function commandLink(label: string, command: MenuCommand, args: readonly unknown[] = [], tooltip?: string): string {
    const query = args.length > 0 ? `?${encodeURIComponent(JSON.stringify(args))}` : '';
    return `[${label}](command:${command}${query}${tooltip ? ` "${tooltip}"` : ''})`;
}

function dot(color: string): string {
    return `<span style="color:${color};">&#9679;</span>`;
}

function paletteRow(title: string, kind: 'dark' | 'light', state: MenuState): string {
    const swatches = COLOR_PALETTES.filter((palette) => palette.kind === kind).map((palette) => {
        const isCurrent = state.colorsOn && state.palette === palette.id;
        const label = `${dot(palette.colors.instruction)}${dot(palette.colors.register)}${dot(palette.colors.string)}`;
        return `${commandLink(label, 'fasm.setPalette', [palette.id], palette.label)}${isCurrent ? '&#10003;' : ''}`;
    });
    return `${title}: ${swatches.join(' &nbsp; ')}`;
}

export function numberValuesText(text: string, number: ConvertedNumber): string {
    const values = [number.decimal, number.hex, number.binary, number.octal]
        .map((value) => commandLink(`\`${value}\``, 'fasm.copyValue', [value], 'Copy'));
    return `**${text}** = ${values.join(' &nbsp; ')}`;
}

function currentPaletteName(state: MenuState): string {
    if (!state.colorsOn) {
        return 'Using your theme';
    }
    return COLOR_PALETTES.find((palette) => palette.id === state.palette)?.label ?? 'Automatic';
}

export function buildMainCard(state: MenuState): string {
    const fonts = FONT_PALETTE.map((font) => {
        const name = state.fontFamily === font.family ? `**${font.label}**` : font.label;
        return commandLink(name, 'fasm.setFont', [font.family]);
    });
    const sizes = FONT_SIZES.map((size) => commandLink(size === state.fontSize ? `**${size}**` : String(size), 'fasm.setFontSize', [size]));
    const number = state.number && state.numberText
        ? numberValuesText(state.numberText, state.number)
        : 'Right-click a number to see its value.';

    return [
        `**FASM** &nbsp; ${commandLink('$(list-flat) Format File', 'fasm.formatFile')}`,
        '---',
        `**Number**${LINE}${number}`,
        '---',
        `**Colors** &nbsp; ${currentPaletteName(state)}`,
        paletteRow('Dark', 'dark', state),
        paletteRow('Light', 'light', state),
        [
            commandLink('$(edit) Customize', 'fasm.showColorCard'),
            ...(state.colorsOn ? [commandLink('$(discard) Reset', 'fasm.turnOffColors')] : [])
        ].join(' &nbsp; '),
        '---',
        '**Fonts**',
        fonts.join(' &middot; '),
        `Size: ${sizes.join(' &middot; ')}`,
        [
            commandLink('$(edit) Customize', 'fasm.openSetting', ['@lang:fasm editor.font']),
            commandLink('$(discard) Reset', 'fasm.resetFont')
        ].join(' &nbsp; ')
    ].join(LINE);
}

export function buildColorCard(state: MenuState): string {
    const rows = COLOR_ROLES.map((role) => {
        const swatches = CUSTOM_COLORS.map((color) => commandLink(dot(color), 'fasm.setRoleColor', [role, color], color));
        return `${dot(state.roleColors[role])} **${roleLabel(role)}**: ${swatches.join(' ')}`;
    });
    return [
        `**Customize Colors** &nbsp; ${commandLink('$(arrow-left) Back', 'fasm.openMenu')}`,
        '---',
        ...rows,
        '---',
        [
            commandLink('$(discard) Reset', 'fasm.resetRoleColors'),
            commandLink('$(edit) Other colors', 'fasm.openSetting', ['fasm.colors.overrides'])
        ].join(' &nbsp; ')
    ].join(LINE);
}
