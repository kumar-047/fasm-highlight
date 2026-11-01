import { formatRunCommand } from '../src/run/runCommand';

const PROGRAM = "C:\\my dir\\it's.exe";

describe('formatRunCommand', () => {
    test.each([
        ['C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe', "& 'C:\\my dir\\it''s.exe'"],
        ['C:\\Program Files\\PowerShell\\7\\pwsh.exe', "& 'C:\\my dir\\it''s.exe'"],
        ['C:\\Windows\\System32\\cmd.exe', '"C:\\my dir\\it\'s.exe"'],
        ['C:\\Program Files\\Git\\bin\\bash.exe', "'C:\\my dir\\it'\\''s.exe'"],
        ['', '"C:\\my dir\\it\'s.exe"']
    ])('Windows shell "%s"', (shell, expected) => {
        expect(formatRunCommand(PROGRAM, shell, 'win32')).toBe(expected);
    });

    test.each(['/bin/bash', '/bin/zsh', '/usr/bin/fish', ''])('Unix shell "%s"', (shell) => {
        expect(formatRunCommand('/home/me/my prog', shell, 'linux')).toBe("'/home/me/my prog'");
    });
});
