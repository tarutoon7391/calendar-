import { useState } from 'react';
import Home from './components/Home';
import Calendar from './components/Calendar';

const STORAGE_KEY = 'calendar:room';

// 前回参加したルームを localStorage から復元する
function loadSavedRoom() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [room, setRoom] = useState(loadSavedRoom);

  const handleEnter = (newRoom) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRoom));
    setRoom(newRoom);
  };

  const handleLeave = () => {
    localStorage.removeItem(STORAGE_KEY);
    setRoom(null);
  };

  return room ? (
    <Calendar room={room} onLeave={handleLeave} />
  ) : (
    <Home onEnter={handleEnter} />
  );
}
