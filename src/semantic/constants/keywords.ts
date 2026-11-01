import type { SemanticType } from '../types';

export const TOKEN_TYPES: readonly SemanticType[] = ['keyword', 'variable', 'macro'];

export const FASMG_DIRECTIVES = new Set((
    'iterate indx calminstruction namespace rawmatch rmatch reequ redefine mvmacro mvstruc emit dbx '
    + 'restartout outscope esc retaincomments removecomments isolatelines combinelines'
).split(' '));
export const CALM_COMMANDS = new Set((
    'arrange assemble call check compute exit jno jump jyes local match publish rawmatch rmatch stringify take taketext transform'
).split(' '));
