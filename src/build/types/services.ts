import type * as vscode from 'vscode';

import type { FasmCompiler } from '../../compiler/fasmCompiler';
import type { ProgramRunner } from '../../run/programRunner';

export interface BuildServices {
    readonly outputChannel: vscode.OutputChannel;
    readonly compiler: FasmCompiler;
    readonly diagnostics: vscode.DiagnosticCollection;
    readonly runner: ProgramRunner;
}
