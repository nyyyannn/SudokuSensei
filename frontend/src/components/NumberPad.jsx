import React from 'react';

export default function NumberPad({ onNumberSelect }) {
  return (
    <div className="flex gap-2 justify-center mt-4">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
        <button
          key={num}
          onClick={() => onNumberSelect(num)}
          className="bg-white border px-4 py-2 rounded hover:bg-blue-100"
        >
          {num}
        </button>
      ))}
    </div>
  );
}
