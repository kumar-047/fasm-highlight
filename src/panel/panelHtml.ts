export function renderPanelHtml(options: { cspSource: string; nonce: string; scriptUri: string; iconsUri: string; styleUri: string }): string {
    const { cspSource, iconsUri, nonce, scriptUri, styleUri } = options;
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource}; script-src 'nonce-${nonce}';">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="${styleUri}">
<title>FASM</title>
</head>
<body>
<div id="app"></div>
<script nonce="${nonce}" src="${iconsUri}"></script>
<script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}
