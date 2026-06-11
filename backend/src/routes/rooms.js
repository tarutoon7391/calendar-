const express = require('express');
const { pool } = require('../db');

const router = express.Router();

// 6桁の数字コードを生成する
function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ルームコードからルームを取得する共通処理
async function findRoomByCode(code) {
  const { rows } = await pool.query(
    'SELECT id, code, name FROM rooms WHERE code = $1',
    [code]
  );
  return rows[0] || null;
}

// ルーム作成
router.post('/', async (req, res, next) => {
  try {
    const name = (req.body && req.body.name ? String(req.body.name) : '').trim();

    // コード重複時はリトライする（最大10回）
    for (let i = 0; i < 10; i++) {
      const code = generateCode();
      try {
        const { rows } = await pool.query(
          'INSERT INTO rooms (code, name) VALUES ($1, $2) RETURNING id, code, name',
          [code, name]
        );
        return res.status(201).json(rows[0]);
      } catch (err) {
        // 23505 = UNIQUE 制約違反。コードが被ったら作り直す
        if (err.code !== '23505') throw err;
      }
    }
    res.status(500).json({ error: 'ルームコードの生成に失敗しました' });
  } catch (err) {
    next(err);
  }
});

// ルーム参加（コードの存在確認）
router.get('/:code', async (req, res, next) => {
  try {
    const room = await findRoomByCode(req.params.code);
    if (!room) return res.status(404).json({ error: 'ルームが見つかりません' });
    res.json(room);
  } catch (err) {
    next(err);
  }
});

// 指定月のスタンプ一覧を取得（?year=2026&month=6）
router.get('/:code/stamps', async (req, res, next) => {
  try {
    const room = await findRoomByCode(req.params.code);
    if (!room) return res.status(404).json({ error: 'ルームが見つかりません' });

    const year = Number(req.query.year);
    const month = Number(req.query.month);
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      return res.status(400).json({ error: 'year と month を正しく指定してください' });
    }

    // 月初〜翌月初の範囲で絞り込む。date は文字列 (YYYY-MM-DD) で返す
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const { rows } = await pool.query(
      `SELECT id, date::text AS date, emoji, memo
         FROM stamps
        WHERE room_id = $1
          AND date >= $2::date
          AND date < ($2::date + INTERVAL '1 month')
        ORDER BY date, id`,
      [room.id, start]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// スタンプ追加
router.post('/:code/stamps', async (req, res, next) => {
  try {
    const room = await findRoomByCode(req.params.code);
    if (!room) return res.status(404).json({ error: 'ルームが見つかりません' });

    const { date, emoji } = req.body || {};
    const memo = (req.body && req.body.memo ? String(req.body.memo) : '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date)) || !emoji) {
      return res.status(400).json({ error: 'date (YYYY-MM-DD) と emoji は必須です' });
    }

    const { rows } = await pool.query(
      `INSERT INTO stamps (room_id, date, emoji, memo)
       VALUES ($1, $2, $3, $4)
       RETURNING id, date::text AS date, emoji, memo`,
      [room.id, date, String(emoji), memo]
    );
    const stamp = rows[0];

    // 同じルームの全員にリアルタイム通知
    req.app.get('io').to(room.code).emit('stamp:added', stamp);
    res.status(201).json(stamp);
  } catch (err) {
    next(err);
  }
});

// スタンプ更新（絵文字・メモの一方だけでも更新できる）
router.patch('/:code/stamps/:id', async (req, res, next) => {
  try {
    const room = await findRoomByCode(req.params.code);
    if (!room) return res.status(404).json({ error: 'ルームが見つかりません' });

    const { emoji, memo } = req.body || {};
    if (emoji === undefined && memo === undefined) {
      return res.status(400).json({ error: 'emoji か memo を指定してください' });
    }

    const id = Number(req.params.id);
    const { rows } = await pool.query(
      `UPDATE stamps
          SET emoji = COALESCE($3, emoji),
              memo  = COALESCE($4, memo)
        WHERE id = $1 AND room_id = $2
        RETURNING id, date::text AS date, emoji, memo`,
      [id, room.id, emoji !== undefined ? String(emoji) : null, memo !== undefined ? String(memo).trim() : null]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'スタンプが見つかりません' });
    }

    // 同じルームの全員にリアルタイム通知
    req.app.get('io').to(room.code).emit('stamp:updated', rows[0]);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// スタンプ削除
router.delete('/:code/stamps/:id', async (req, res, next) => {
  try {
    const room = await findRoomByCode(req.params.code);
    if (!room) return res.status(404).json({ error: 'ルームが見つかりません' });

    const id = Number(req.params.id);
    const { rows } = await pool.query(
      `DELETE FROM stamps
        WHERE id = $1 AND room_id = $2
        RETURNING id, date::text AS date`,
      [id, room.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'スタンプが見つかりません' });
    }

    // 同じルームの全員にリアルタイム通知
    req.app.get('io').to(room.code).emit('stamp:deleted', rows[0]);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
