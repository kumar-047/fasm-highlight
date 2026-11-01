export const BLOCK_START = /^\s*(?:[\w.?$@]+:\s*)?(?:(?:if|while|repeat|virtual|proc|struct)\b|data\b(?!\s*(?::|=|d[bwdqtpfu]\b|r[bwdqtpf]\b|equ\b))|[^;]*\{\s*(?:;.*)?$)/;
export const BLOCK_END = /^\s*(?:end\s+\w+|endp\b|ends\b|\})/;
export const BLOCK_MIDDLE = /^\s*else\b/;
