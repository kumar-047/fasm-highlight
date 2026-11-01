import type { FontChoice } from '../types';

const FALLBACK = "Consolas, 'Courier New', monospace";

function font(label: string): FontChoice {
    return { label, family: `'${label}', ${FALLBACK}` };
}

export const FONT_PALETTE: readonly FontChoice[] = [
    { label: 'Consolas', family: FALLBACK },
    font('Cascadia Code'),
    font('JetBrains Mono'),
    font('Fira Code'),
    font('Source Code Pro'),
    font('IBM Plex Mono'),
    font('Hack'),
    font('Ubuntu Mono'),
    font('DejaVu Sans Mono'),
    font('Menlo'),
    font('Monaco'),
    font('Courier New')
];

export const FONT_SIZES: readonly number[] = [11, 12, 13, 14, 15, 16, 18, 20];
