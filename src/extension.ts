import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  let panel: vscode.WebviewPanel | undefined;

  const startMonitoringCommand = vscode.commands.registerCommand(
    'extension.startMonitoring',
    () => {
      if (panel) {
        panel.reveal(vscode.ViewColumn.One);
      } else {
        panel = vscode.window.createWebviewPanel(
          'eventLoopMonitor',
          'Event Loop Monitor',
          vscode.ViewColumn.One,
          {
            enableScripts: true,
          }
        );

        panel.onDidDispose(
          () => {
            panel = undefined;
          },
          null,
          context.subscriptions
        );

        panel.webview.html = getWebviewContent();
      }

      startMonitoring(panel);
    }
  );

  context.subscriptions.push(startMonitoringCommand);
}

function getWebviewContent() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Event Loop Monitor</title>
      <style>
        body { font-family: Arial, sans-serif; }
        #output { white-space: pre; font-family: monospace; }
      </style>
    </head>
    <body>
      <h1>Event Loop Monitor</h1>
      <div id="output"></div>
      <script>
        const vscode = acquireVsCodeApi();
        window.addEventListener('message', event => {
          const message = event.data;
          document.getElementById('output').innerText = message;
        });
      </script>
    </body>
    </html>
  `;
}

function startMonitoring(panel: vscode.WebviewPanel) {
  let lastCheck = process.hrtime();

  const checkEventLoopLatency = () => {
    const hrtime = process.hrtime(lastCheck);
    const latency = hrtime[0] * 1000 + hrtime[1] / 1e6;
    lastCheck = process.hrtime();

    if (panel) {
      panel.webview.postMessage(`Event Loop Latency: ${latency.toFixed(2)} ms`);
    }

    setTimeout(checkEventLoopLatency, 1000);
  };

  checkEventLoopLatency();

  panel.onDidDispose(() => {});
}

export function deactivate() {}
