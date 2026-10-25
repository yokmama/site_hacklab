# よりみち

マイクラAIコースの第2章「マイクラのAIワールドで学ぶ」（5〜8か月）の中で取り組む「よりみち」教材のページ群。

時期の書き方を変えるときは、`index.html`（ステップ図の「＋よりみち」、分岐の見出し、第2章の説明、よりみちセクション）、`yorimichi/index.html`、各ページの「どのコースで受けられますか？」をまとめて直す（`grep -rn "第2章" docs/` で探せる）。

## ファイル構成

| 場所 | 役割 |
|---|---|
| `data/yorimichi.json` | よりみちの一覧。トップページと `yorimichi/index.html` はここから表示する |
| `js/yorimichi.js` | 一覧をカード（`card`）または小さな一覧（`chip`）として描画する |
| `css/yorimichi.css` | よりみちページ共通の部品（ヒーロー、カリキュラム表、道筋、Q&A など） |
| `css/yorimichi/<id>.css` | そのページのテーマ色と、ページだけの部品 |
| `js/yorimichi/<id>.js` | そのページだけの体験ウィジェット（なくてもよい） |
| `images/yorimichi/<id>/` | そのページの画像 |
| `yorimichi/<id>.html` | ページ本体 |
| `yorimichi/_template.html` | 新しいページの雛形（`_` で始まるので GitHub Pages では公開されない） |

いまある id: `redstone`（半導体を学ぼう）、`edm`（EDMを学ぼう）

## 新しいよりみちを足す手順

1. id を決める（英小文字。URL とファイル名になる。例: `robot`）
2. `yorimichi/_template.html` を `yorimichi/<id>.html` にコピーし、`xxx` を id に、`◯◯` を中身に書きかえる
3. `css/yorimichi/<id>.css` を作り、テーマ色を書く（`css/yorimichi/edm.css` の先頭が見本）

   ```css
   .theme-<id> {
     --ym-bg: #...;          /* 地の色 */
     --ym-bg-2: #...;        /* 交互のセクションの地 */
     --ym-line: #...;        /* 枠線・マス目 */
     --ym-accent: #...;      /* 差し色（見出しの線、番号、ボタン） */
     --ym-accent-glow: #...;
     --ym-accent-soft: #...; /* 差し色の薄い版（CTA の背景など） */
     --ym-chip: #...;        /* 小さな箱の地 */
   }
   ```

4. 画像を `images/yorimichi/<id>/` に置く（Web 用に幅 1400px 程度へ縮小）
5. `data/yorimichi.json` の `items` に1件足す

   ```json
   {
     "id": "<id>",
     "status": "open",
     "title": "◯◯を学ぼう",
     "name": "教材名",
     "tool": "使う道具（例: Minecraft レッドストーン）",
     "catch": "ひとことのキャッチ",
     "summary": "カードに出す説明（2文くらい）",
     "tags": ["タグ1", "タグ2"],
     "url": "yorimichi/<id>.html",
     "image": "images/yorimichi/<id>/web_main.jpg",
     "imageAlt": "画像の説明",
     "accent": "#カードの差し色（テーマの --ym-accent と同じ）"
   }
   ```

   パスはすべて `docs/` からの相対パスで書く。`status` を `"coming"` にすると、リンクなしの「準備中」として表示される。

6. `yorimichi/index.html` の「JS が使えないときの表示」にも1行足す

トップページ（`index.html`）は触らなくてよい。JSON に足せば、マイクラAIコースのカードとよりみちセクションの両方に自動で出る。

## 確認

ローカルで `docs/` を配信して確認する（`file://` では JSON が読めない）。

```sh
cd docs && python3 -m http.server 8000
# http://localhost:8000/ と http://localhost:8000/yorimichi/
```
