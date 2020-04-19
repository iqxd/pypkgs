import * as path from 'path';
import * as vscode from 'vscode';
import { PkgDetail, PythonManager } from './pythonManager';



export class PackagesView implements vscode.Disposable {
    public static currentPanel: PackagesView | undefined;

    private readonly panel: vscode.WebviewPanel;
    private readonly extensionPath: string;
    private readonly pythonManager: PythonManager;
    // private isListViewLoaded: boolean = false;
    // private isPanelVisiable: boolean = true;
    private disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionPath: string, pythonManager: PythonManager) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

        if (PackagesView.currentPanel) {
            PackagesView.currentPanel.panel.reveal(column);
        } else {
            PackagesView.currentPanel = new PackagesView(extensionPath, pythonManager, column);
            PackagesView.currentPanel.fetchAndShow();
        }
    }


    private constructor(extensionPath: string, pythonManager: PythonManager, column: vscode.ViewColumn | undefined) {
        this.panel = vscode.window.createWebviewPanel('pypkgs', 'Python Packages', column || vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
        });
        this.extensionPath = extensionPath;
        this.pythonManager = pythonManager;

        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
        this.updateBlank(`${pythonManager.version} ${pythonManager.path}`);

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

    async fetchAndShow() {
        const pkgsBasics = await this.pythonManager.getPkgNameVerList();
        const pkgsNames = pkgsBasics.map(x => x[0]);

        let pkgsDetails = await this.pythonManager.getPkgDetailList(pkgsNames);

        this.updateDetails(`${this.pythonManager.version} ${this.pythonManager.path}`, pkgsDetails);

        const promisesGetVers = pkgsNames.map(pkgName => this.pythonManager.getPkgValidVerList(pkgName));
        
        for (let row = 0; row < promisesGetVers.length; row++) {
            promisesGetVers[row].then((pkgVer) => {
                this.loadPkgVers(pkgVer, row);
            });
        }

    }


    dispose() {
        PackagesView.currentPanel = undefined;
        this.panel.dispose();
    }

    loadPkgVers(PkgValidVerList: string[], row: number) {
        this.panel.webview.postMessage({
            type: 'vers',
            row: row,
            allvers: JSON.stringify(PkgValidVerList)
        });
    }

    updateBlank(pythonInfo: string) {
        this.panel.webview.html = `<!DOCTYPE html> 
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


    updateDetails(pythonInfo: string, pkgsDetails: PkgDetail[]) {
        this.panel.webview.html = this.getHtmlForDetails(pythonInfo, pkgsDetails, this.extensionPath);
    }

    getHtmlForDetails(pythonInfo: string, pkgsDetails: PkgDetail[], extensionPath: string): string {
        const scriptPathOnDisk = vscode.Uri.file(
            path.join(extensionPath, 'res', 'main.js')
        );

        // And the uri we use to load this script in the webview
        const scriptUri = this.panel.webview.asWebviewUri(scriptPathOnDisk);

        let tableContent: string = `<table id="content" border="1">
                <tr>
                <th>NAME</th>
                <th>VERSION</th>
                <th>SUMMARY</th>
                <th>HOMEPAGE</th>
                <th>AUTHOR</th>
                <th>AUTHOREMAIL</th>
                <th>LICENSE</th>
                <th>LOCATION</th>
                <th>AVAILABLE VERSIONS</th>
                </tr>`;

        for (const pkgDetails of pkgsDetails) {
            tableContent += `<tr>
                            <td>${pkgDetails.name}</td>
                            <td>${pkgDetails.version}</td>
                            <td>${pkgDetails.summary}</td>
                            <td><a href=${pkgDetails.homepage}>${pkgDetails.homepage}</td>
                             <td>${pkgDetails.author}</td>
                             <td><a href=mailto:${pkgDetails.authoremail}>${pkgDetails.authoremail}</td>
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