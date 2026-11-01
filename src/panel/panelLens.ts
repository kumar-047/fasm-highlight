import * as vscode from 'vscode';

export class FasmPanelLensProvider implements vscode.CodeLensProvider, vscode.Disposable {
    private readonly changed = new vscode.EventEmitter<void>();
    private readonly listener = vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('fasm.showPanelButton')) {
            this.changed.fire();
        }
    });

    readonly onDidChangeCodeLenses = this.changed.event;

    provideCodeLenses(): vscode.CodeLens[] {
        if (!vscode.workspace.getConfiguration('fasm').get<boolean>('showPanelButton', true)) {
            return [];
        }
        return [new vscode.CodeLens(new vscode.Range(0, 0, 0, 0), {
            title: '$(settings-gear) FASM',
            tooltip: 'Open the FASM panel',
            command: 'fasm.openPanel'
        })];
    }

    dispose(): void {
        this.listener.dispose();
        this.changed.dispose();
    }
}
