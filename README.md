# runesu-cocona

Cocona（ルネス）の手書き「日報」「日計表」を、Google Apps Script＋スプレッドシートの Web アプリとしてデジタル化するプロジェクト。

## デザイン案（GitHub Pages）

- 一覧: https://mukouyamasouta.github.io/runesu-cocona/
- A 帳票そのまま: https://mukouyamasouta.github.io/runesu-cocona/design/#a
- B 入力ガイド＋検算: https://mukouyamasouta.github.io/runesu-cocona/design/#b
- C 表計算ライク: https://mukouyamasouta.github.io/runesu-cocona/design/#c

`design/index.html` は単体で開ける HTML。数字はサンプル。

## 方針（決定済み）

- 構成: 独立した GAS Web アプリ（Cocona 専用スプレッドシート）。社内ポータル（職員台帳）とは分ける
- 入力端末: 事務所の PC
- 実装: Codex に委任

## 計算式（仮・要確認）

| 項目 | 式 |
|---|---|
| 金種金額 | 枚数 × 額面 |
| 現金在高 | 金種金額の合計 |
| 売上計(税込) | ①〜⑰ の合計 |
| 掛売合計 | 掛売内訳の合計（医局(現金) を含めるかは要確認） |
| Cocona分 | 売上計 − ⑬パルテール |
| 過不足 | 現金在高 −（釣り銭 120,000 ＋ 売上計 − 掛売計 − 商品券）※要確認 |
| 在高計 | 現金在高 − 釣り銭 ※要確認 |
| 日報 売上金額 / 内Café | 日計表の売上計 / ⑭＋⑮ ※要確認 |

## GAS Web アプリ（A案で実装・2026-10-24）

- コード: `gas/`（`コード.js` サーバー、`index.html` 画面、clasp 管理）
- 紐づけ先スプレッドシート「Cocona 日報・日計表」: `1bqC2-snsEBbszlSrpEG5gFCCBUZgNw9uE05rdN-S3g8`（Drive の ルネス/ココナ。スクリプトはこのシートのコンテナバインド）
  - シート「日報日計表」… 1日1行（日付・入力値・自動計算値・確認欄）
  - シート「設定」… B2 が釣り銭（既定 120,000）
- Apps Script: `1wHwASCvD9wHXi762iFl7jnm0zvFRZWfxwE49yGwyvqA9kadX-n5I5SMa`
- Web アプリ（開発用・自分のみアクセス可）: https://script.google.com/macros/s/AKfycbzKfEpl66bo5cvAxDSOX8fJPPG7NUY5pYJgxmEeiskxRavgDq7paUAVpeiChU-SxahXog/exec
- 更新手順: `cd gas && clasp push && clasp deploy -i AKfycbzKfEpl66bo5cvAxDSOX8fJPPG7NUY5pYJgxmEeiskxRavgDq7paUAVpeiChU-SxahXog`
- 依頼書（2026.10.9）の反映: 確認欄はココナ・経理・管理部の「済」プルダウン（日報・日計表とも）、弁当行は5行、おまかせ等に項目・数量・備考、日報の下に日計表
