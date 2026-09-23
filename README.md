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
