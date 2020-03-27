// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as child_process from 'child_process'
import { PkgsListView} from './pkgsListView'

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "pythonpackages" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.showpypkgs', () => {
		// The code you place here will be executed every time your command is executed
		const config = vscode.workspace.getConfiguration();
		let currentPyPath = config.get<string>("python.pythonPath");
		if (currentPyPath == undefined) {
			vscode.window.showInformationMessage('No Python Path Found in Config');
			return; 
		} else {
			let pythonVer :string ="";
			vscode.window.showInformationMessage(currentPyPath);
			try {
				pythonVer = child_process.execSync(`${currentPyPath} -V`).toString().trim();
			} catch (err) {
				vscode.window.showInformationMessage("Not A Valid Python Path");
				return;
			}
			
			const packageRaw: string = child_process.execSync(`${currentPyPath} -m pip list`).toString().trim();
			const packageInfo = packageRaw.split(/\s+/);
			
			let packageList : Array<[string,string]> = [] ;
			for (let i = 0; i < packageInfo.length; i += 2) {
				packageList.push([ packageInfo[i], packageInfo[i + 1]]) ;
			}
			let pkgs = new PkgsListView(vscode.ViewColumn.One);
			let pythonInfo = `${pythonVer} ${currentPyPath}`
			pkgs.update(pythonInfo,packageList);


		}
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
