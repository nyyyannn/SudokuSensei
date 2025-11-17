import React, { useEffect } from 'react';

export default function Confetti() {
  useEffect(() => {
    const colors = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'];
    const confettiCount = 150;
    const confetti = [];

    for (let i = 0; i < confettiCount; i++) {
      const confetto = document.createElement('div');
      confetto.style.position = 'fixed';
      confetto.style.left = Math.random() * 100 + '%';
      confetto.style.top = '-10px';
      confetto.style.width = Math.random() * 10 + 5 + 'px';
      confetto.style.height = Math.random() * 10 + 5 + 'px';
      confetto.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetto.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
      confetto.style.opacity = Math.random();
      confetto.style.zIndex = '9999';
      confetto.style.pointerEvents = 'none';
      
      const rotation = Math.random() * 360;
      const x = (Math.random() - 0.5) * 200;
      const y = Math.random() * 200 + 200;
      
      confetto.style.transform = `rotate(${rotation}deg)`;
      confetto.style.transition = `transform ${Math.random() * 2 + 2}s linear, opacity ${Math.random() * 2 + 2}s linear`;
      
      document.body.appendChild(confetto);
      confetti.push(confetto);
      
      setTimeout(() => {
        confetto.style.transform = `translate(${x}px, ${y}px) rotate(${rotation + 720}deg)`;
        confetto.style.opacity = '0';
      }, 10);
    }

    const cleanup = () => {
      confetti.forEach(confetto => {
        if (confetto.parentNode) {
          confetto.parentNode.removeChild(confetto);
        }
      });
    };

    setTimeout(cleanup, 5000);
    return cleanup;
  }, []);

  return null;
}

