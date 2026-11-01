import * as vscode from 'vscode';

export function settingsTarget(): vscode.ConfigurationTarget {
    return vscode.workspace.workspaceFolders?.length ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;
}
