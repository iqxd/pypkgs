import * as path from 'path';
import * as vscode from 'vscode';
import { PkgInfo,PkgVersInfo} from './PythonEnv';



export class PkgsListView implements vscode.Disposable {
    
    private readonly panel: vscode.WebviewPanel;
    private isListViewLoaded: boolean = false;
    private isPanelVisiable: boolean = true;
    private disposables: vscode.Disposable[] = [];

    constructor(rowCount:number , colCount:number, desc:string, extensionPath:string ,column: vscode.ViewColumn | undefined) { 
        this.panel = vscode.window.createWebviewPanel('pypkgs', 'Python Packages', column || vscode.ViewColumn.One, {
			enableScripts: true
        });
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
        this.update(rowCount, colCount, desc, extensionPath);
        
        // Handle messages from the webview
		this.panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'alert':
						vscode.window.showErrorMessage(message.text);
						return;
				}
			},
			null,
			this.disposables
		);

    }

    dispose() {
        this.panel.dispose();
    }
    
    loadPkgsDetails(pkgInfo:PkgInfo,row:number) {
        this.panel.webview.postMessage({
            type : 'details',
            row : row,
            name: pkgInfo.name,
            version: pkgInfo.version,
            summary: pkgInfo.summary,
            homepage: pkgInfo.homepage,
            author: pkgInfo.author,
            authoremail: pkgInfo.authoremail,
            license: pkgInfo.license,
            location: pkgInfo.location
        });
    }

    loadPkgVers(versInfo:PkgVersInfo,row:number) {
        this.panel.webview.postMessage({
            type :'vers',
            row: row ,
            name: versInfo.name,
            allvers: JSON.stringify(versInfo.allvers)
        });
    }
    
    //Update the HTML document loaded in the Webview.
    update(rowCount:number , colCount:number,desc:string,extensionPath:string) {
        this.panel.webview.html = this.getHtmlForWebview(rowCount,colCount,desc,extensionPath);
    }

    getHtmlForWebview(rowCount: number, colCount: number, desc: string,extensionPath:string): string {
        const scriptPathOnDisk = vscode.Uri.file(
			path.join(extensionPath, 'res', 'main.js')
		);

		// And the uri we use to load this script in the webview
		const scriptUri = this.panel.webview.asWebviewUri(scriptPathOnDisk);


        let tableContent: string = '<table id="content" border="1">';
        for (let row = 0; row < rowCount; row++){
            tableContent += '<tr>';
            for (let col = 0; col < colCount; col++){
                tableContent += '<td></td>';
            }
            tableContent += '</tr>';
        }
        tableContent += '</table>';

        return `<!DOCTYPE html> 
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Packages</title>
                </head>
                <body>
                    <h3>${desc}</h3>
                    ${tableContent}
                    <script src="${scriptUri}"></script>
                </body>
                </html>`;
    }

}