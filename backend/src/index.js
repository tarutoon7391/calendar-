require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const db = require('./db');
const roomsRouter = require('./routes/rooms');

const app = express();
const server = http.createServer(app);

// 開発中はオリジンを制限しない。本番では FRONTEND_URL に絞るのが望ましい
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || '*' },
});

app.use(cors());
app.use(express.json());

// ルーターから io を参照できるようにする
app.set('io', io);

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/rooms', roomsRouter);

// 共通エラーハンドラ
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'サーバーエラーが発生しました' });
});

io.on('connection', (socket) => {
  // ルームコード単位のチャンネルに参加・退出する
  socket.on('room:join', (code) => {
    socket.join(String(code));
  });
  socket.on('room:leave', (code) => {
    socket.leave(String(code));
  });
});

const PORT = process.env.PORT || 3001;

db.init()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`サーバー起動: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('DB の初期化に失敗しました:', err);
    process.exit(1);
  });
