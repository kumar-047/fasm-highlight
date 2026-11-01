export const WORD_START = '(?<![\\w.@$?])';
export const WORD_END = '(?![\\w.@$?])';
export const STATEMENT_START = '(?:^\\s*|(?<=[:{])\\s*)';
export const NOT_A_DEFINITION = '(?!\\s*[:=]|\\s+(?:d[bwdqtpfu]|r[bwdqtpf]|equ|fix|label)\\b)';
