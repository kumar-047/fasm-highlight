import * as cp from 'child_process';
import * as path from 'path';
import * as vscode from 'vscode';
import { formatRunCommand } from './runCommand';

const TERMINAL_NAME = 'FASM Run';

// Programs run in a real terminal, so they can read input and use the Windows console API.
export class ProgramRunner implements vscode.Disposable {
    private terminal: vscode.Terminal | undefined;
    private readonly closeListener: vscode.Disposable;

    constructor() {
        this.closeListener = vscode.window.onDidCloseTerminal((closed) => {
            if (closed === this.terminal) {
                this.terminal = undefined;
            }
        });
    }

    run(programPath: string): void {
        this.terminal?.dispose();
        this.terminal = vscode.window.createTerminal({ name: TERMINAL_NAME, cwd: path.dirname(programPath) });
        this.terminal.show();
        this.terminal.sendText(formatRunCommand(programPath, vscode.env.shell, process.platform));
    }

    async stop(): Promise<boolean> {
        const terminal = this.terminal;
        if (!terminal) {
            return false;
        }

        // Windows GUI programs outlive their terminal, so end the whole process tree there.
        const processId = await terminal.processId;
        if (process.platform === 'win32' && processId) {
            cp.spawn('taskkill', ['/PID', String(processId), '/T', '/F'], { stdio: 'ignore' }).on('error', () => undefined);
        }
        terminal.dispose();
        return true;
    }

    dispose(): void {
        this.closeListener.dispose();
    }
}
