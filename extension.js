// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "quartuspinmapping" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('quartuspinmapping.start', function () {
		// The code you place here will be executed every time your command is executed

		
		let editor = vscode.window.activeTextEditor; // エディタ取得
		let doc = editor.document;            // ドキュメント取得
		let cur_selection = editor.selection; // 選択範囲取得
		if(editor.selection.isEmpty){         
		    // 選択範囲が空であれば全てを選択範囲にする
		    let startPos = new vscode.Position(0, 0);
		    let endPos = new vscode.Position(doc.lineCount - 1, 10000);
		    cur_selection = new vscode.Selection(startPos, endPos);
		}

		let text = doc.getText(cur_selection); //取得されたテキスト

		// textを行ごとに分割する
		let lines = text.split('\n');

		let pinAssignments = [];

		// textはSystemVerilogのコード片です。
		// 全ての行を変数linesに代入して、各行をlineに代入してそれぞれに、以下の解析を行う
		for (let line of lines) {
			line = line.trim();
		    // 1. "// pin-assign"が含まれるようなもの以外はcontinueする
		    if (!line.includes("pin-assign")) {
		        continue;
		    }
		
		    // 2. lineが"input"または"output"から始まらない場合はcontinueする
		    if (!(line.startsWith("input") || line.startsWith("output"))) {
		        continue;
		    }
		
		    // 3. lineから必要な情報を抽出する。抽出した情報をキーとして"target"と"pinName"をもつオブジェクトに変換して保存する。
		    let targetMatch = line.match(/(input|output) (logic|wire|reg) (.*)(,\s+\/\/|\s+\/\/)/);
		    let pinNameMatch = line.match(/\/\/ pin-assign (.*)/);
		
		    if (targetMatch && pinNameMatch) {
		        let target = targetMatch[3];
				if (target.endsWith(",")){
					target = target.slice(0, target.length - 1);
				}
		        let pinName = pinNameMatch[1];
			
		        pinAssignments.push({
		            "target": target,
		            "pinName": pinName
		        });
		    }
		}

		let pinNameTable = {
			"固定クロック": "A12",
			"可変クロック": "B12",
			"テンキーSW4": "E15",
			"テンキーSW5": "F15",
			"テンキーSW6": "G15",
			"テンキーSW7": "H15",
			"テンキーSW8": "A16",
			"テンキーSW9": "B16",
			"テンキーSW10": "E16",
			"テンキーSW11": "F16",
			"テンキーSW12": "G16",
			"テンキーSW13": "A17",
			"テンキーSW14": "B17",
			"テンキーSW15": "C17",
			"テンキーSW16": "D17",
			"テンキーSW17": "A18",
			"テンキーSW18": "B18",
			"テンキーSW19": "A19",
			"テンキーSW20": "B19",
			"テンキーSW21": "C19",
			"テンキーSW22": "D19",
			"テンキーSW23": "A20",
			"7セグLED-A": [
				"B5", "A4", "B3", "B4", "A5", "A6", "B6", "A3"
			],
			"7セグLED-Aセレクタ": [
				"E6", "E5", "C4", "C3"
			],
			"7セグLED-B": [
				"D7", "A7", "D6", "B7", "C7", "E7", "F7", "C6"
			],
			"7セグLED-Bセレクタ": [
				"G7", "G8", "G9", "H10"
			],
			"ロータリースイッチ-A": [
				"A14", "B14", "E14", "F14"
			],
			"ロータリースイッチ-B": [
				"A15", "B15", "C15", "D15"
			],
			"ディップスイッチ-A": [
				"A10", "B10", "C10", "D10", "E10", "F10", "G10", "G11"
			],
			"ディップスイッチ-B": [
				"E11", "F11", "A13", "B13", "C13", "D13", "E13", "F13"
			],
			"ブザー": "B20"
		};
		  
		let pinLocationAssignments = [];
		for (let pinAssignment of pinAssignments) {
			let target = pinAssignment.target;
			let pinName = pinAssignment.pinName;
		  
			if (!target.startsWith("[")) {
				let pinLocationAssignment = `set_location_assignment PIN_${pinNameTable[pinName]} -to ${target}`;
				pinLocationAssignments.push(pinLocationAssignment);
			} else {
				// targetが"["から始まる場合、バス幅が複数のピンであるため、複数のpinLocationAssignmentを作成して
				// pinLocationAssignmentsにpushする必要がある。
				let busMatch = target.match(/\[(\d+):(\d+)\] (\w+)/);
		  
				if (busMatch) {
					let upperBound = parseInt(busMatch[1]);
					let lowerBound = parseInt(busMatch[2]);
					let busName = busMatch[3];
					let target_bus = [];
		  
					// バス幅を判定して全てのピンに対して処理を行う。
					for (let i = lowerBound; i <= upperBound; i++) {
					  target_bus.push(`${busName}[${i}]`);
					}
		  
					// それぞれに対して行う処理は以下のとおりである。
					for (let i = 0; i < target_bus.length; i++) {
					  let pinLocationAssignment = `set_location_assignment PIN_${pinNameTable[pinName][i]} -to ${target_bus[i]}`;
					  pinLocationAssignments.push(pinLocationAssignment);
					}
				}
			}
		}

		let pinLocationAssignmentsText = pinLocationAssignments.join('\n');

		// QSFファイルを探索する
		let saveTargetFilePath = '';
		let currentDir = path.dirname(doc.fileName);
	
		while (currentDir !== path.dirname(currentDir)) {
			let filesInCurrentDir = fs.readdirSync(currentDir);
			let qsfFile = filesInCurrentDir.find(file => path.extname(file) === '.qsf');
	
			if (qsfFile) {
				saveTargetFilePath = path.join(currentDir, qsfFile);
				break;
			} else {
				currentDir = path.dirname(currentDir);
			}
		}

		if (saveTargetFilePath == '') {
			vscode.env.clipboard.writeText(pinLocationAssignmentsText);
		} else {
			const options = {
				title: 'Write to QSF file',
				message: 'Are you sure you want to write to the qsf file?',
				buttons: ['OK', 'Cancel']
			};
			vscode.window.showInformationMessage(options.message, ...options.buttons).then(choice => {
				if (choice === 'OK') {
					vscode.workspace.openTextDocument(saveTargetFilePath).then(document => {
						let modifiedLines = [];
						for (let i = 0; i < document.lineCount; i++) {
							let lineText = document.lineAt(i).text;
							if (!lineText.startsWith('set_location_assignment')) {
								modifiedLines.push(lineText);
							}
						}
						if(modifiedLines[modifiedLines.length - 1] == ''){
							modifiedLines.push("");
						}
						modifiedLines.push(pinLocationAssignmentsText);
						modifiedLines.push("");
				
						const modifiedContent = modifiedLines.join('\n');
						const fileUri = vscode.Uri.file(saveTargetFilePath);
						const fileContent = new Uint8Array(Buffer.from(modifiedContent, 'utf8'));
				
						vscode.workspace.fs.writeFile(fileUri, fileContent).then(() => {
							console.log('Modified QSF file saved successfully');
						}, error => {
							console.error('Error writing modified QSF file:', error);
						});
					});
				} else if (choice === 'Cancel') {
					vscode.env.clipboard.writeText(pinLocationAssignmentsText);
				}
			});
		}
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
