import React, { useEffect, useState } from 'react';

export default function Timer({ isActive, resetSignal, elapsedTime = 0 }) {
  const [seconds, setSeconds] = useState(elapsedTime);

  // Reset seconds whenever resetSignal changes, but preserve elapsed time
  useEffect(() => {
    if (resetSignal && elapsedTime === 0) {
      setSeconds(0);
    } else if (elapsedTime > 0) {
      setSeconds(elapsedTime);
    }
  }, [resetSignal, elapsedTime]);

  // Run the timer only when active
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

  return <div className="text-xl font-semibold text-white">Time: {format(seconds)}</div>;
}
