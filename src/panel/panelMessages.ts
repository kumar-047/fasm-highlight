import { COLOR_ROLES } from '../colors/constants/colorPalette';
import { COLOR_PALETTES } from '../colors/constants/colorPalettes';
import type { ColorRole } from '../colors/types';
import { FONT_PALETTE, FONT_SIZES } from '../fonts/constants/fontPalette';
import type { PanelMessage } from './types';

const MAX_TEXT_LENGTH = 200;

export function parsePanelMessage(raw: unknown): PanelMessage | undefined {
    if (!raw || typeof raw !== 'object') {
        return undefined;
    }
    const message = raw as Record<string, unknown>;

    switch (message.type) {
        case 'ready':
        case 'formatFile':
        case 'resetColors':
        case 'resetFont':
        case 'openFontSettings':
            return { type: message.type };
        case 'setPalette':
            return COLOR_PALETTES.some((palette) => palette.id === message.id) ? { type: 'setPalette', id: message.id as string } : undefined;
        case 'setRoleColor':
            return COLOR_ROLES.includes(message.role as ColorRole) && typeof message.color === 'string' && /^#[0-9a-f]{6}$/i.test(message.color)
                ? { type: 'setRoleColor', role: message.role as ColorRole, color: message.color }
                : undefined;
        case 'setFont':
            return FONT_PALETTE.some((font) => font.family === message.family) ? { type: 'setFont', family: message.family as string } : undefined;
        case 'setFontSize':
            return FONT_SIZES.includes(message.size as number) ? { type: 'setFontSize', size: message.size as number } : undefined;
        case 'convertNumber':
            return typeof message.text === 'string' && message.text.length <= MAX_TEXT_LENGTH ? { type: 'convertNumber', text: message.text } : undefined;
        case 'copyValue':
            return typeof message.value === 'string' && message.value.length <= MAX_TEXT_LENGTH ? { type: 'copyValue', value: message.value } : undefined;
        default:
            return undefined;
    }
}
