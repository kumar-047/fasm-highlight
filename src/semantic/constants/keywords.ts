import type { SemanticType } from '../types';

export const TOKEN_TYPES: readonly SemanticType[] = ['keyword', 'variable', 'operator', 'function'];

export const FASMG_OPERATORS = new Set(['element', 'float', 'metadata', 'scale', 'string', 'trunc']);

export const MACRO_DEFINITION = /^\s*(?:macro|struc)\s+(?:\([^)]*\)\s*)?([A-Za-z_][\w.]*)/gim;
