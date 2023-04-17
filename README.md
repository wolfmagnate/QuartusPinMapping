# quartuspinmapping README

ピンアサインを自動化するためのVSCode拡張です。

## 注意！

- バグがあるかもしれません。動作の保証はないです。

- System Verilogを対象としています。VHDL使用者は頑張って機能追加してプルリクするかピンアサイン表を見てがんばってポチポチして設定してください。Verilogは多分動きますが、私はSystem Verilogを使っているので保証できません。

## 動作原理

Quartus Primeのピン割り当ては、プロジェクトフォルダ直下の```プロジェクト名.qsf```という名前のファイルに保存されています。
「qsfファイルは自動的に書きかえるから要らないことをするな」とコメントには書いてあるのですが、これを書き換えたあとにコンパイルしてpin plannerを開くといい感じに書き変わっているので、多分実験の範囲では困りません。
このVSCode拡張が書き換えるのはqsfファイルの以下のような部分です。意味はまあ読んだ通りです。

```
set_location_assignment PIN_B12 -to clk
set_location_assignment PIN_A12 -to fastclk
set_location_assignment PIN_F15 -to resetButton
set_location_assignment PIN_B5 -to decode[0]
set_location_assignment PIN_A4 -to decode[1]
set_location_assignment PIN_B3 -to decode[2]
set_location_assignment PIN_B4 -to decode[3]
set_location_assignment PIN_A5 -to decode[4]
set_location_assignment PIN_A6 -to decode[5]
set_location_assignment PIN_B6 -to decode[6]
set_location_assignment PIN_A3 -to decode[7]
set_location_assignment PIN_E6 -to selector[0]
set_location_assignment PIN_E5 -to selector[1]
set_location_assignment PIN_C4 -to selector[2]
set_location_assignment PIN_C3 -to selector[3]
```

これを自動的に生成することでピン割り当て表をもう二度と見なくて良くなります。
これを生成するため、この拡張は、***現在開かれているエディタのmodule宣言部分を参照します***。
module宣言は以下のような書式になっている必要があります。

```
module countup1display(
    input logic clk, // pin-assign 可変クロック
    input logic fastclk, // pin-assign 固定クロック
    input logic resetButton, // pin-assign テンキーSW5
    output logic [7:0] decode, // pin-assign 7セグLED-A
    output logic [3:0] selector // pin-assign 7セグLED-Aセレクタ
    );
```

要するに、```pin-assign ピンの名前```という書式のコメントを追加するということです。
ピンの名前についても後述するスニペットを使えば覚えなくてよくなります。

このような書式になったSystem Verilogファイルを開いた状態で、ctrl+shift+pでコマンドパレットを開いて、以下のようなコマンドを実行してください。

```
>pin assign
```

これで自動的にqsfファイルの内容を生成してくれます。
成功すれば```Are you sure you want to write to the qsf file?```というダイアログがでます。
OKを選択した場合、開かれているSystem Verilogファイルの存在するディレクトリからルートディレクトリまで順に上にたどりながらqsfという拡張子のファイルを探してきて、見つけたら自動的に書き換えてくれます。
Cancelを選択した場合、書き換えるべき内容をクリップボードにコピーしてくれます。

## インストール方法
1. パッケージから入れる方法

quartuspinmapping-x.y.z.vsixをリポジトリからダウンロードする。(バージョンはそのときにある最新版です)
VSCodeからインストールする。
参考リンク
https://mseeeen.msen.jp/how-to-install-extension-in-visual-studio-code-with-vsix/

2. ソースから実行する方法

このプロジェクトはyoコマンドで作ったVSCode拡張のプロジェクトです。
デフォルトからいじることはほとんどしていないので頑張って調べてください。
参考リンク
https://qiita.com/irico/items/fa60a7e077f4414f0eb6

最終的には
```
npx vsce package
```
のコマンドで手元でvsixファイルをビルドすることが出来れば成功です。


## コードスニペットのインストール方法

この拡張は特定のコメントを読み取るのでスニペットの登録を **強く推奨します** 。
VSCodeのスニペットは、```File > Preferences > Configure User Snippets```からSystem Verilogを選択すれば、System Verilogのコードのスニペットを登録できます。
ここに、このリポジトリのsystemverilog.jsonの内容をコピーしてください。
これにより、```pin```から始まるスニペットが大量に追加されます。
このスニペットをmoduleのinput output宣言の後に使用することで、適切なフォーマットのpin-assignコメントを作成してくれます。