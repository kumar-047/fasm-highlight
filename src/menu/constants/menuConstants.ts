export const MENU_COMMANDS = [
    'fasm.formatFile',
    'fasm.copyValue',
    'fasm.setPalette',
    'fasm.setRoleColor',
    'fasm.resetRoleColors',
    'fasm.turnOffColors',
    'fasm.setFont',
    'fasm.setFontSize',
    'fasm.resetFont',
    'fasm.showColorCard',
    'fasm.openMenu',
    'fasm.openSetting'
] as const;

export type MenuCommand = (typeof MENU_COMMANDS)[number];

export const CUSTOM_COLORS: readonly string[] = [
    '#f28b82', '#fbbc04', '#fff475', '#ccff90', '#a7ffeb', '#7fc7ff', '#aecbfa', '#d7aefb', '#fdcfe8', '#e6c9a8', '#c0c8d0'
];
