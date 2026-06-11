import { useState } from 'react';
import { createRoom, getRoom } from '../api';

// ルーム作成・参加画面
export default function Home({ onEnter }) {
  const [roomName, setRoomName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleCreate = async () => {
    setBusy(true);
    setError('');
    try {
      const room = await createRoom(roomName);
      onEnter(room);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('6桁のコードを入力してね');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const room = await getRoom(code);
      onEnter(room);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="home">
      <h1 className="home-title">📅 みんなのカレンダー</h1>
      <p className="home-subtitle">スタンプとメモで予定をシェアしよう</p>

      <section className="card">
        <h2>ルームを作る</h2>
        <input
          type="text"
          placeholder="ルーム名（省略OK）"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          maxLength={30}
        />
        <button className="btn primary" onClick={handleCreate} disabled={busy}>
          新しいルームを作成
        </button>
      </section>

      <section className="card">
        <h2>ルームに入る</h2>
        <form onSubmit={handleJoin}>
          <input
            type="text"
            inputMode="numeric"
            placeholder="6桁コード"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="code-input"
          />
          <button className="btn" type="submit" disabled={busy}>
            参加する
          </button>
        </form>
      </section>

      {error && <p className="error">{error}</p>}
    </div>
  );
}
