export const BLOCK_START = /^\s*(?:[\w.?$@]+:\s*)?(?:(?:if|while|repeat|virtual|proc|struct|iterate|namespace|calminstruction|rawmatch|rmatch)\b|data\b(?!\s*(?::|=|d[bwdqtpfu]\b|r[bwdqtpf]\b|equ\b))|[^;]*\{\s*(?:;.*)?$)/;
export const BLOCK_END = /^\s*(?:end\s+\w+|endp\b|ends\b|\})/;
export const BLOCK_MIDDLE = /^\s*else\b/;
export const BRACELESS_BLOCK = /^\s*(?:[\w.?$@]+:\s*)?(?:macro|struc|rept|irp|irps|irpv|match|postpone)\b/i;
export const CALM_START = /^\s*calminstruction\b/i;
export const CALM_END = /^\s*end\s+calminstruction\b/i;
export const LABEL_ONLY = /^[A-Za-z_.?@][\w.?$@]*:$/;
