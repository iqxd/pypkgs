// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { PackagesView } from './packagesView';
import { PythonManager } from './pythonManager';


export async function activate(context: vscode.ExtensionContext) {


	let showPyPkgs = vscode.commands.registerCommand('extension.showpypkgs', async () => {
	
		const config = vscode.workspace.getConfiguration();
		let currentPyPath = config.get<string>("python.pythonPath");
		if (currentPyPath == undefined) {
			vscode.window.showInformationMessage('No Python Path Found in Config');
			return;
		}
		vscode.window.showInformationMessage(currentPyPath);


		const python = new PythonManager(currentPyPath);


		if (!python.valid) {
			vscode.window.showInformationMessage("Not A Valid Python Path");
			return;
		}

		PackagesView.createOrShow(context.extensionPath, python);

	});
	
	let statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	statusBarItem.text = 'showpypkgs';
	statusBarItem.command = 'extension.showpypkgs';
	
	context.subscriptions.push(showPyPkgs);
	context.subscriptions.push(statusBarItem);

	statusBarItem.show();
}  

// this method is called when your extension is deactivated
export function deactivate() { }
