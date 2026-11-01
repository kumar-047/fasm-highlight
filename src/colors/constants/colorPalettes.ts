import type { ColorPalette } from '../types';
import { DARK_COLORS, LIGHT_COLORS } from './colorPalette';

export const AUTO_PALETTE = 'auto';

export const COLOR_PALETTES: readonly ColorPalette[] = [
    { id: 'fasm-dark', label: 'FASM Dark', kind: 'dark', colors: DARK_COLORS },
    {
        id: 'ember',
        label: 'Ember',
        kind: 'dark',
        colors: {
            comment: '#9a948c',
            string: '#e6c07b',
            label: '#f2a65a',
            section: '#ffc66d',
            data: '#d7a0e8',
            directive: '#ff9e64',
            helper: '#e8b89a',
            instruction: '#ff7b54',
            register: '#6cb6ff',
            number: '#f0c674',
            operator: '#c9c2b8'
        }
    },
    {
        id: 'ocean',
        label: 'Ocean',
        kind: 'dark',
        colors: {
            comment: '#8499ad',
            string: '#a5d6a7',
            label: '#4dd0e1',
            section: '#80deea',
            data: '#90caf9',
            directive: '#b39ddb',
            helper: '#80cbc4',
            instruction: '#64b5f6',
            register: '#f48fb1',
            number: '#ffcc80',
            operator: '#b0bec5'
        }
    },
    {
        id: 'forest',
        label: 'Forest',
        kind: 'dark',
        colors: {
            comment: '#8f9e8b',
            string: '#d4c98a',
            label: '#8fce7f',
            section: '#b5e48c',
            data: '#a3be8c',
            directive: '#d9a66c',
            helper: '#88c9a1',
            instruction: '#7fd18c',
            register: '#e0a96d',
            number: '#ebcb8b',
            operator: '#bfc8b8'
        }
    },
    {
        id: 'mono',
        label: 'Mono',
        kind: 'dark',
        colors: {
            comment: '#8c8c8c',
            string: '#b5b5b5',
            label: '#ffffff',
            section: '#e0e0e0',
            data: '#c8c8c8',
            directive: '#d6d6d6',
            helper: '#c0c0c0',
            instruction: '#f5f5f5',
            register: '#a8c7e0',
            number: '#d0d0d0',
            operator: '#a8a8a8'
        }
    },
    { id: 'fasm-light', label: 'FASM Light', kind: 'light', colors: LIGHT_COLORS },
    {
        id: 'paper',
        label: 'Paper',
        kind: 'light',
        colors: {
            comment: '#6f6a5f',
            string: '#8a5a00',
            label: '#7a3e00',
            section: '#955a00',
            data: '#5f6b00',
            directive: '#8b3a62',
            helper: '#6b4f2a',
            instruction: '#a4361f',
            register: '#245f8f',
            number: '#7a5200',
            operator: '#544f46'
        }
    },
    {
        id: 'sky',
        label: 'Sky',
        kind: 'light',
        colors: {
            comment: '#5f7385',
            string: '#00695c',
            label: '#00607a',
            section: '#0058a3',
            data: '#2e6b8a',
            directive: '#5a3ea8',
            helper: '#00748a',
            instruction: '#0b57d0',
            register: '#a83279',
            number: '#8a5a00',
            operator: '#475a6b'
        }
    }
];
