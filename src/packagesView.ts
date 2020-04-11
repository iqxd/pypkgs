import * as path from 'path';
import * as vscode from 'vscode';
import { PkgDetail} from './pythonManager';



export class PackagesView implements vscode.Disposable {
    
    private readonly panel: vscode.WebviewPanel;
    private isListViewLoaded: boolean = false;
    private isPanelVisiable: boolean = true;
    private disposables: vscode.Disposable[] = [];

    constructor(pythonInfo :string ,column: vscode.ViewColumn | undefined) { 
        this.panel = vscode.window.createWebviewPanel('pypkgs', 'Python Packages', column || vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
        });
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
        this.updateBlank(pythonInfo);
        
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
    
    // loadPkgsDetails(pkgInfo:PkgInfo,row:number) {
    //     this.panel.webview.postMessage({
    //         type : 'details',
    //         row : row,
    //         name: pkgInfo.name,
    //         version: pkgInfo.version,
    //         summary: pkgInfo.summary,
    //         homepage: pkgInfo.homepage,
    //         author: pkgInfo.author,
    //         authoremail: pkgInfo.authoremail,
    //         license: pkgInfo.license,
    //         location: pkgInfo.location
    //     });
    // }

    loadPkgVers(PkgValidVerList:string[],row:number) {
        this.panel.webview.postMessage({
            type :'vers',
            row: row ,
            allvers: JSON.stringify(PkgValidVerList)
        });
    }

    updateBlank(pythonInfo: string) {
        this.panel.webview.html =`<!DOCTYPE html> 
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Packages</title>
            </head>
            <body>
                <h3>${pythonInfo}</h3>
            </body>
            </html>`;
    }
    
    
    updateDetails(pythonInfo :string, pkgsDetails:PkgDetail[],extensionPath:string) {
        this.panel.webview.html = this.getHtmlForDetails(pythonInfo,pkgsDetails,extensionPath);
    }

    getHtmlForDetails(pythonInfo:string, pkgsDetails:PkgDetail[] ,extensionPath:string): string {
        const scriptPathOnDisk = vscode.Uri.file(
			path.join(extensionPath, 'res', 'main.js')
		);

		// And the uri we use to load this script in the webview
		const scriptUri = this.panel.webview.asWebviewUri(scriptPathOnDisk);
        
        let tableContent: string = '<table id="content" border="1">';

        for (const pkgDetails of pkgsDetails) {    
            tableContent += `<tr>
                            <td>${pkgDetails.name}</td>
                            <td>${pkgDetails.version}</td>
                            <td>${pkgDetails.summary}</td>
                            <td>${pkgDetails.homepage}</td>
                             <td>${pkgDetails.author}</td>
                             <td>${pkgDetails.authoremail}</td>
                             <td>${pkgDetails.license}</td>
                             <td>${pkgDetails.location}</td>
                             <td><select style="width:90px;"></select></td>
                             </tr>`;
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
                    <h3>${pythonInfo}</h3>
                    ${tableContent}
                    <script src="${scriptUri}"></script>
                </body>
                </html>`;
    }

}