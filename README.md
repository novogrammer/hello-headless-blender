# Hello Headless Blender

このリポジトリは、Blender をサーバーサイドで実行して画像をレンダリングするサンプルプロジェクトです。Next.js 製のフロントエンドと Express 製の API サーバー、BullMQ を利用したジョブキュー、MinIO によるオブジェクトストレージを組み合わせています。

## 必要環境

- Docker / Docker Compose
- Blender を含む Docker イメージは既に構成済みです

## 起動方法

1. `.env` ファイルを用意して MinIO の環境変数を設定します。

```env
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
```

2. Docker Compose でサービスを起動します。

```bash
docker compose up -d
```

起動後、以下のポートで各サービスにアクセスできます。

- Next.js: http://localhost:3000
- Backend API: http://localhost:4000
- MinIO Console: http://localhost:9001

## 使用方法

1. ブラウザで `http://localhost:3000` を開き、画像と名前を送信するとジョブが作成されます。
2. ジョブページではレンダリングの進行状況が表示され、完了すると結果画像が表示されます。
3. ジョブの管理画面（Bull Board）は `http://localhost:4000/admin/queues` で確認できます。

## ディレクトリ構成

- `backend` – Express サーバーとワーカーのコード
- `next-app` – Next.js フロントエンド
- `minio` – オブジェクトストレージ用のデータディレクトリ
- `redis` – キュー用 Redis のデータディレクトリ
- `compose.yaml` – Docker Compose 設定

## ライセンス

MIT License
