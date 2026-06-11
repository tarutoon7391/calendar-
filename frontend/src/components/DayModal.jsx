import { useEffect, useRef, useState } from 'react';
import { addStamp, deleteStamp, updateStamp } from '../api';

// 選べる絵文字の一覧
const EMOJIS = ['😀', '🎉', '❤️', '⭐', '✅', '💪', '🍺', '🍴', '🎂', '😴', '🏃', '📌'];

// 日付タップで開くスタンプ・メモの編集モーダル
export default function DayModal({ room, date, stamps, onClose, onChanged }) {
  // 新規追加用
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [memo, setMemo] = useState('');
  // 編集用（editingId が編集中のスタンプID、editFull が true なら絵文字も変更できる）
  const [editingId, setEditingId] = useState(null);
  const [editFull, setEditFull] = useState(false);
  const [editEmoji, setEditEmoji] = useState('');
  const [editMemo, setEditMemo] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const editInputRef = useRef(null);

  // 編集を始めたらメモ入力に自動でフォーカスする
  useEffect(() => {
    if (editingId !== null && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

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

  // full: 編集ボタン経由なら true（絵文字ピッカーも表示する）
  const startEdit = (stamp, full) => {
    setEditingId(stamp.id);
    setEditFull(full);
    setEditEmoji(stamp.emoji);
    setEditMemo(stamp.memo);
    setError('');
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async () => {
    if (editingId === null) return;
    setBusy(true);
    setError('');
    try {
      await updateStamp(room.code, editingId, { emoji: editEmoji, memo: editMemo });
      setEditingId(null);
      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  // Enter で保存、Escape でキャンセル
  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
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
          {stamps.map((s) =>
            editingId === s.id ? (
              editFull ? (
                // 編集ボタン経由：絵文字＋メモをまとめて編集
                <li key={s.id} className="stamp-item editing">
                  <div className="stamp-edit-full">
                    <div className="emoji-picker">
                      {EMOJIS.map((e2) => (
                        <button
                          type="button"
                          key={e2}
                          className={`emoji-btn ${e2 === editEmoji ? 'selected' : ''}`}
                          onClick={() => setEditEmoji(e2)}
                        >
                          {e2}
                        </button>
                      ))}
                    </div>
                    <input
                      ref={editInputRef}
                      type="text"
                      placeholder="メモ（省略OK）"
                      value={editMemo}
                      onChange={(e3) => setEditMemo(e3.target.value)}
                      onKeyDown={handleEditKeyDown}
                      maxLength={100}
                    />
                    <div className="edit-actions">
                      <button className="btn primary" onClick={saveEdit} disabled={busy}>
                        保存
                      </button>
                      <button className="btn" onClick={cancelEdit} disabled={busy}>
                        キャンセル
                      </button>
                    </div>
                  </div>
                </li>
              ) : (
                // メモ直接タップ：その場でメモだけ書き換え（フォーカスが外れたら保存）
                <li key={s.id} className="stamp-item">
                  <span className="stamp-emoji">{s.emoji}</span>
                  <input
                    ref={editInputRef}
                    className="inline-edit"
                    type="text"
                    placeholder="メモを入力"
                    value={editMemo}
                    onChange={(e3) => setEditMemo(e3.target.value)}
                    onKeyDown={handleEditKeyDown}
                    onBlur={saveEdit}
                    maxLength={100}
                  />
                </li>
              )
            ) : (
              <li key={s.id} className="stamp-item">
                <span className="stamp-emoji">{s.emoji}</span>
                {/* メモ部分をタップするとその場で編集できる */}
                <button
                  type="button"
                  className="stamp-memo"
                  onClick={() => startEdit(s, false)}
                >
                  {s.memo || <span className="memo-placeholder">メモを追加…</span>}
                </button>
                <button
                  className="btn small"
                  onClick={() => startEdit(s, true)}
                  disabled={busy}
                >
                  編集
                </button>
                <button
                  className="btn danger small"
                  onClick={() => handleDelete(s.id)}
                  disabled={busy}
                  aria-label="削除"
                >
                  削除
                </button>
              </li>
            )
          )}
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
