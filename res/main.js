// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
function versionStringCompare(preVersion = '', lastVersion = '') {
    var sources = preVersion.split('.');
    var dests = lastVersion.split('.');
    var maxL = Math.max(sources.length, dests.length);
    var result = 0;
    for (let i = 0; i < maxL; i++) {
        let preValue = sources.length > i ? sources[i] : 0;
        let preNum = isNaN(Number(preValue)) ? preValue.charCodeAt() : Number(preValue);
        let lastValue = dests.length > i ? dests[i] : 0;
        let lastNum = isNaN(Number(lastValue)) ? lastValue.charCodeAt() : Number(lastValue);
        if (preNum < lastNum) {
            result = -1;
            break;
        } else if (preNum > lastNum) {
            result = 1;
            break;
        }
    }
    return result;
}

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
            
            const currentVer = row.cells[1].innerHTML;
            const latestVer = vers[0];
            if (versionStringCompare(currentVer, latestVer) === -1) {
                row.cells[1].innerHTML = '▲ ' + currentVer;
            }
        }
    });
}());