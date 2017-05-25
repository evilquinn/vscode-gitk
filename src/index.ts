// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { GitkViewProvider, GITKURI } from './gitkViewProvider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "gitk" is now active!');


    const provider = new GitkViewProvider();
    const registration = vscode.workspace.registerTextDocumentContentProvider('gitk', provider);


    const disposable = vscode.commands.registerCommand('extension.gitk', (fileUri?: vscode.Uri) => {
        // The code you place here will be executed every time your command is executed

        if ((!fileUri || !fileUri.fsPath) && (!vscode.window.activeTextEditor || !vscode.window.activeTextEditor.document)) {
            vscode.window.showWarningMessage('You have to select a document for gitk');
            return;
        }

        const fileName = (fileUri && fileUri.fsPath) || (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.fileName);
        let config = vscode.workspace.getConfiguration('gitk');

        vscode.workspace.onDidChangeConfiguration(() => {
            config = vscode.workspace.getConfiguration('gitk');
            provider.updateConfig(GITKURI, config);
        }, this, context.subscriptions);

        if (vscode.workspace.textDocuments.some(t => t.fileName === '/gitk')) {
            return provider
                .updateCommits(GITKURI, fileName, config)
                .catch(err => {
                    vscode.window.showErrorMessage(err);
                });
        }

        vscode.commands.executeCommand('vscode.previewHtml', GITKURI, vscode.ViewColumn.One, 'gitk')
            .then(success => {
                return provider
                    .updateCommits(GITKURI, fileName, config)
                    .then(() => {
                        vscode.window.setStatusBarMessage('Double click on commit for copying hash into clipboard', 5000);
                    })
                    .catch(err => {
                        vscode.window.showErrorMessage(err);
                    });
            }, reason => {
                vscode.window.showErrorMessage(reason);
            });

    });

    vscode.commands.registerCommand('extension.refreshgitk', (uri: string, commit: string) => {
        provider.updateDetail(GITKURI, uri, commit);
    });

    context.subscriptions.push(disposable, registration);

}

// this method is called when your extension is deactivated
export function deactivate() {
}