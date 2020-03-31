// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as child_process from 'child_process';
import { PkgsListView } from './PkgsListView';
import { PythonEnv } from './PythonEnv';

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
			
			// const packageRaw: string = child_process.execSync(`${currentPyPath} -m pip list`).toString().trim();
			// const packageInfo = packageRaw.split(/\s+/);
			
			// let packageList : Array<[string,string]> = [] ;
			// for (let i = 0; i < packageInfo.length; i += 2) {
			// 	packageList.push([ packageInfo[i], packageInfo[i + 1]]) ;
			// }

			const python = new PythonEnv(currentPyPath);
			const pkgsBasics = python.getPkgNameVerList();
			const pkgsNames = pkgsBasics.map(x => x[0]);

			const pkgsDetails = python.getPkgInfoList(pkgsNames);
			
			let pythonInfo = `${pythonVer} ${currentPyPath}`

			let pkgs = new PkgsListView(vscode.ViewColumn.One);

			let content = `<table id = 'pkgs' border= '1'><caption>${pythonInfo}</caption>`;
			let versdroplist = `<select>`;
			for (const detail of pkgsDetails) {
				if (detail != null) {
					let versDropDownList = `<select>`;
					let pkgVers = python.getPkgAllVers(detail.name);
					for (const ver of pkgVers) {
						versDropDownList += `<option value ="${ver}">${ver}</option>`;
					}
					versDropDownList += `</select>`;

					content += `<tr><td>${detail.name}</td><td>${detail.version}</td><td>${detail.summary}
					</td><td>${detail.homepage}</td><td>${detail.author}</td><td>${detail.authoremail}</td>
					<td>${detail.license}</td><td>${detail.location}</td><td>${versDropDownList}</td></tr>`;
				}
			}
			content += `</table>`;	


			pkgs.update(content);

		
		}
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
