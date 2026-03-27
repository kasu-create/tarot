# Cloudflare Workers デプロイ手順

## Step 1: Cloudflare Dashboardにログイン
1. https://dash.cloudflare.com にアクセス
2. ログイン

## Step 2: Workerを作成
1. 左メニューの「**Workers & Pages**」をクリック
2. 「**Create**」ボタンをクリック
3. 「**Create Worker**」を選択
4. 名前を入力: `tarot-api`
5. 「**Deploy**」をクリック

## Step 3: コードを貼り付け
1. 作成したWorkerの「**Edit code**」をクリック
2. 既存のコードを全て削除
3. 以下のファイルの内容をコピペ:
   - `workers/tarot-api.js`
4. 右上の「**Deploy**」をクリック

## Step 4: 環境変数（APIキー）を設定
1. Workerの「**Settings**」タブをクリック
2. 「**Variables and Secrets**」を探す
3. 「**Add**」をクリック
4. 以下を入力:
   - Variable name: `OPENAI_API_KEY`
   - Value: あなたのOpenAI APIキー（sk-proj-...）
5. 「**Encrypt**」にチェック（推奨）
6. 「**Deploy**」をクリック

## Step 5: URLを確認
- Workerの概要ページでURLを確認
- 例: `https://tarot-api.あなたのサブドメイン.workers.dev`

## Step 6: テスト
PowerShellで以下を実行してテスト:

```powershell
$body = @{
    theme = "片想い"
    relation = "友人"
    concern = "告白のタイミングがわかりません"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://tarot-api.あなたのサブドメイン.workers.dev" -Method POST -Body $body -ContentType "application/json"
```

成功すれば、GPTが生成した鑑定結果が返ってきます。
