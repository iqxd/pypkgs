// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
   const vscode = acquireVsCodeApi();

   const table = document.getElementById('content');
    
    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const message = event.data; // The json data that the extension sent
        const dataType = message.type;
        let row = table.rows[message.row];
        if (dataType == 'vers') {
            let vers = JSON.parse(message.allvers);
            let dropdown = '<select style="width:90px;">';
            for (let ver of vers) {
                dropdown += `<option value ="${ver}">${ver}</option>`;
            }
            dropdown += '</select>';
            row.cells[8].innerHTML = dropdown;
        }
    });
}());