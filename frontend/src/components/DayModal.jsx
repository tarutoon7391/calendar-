import { useState } from 'react';
import { addStamp, deleteStamp } from '../api';

// 選べる絵文字の一覧
const EMOJIS = ['😀', '🎉', '❤️', '⭐', '✅', '💪', '🍺', '🍴', '🎂', '😴', '🏃', '📌'];

// 日付タップで開くスタンプ・メモの編集モーダル
export default function DayModal({ room, date, stamps, onClose, onChanged }) {
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [memo, setMemo] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [y, m, d] = date.split('-').map(Number);
  const title = `${y}年${m}月${d}日`;

  const handleAdd = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await addStamp(room.code, { date, emoji, memo });
      setMemo('');
      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id) => {
    setBusy(true);
    setError('');
    try {
      await deleteStamp(room.code, id);
      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* 中身をタップしても閉じないようにする */}
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn small" onClick={onClose}>
            閉じる
          </button>
        </div>

        <ul className="stamp-list">
          {stamps.length === 0 && (
            <li className="stamp-empty">まだスタンプがないよ</li>
          )}
          {stamps.map((s) => (
            <li key={s.id} className="stamp-item">
              <span className="stamp-emoji">{s.emoji}</span>
              <span className="stamp-memo">{s.memo}</span>
              <button
                className="btn danger small"
                onClick={() => handleDelete(s.id)}
                disabled={busy}
                aria-label="削除"
              >
                削除
              </button>
            </li>
          ))}
        </ul>

        <form className="stamp-form" onSubmit={handleAdd}>
          <div className="emoji-picker">
            {EMOJIS.map((e2) => (
              <button
                type="button"
                key={e2}
                className={`emoji-btn ${e2 === emoji ? 'selected' : ''}`}
                onClick={() => setEmoji(e2)}
              >
                {e2}
              </button>
            ))}
          </div>
          <div className="memo-row">
            <input
              type="text"
              placeholder="メモ（省略OK）"
              value={memo}
              onChange={(e3) => setMemo(e3.target.value)}
              maxLength={100}
            />
            <button className="btn primary" type="submit" disabled={busy}>
              追加
            </button>
          </div>
        </form>

        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
