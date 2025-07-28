import React, { useEffect, useState } from 'react';

export default function Timer({ isActive }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  const format = (s) => {
    const m = String(Math.floor(s / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${m}:${sec}`;
  };

  return <div className="text-center mt-4 text-lg font-mono">Time: {format(seconds)}</div>;
}
