import React from 'react';

export default function SudokuBoard({ puzzle, board, onCellSelect, selectedCell, onCellInput }) {
  return (
    <table className="mx-auto border-4 border-gray-800 border-collapse">
      <tbody>
        {board.map((row, r) => (
          <tr key={r}>
            {row.map((num, c) => {
              const isSelected = selectedCell?.row === r && selectedCell?.col === c;
              const isOriginal = puzzle[r][c] !== 0;

              // Determine border classes for 3x3 boxes
              let borderClasses = 'border border-gray-300';
              if (r % 3 === 0) borderClasses += ' border-t-4 border-t-gray-800';
              if (r === 8) borderClasses += ' border-b-4 border-b-gray-800';
              if (c % 3 === 0) borderClasses += ' border-l-4 border-l-gray-800';
              if (c === 8) borderClasses += ' border-r-4 border-r-gray-800';

              return (
                <td
                  key={c}
                  onClick={() => onCellSelect(r, c)}
                  className={`relative w-10 h-10 p-0 ${borderClasses} ${
                    isOriginal ? 'bg-gray-200 font-bold' : 'bg-white'
                  } ${isSelected ? 'z-10 after:content-[""] after:absolute after:inset-0 after:rounded-sm after:shadow-[0_0_0_3px_rgba(59,130,246,0.8),0_0_10px_rgba(59,130,246,0.6)]' : ''}`}
                >
                  {isOriginal ? (
                    <div className="w-full h-full flex items-center justify-center">
                      {num}
                    </div>
                  ) : (
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={num === 0 ? '' : num}
                      onClick={(e) => {
                        onCellSelect(r, c);
                        e.target.select();
                      }}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^[1-9]$/.test(value)) {
                          onCellInput(r, c, parseInt(value));
                          e.target.blur(); // still remove blinking cursor
                        }
                      }}
                      className="w-full h-full text-center text-blue-600 bg-transparent outline-none caret-transparent"
                    />
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
