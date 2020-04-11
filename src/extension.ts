// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as child_process from 'child_process';
import { PackagesView } from './packagesView';
import { PythonManager } from './pythonManager';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "pythonpackages" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.showpypkgs', async () => {
		// The code you place here will be executed every time your command is executed
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

		let pythonInfo = `${python.version} ${currentPyPath}`;
		let pkgs = new PackagesView(pythonInfo, vscode.ViewColumn.One);

		const pkgsBasics = await python.getPkgNameVerList();
		const pkgsNames = pkgsBasics.map(x => x[0]);

		let pkgsDetails = await python.getPkgDetailList(pkgsNames);
		
		pkgs.updateDetails(pythonInfo, pkgsDetails, context.extensionPath);

		let promisesGetVers: Promise<any>[] = [];
		for (const pkgName of pkgsNames) {
			promisesGetVers.push(python.getPkgValidVerList(pkgName));
		}

		//const [pkgsDetails, ...pkgsVers] = await Promise.all(promises);

		// let pkgVersDict: { [key: string]: string[] } = {};
		// for (const pkgVers of pkgsVers) {
		// 	pkgVersDict[pkgVers.name] = pkgVers.allvers;
		// }

		// promiseGetDetails.then((pkgsDetails) => {
		// 	for (let row = 0; row < pkgsDetails.length; row++) {
		// 		pkgs.loadPkgsDetails(pkgsDetails[row], row);
		// 	}
		// });
		for (let row = 0; row < promisesGetVers.length; row++) {
			promisesGetVers[row].then((pkgVer) => {
				pkgs.loadPkgVers(pkgVer, row);
			});
		}
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }
