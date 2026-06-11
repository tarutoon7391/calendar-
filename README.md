# みんなのカレンダー 📅

6桁のルームコードで集まって、カレンダーに絵文字スタンプとメモを貼り合える共有カレンダーアプリです。
Socket.io によるリアルタイム同期に対応しており、同じルームにいる人の画面に即時反映されます。

## 機能

- **ルーム作成・参加**: 6桁の数字コードでルームを作成・参加
- **月表示カレンダー**: 前月・翌月への移動に対応
- **スタンプ＋メモ**: 日付をタップして絵文字スタンプとメモを追加・削除（個数無制限）
- **リアルタイム同期**: Socket.io で同じルームのメンバーに即時反映
- **スマホファーストUI**: スマートフォンでの操作を前提としたデザイン

## 技術スタック

| 区分 | 技術 |
| --- | --- |
| フロントエンド | Vite + React |
| バックエンド | Node.js + Express + Socket.io |
| データベース | PostgreSQL（Railway 接続想定） |

## ディレクトリ構成

```
.
├── frontend/   # Vite + React のフロントエンド
│   └── src/
│       ├── components/   # Home / Calendar / DayModal
│       ├── api.js        # バックエンド API ラッパー
│       └── socket.js     # Socket.io クライアント
└── backend/    # Express + Socket.io のバックエンド
    └── src/
        ├── index.js      # サーバー本体
        ├── db.js         # DB 接続・テーブル初期化
        └── routes/
            └── rooms.js  # ルーム・スタンプ API
```

## セットアップ

### 1. バックエンド

```bash
cd backend
npm install
cp .env.example .env   # DATABASE_URL を自分の環境に合わせて編集
npm run dev
```

`.env` の設定項目:

| 変数 | 説明 |
| --- | --- |
| `DATABASE_URL` | PostgreSQL の接続URL（Railway の `DATABASE_URL` をそのまま使えます） |
| `DATABASE_SSL` | Railway など SSL 必須の環境では `true` |
| `PORT` | サーバーのポート番号（デフォルト 3001） |

テーブルはサーバー起動時に自動作成されます（`rooms` / `stamps`）。

### 2. フロントエンド

```bash
cd frontend
npm install
cp .env.example .env   # 必要なら VITE_API_URL を変更
npm run dev
```

ブラウザで `http://localhost:5173` を開いてください。

## API 一覧

| メソッド | パス | 説明 |
| --- | --- | --- |
| `POST` | `/api/rooms` | ルーム作成（6桁コードを発行） |
| `GET` | `/api/rooms/:code` | ルーム取得（参加時のコード確認） |
| `GET` | `/api/rooms/:code/stamps?year=&month=` | 指定月のスタンプ一覧 |
| `POST` | `/api/rooms/:code/stamps` | スタンプ追加 |
| `DELETE` | `/api/rooms/:code/stamps/:id` | スタンプ削除 |

## Socket.io イベント

| イベント | 方向 | 説明 |
| --- | --- | --- |
| `room:join` / `room:leave` | クライアント → サーバー | ルームチャンネルへの参加・退出 |
| `stamp:added` | サーバー → クライアント | スタンプが追加された |
| `stamp:deleted` | サーバー → クライアント | スタンプが削除された |

## 今後の予定

- Railway へのデプロイ設定
- スタンプの種類追加・カスタマイズ
- 書いた人の名前表示
