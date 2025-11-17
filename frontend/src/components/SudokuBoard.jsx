import React from 'react';

export default function SudokuBoard({ puzzle, board, onCellSelect, selectedCell, onCellInput }) {
  const highlightNumber =
    selectedCell && board[selectedCell.row][selectedCell.col] !== 0
      ? board[selectedCell.row][selectedCell.col]
      : null;

  return (
    <table className="mx-auto border-4 border-gray-800 border-collapse">
      <tbody>
        {board.map((row, r) => (
          <tr key={r}>
            {row.map((num, c) => {
              const isSelected = selectedCell?.row === r && selectedCell?.col === c;
              const isOriginal = puzzle[r][c] !== 0;
              const isHighlighted = highlightNumber && num === highlightNumber && !isSelected;

              // Border classes
              let borderClasses = 'border border-gray-300';
              if (r % 3 === 0) borderClasses += ' border-t-4 border-t-gray-800';
              if (r === 8) borderClasses += ' border-b-4 border-b-gray-800';
              if (c % 3 === 0) borderClasses += ' border-l-4 border-l-gray-800';
              if (c === 8) borderClasses += ' border-r-4 border-r-gray-800';

              // Highlight class with perfect alignment (no overspill)
              const highlightClass =
                isSelected || isHighlighted
                  ? 'z-10 after:content-[""] after:absolute after:inset-0 after:rounded-sm after:shadow-[0_0_0_3px_rgba(34,197,94,0.8),0_0_10px_rgba(34,197,94,0.6)]'
                  : '';

              return (
                <td
                  key={c}
                  onClick={() => onCellSelect(r, c)}
                  className={`relative w-12 h-12 p-0 ${borderClasses} ${
                    isOriginal ? 'bg-gray-200 font-bold' : 'bg-white'
                  } ${highlightClass}`}
                >
                  {isOriginal ? (
                    <div className="w-full h-full flex items-center justify-center text-lg font-bold">{num}</div>
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
                          e.target.blur(); // no blinking cursor
                        }
                      }}
                      className="w-full h-full text-center text-green-500 bg-transparent outline-none caret-transparent text-lg font-semibold"
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
