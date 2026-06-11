import { useCallback, useEffect, useMemo, useState } from 'react';
import { getStamps } from '../api';
import { socket } from '../socket';
import DayModal from './DayModal';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

// 'YYYY-MM-DD' 形式に整形する
function toDateKey(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// カレンダーのマス目（前後の空白含む）を組み立てる
function buildGrid(year, month) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

// 月表示カレンダー画面
export default function Calendar({ room, onLeave }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1〜12
  const [stamps, setStamps] = useState([]);
  // 最後にタップした日付（モーダルを閉じても緑ハイライトとして残す）
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // 表示中の月のスタンプを取得する
  const reload = useCallback(async () => {
    try {
      setStamps(await getStamps(room.code, year, month));
    } catch (err) {
      console.error(err);
    }
  }, [room.code, year, month]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Socket.io でリアルタイム同期する
  useEffect(() => {
    socket.emit('room:join', room.code);

    const handleAdded = (stamp) => {
      // 表示中の月のスタンプだけ反映する（重複は除外）
      if (stamp.date.startsWith(`${year}-${String(month).padStart(2, '0')}`)) {
        setStamps((prev) =>
          prev.some((s) => s.id === stamp.id) ? prev : [...prev, stamp]
        );
      }
    };
    const handleDeleted = ({ id }) => {
      setStamps((prev) => prev.filter((s) => s.id !== id));
    };
    const handleUpdated = (stamp) => {
      setStamps((prev) => prev.map((s) => (s.id === stamp.id ? stamp : s)));
    };

    socket.on('stamp:added', handleAdded);
    socket.on('stamp:deleted', handleDeleted);
    socket.on('stamp:updated', handleUpdated);
    // 再接続時にルームへ入り直す
    const handleReconnect = () => {
      socket.emit('room:join', room.code);
      reload();
    };
    socket.on('connect', handleReconnect);

    return () => {
      socket.emit('room:leave', room.code);
      socket.off('stamp:added', handleAdded);
      socket.off('stamp:deleted', handleDeleted);
      socket.off('stamp:updated', handleUpdated);
      socket.off('connect', handleReconnect);
    };
  }, [room.code, year, month, reload]);

  // 日付ごとにスタンプをまとめる
  const stampsByDate = useMemo(() => {
    const map = {};
    for (const s of stamps) {
      (map[s.date] = map[s.date] || []).push(s);
    }
    return map;
  }, [stamps]);

  const moveMonth = (diff) => {
    const d = new Date(year, month - 1 + diff, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  };

  const cells = buildGrid(year, month);
  const todayKey = toDateKey(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate()
  );

  return (
    <div className="calendar-page">
      <header className="room-header">
        <div className="room-info">
          <span className="room-name">{room.name || 'ルーム'}</span>
          <span className="room-code">コード: {room.code}</span>
        </div>
        <button className="btn small" onClick={onLeave}>
          退出
        </button>
      </header>

      <div className="month-nav">
        <button className="btn nav" onClick={() => moveMonth(-1)} aria-label="前の月">
          ◀
        </button>
        <h2 className="month-title">
          {year}年{month}月
        </h2>
        <button className="btn nav" onClick={() => moveMonth(1)} aria-label="次の月">
          ▶
        </button>
      </div>

      <div className="weekday-row">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`weekday ${i === 0 ? 'sun' : ''} ${i === 6 ? 'sat' : ''}`}
          >
            {w}
          </div>
        ))}
      </div>

      <div className="calendar-grid">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="day-cell empty" />;
          }
          const dateKey = toDateKey(year, month, day);
          const dayStamps = stampsByDate[dateKey] || [];
          return (
            <button
              key={dateKey}
              className={`day-cell ${dateKey === todayKey ? 'today' : ''} ${
                dateKey === selectedDate ? 'selected' : ''
              }`}
              onClick={() => {
                setSelectedDate(dateKey);
                setModalOpen(true);
              }}
            >
              <span className="day-number">{day}</span>
              <span className="day-stamps">
                {dayStamps.slice(0, 4).map((s) => (
                  <span key={s.id}>{s.emoji}</span>
                ))}
                {dayStamps.length > 4 && (
                  <span className="more">+{dayStamps.length - 4}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {modalOpen && selectedDate && (
        <DayModal
          room={room}
          date={selectedDate}
          stamps={stampsByDate[selectedDate] || []}
          onClose={() => setModalOpen(false)}
          onChanged={reload}
        />
      )}
    </div>
  );
}
