import * as vscode from 'vscode';



export class PkgsListView implements vscode.Disposable {
    
    private readonly panel: vscode.WebviewPanel;
    private isListViewLoaded: boolean = false;
    private isPanelVisiable: boolean = true;
    private disposables: vscode.Disposable[] = [];

    constructor(column: vscode.ViewColumn | undefined) { 
        this.panel = vscode.window.createWebviewPanel('pypkgs', 'Python Packages', column || vscode.ViewColumn.One, {
			enableScripts: true
        });
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
        this.update([]);
    }

    dispose() {
        this.panel.dispose();
     }
    
    //Update the HTML document loaded in the Webview.
    update(packages:Array<[string,string]>) {
        this.panel.webview.html = this.getHtmlForWebview(packages);
    }

    getHtmlForWebview(packages: Array<[string, string]>) {
        let content = `<table border="1">`;
        for (const [name, version] of packages) {
            content += `<tr><td>${name}</td><td>${version}</td></tr>`;
        }
        content += `</table>`;

        return `<!DOCTYPE html> 
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Packages</title>
                </head>
                <body>
                    ${content}
                </body>
                </html>`;
    }

}