import React, { useState, useEffect } from 'react';
import SudokuBoard from './components/SudokuBoard';
import NumberPad from './components/NumberPad';
import Timer from './components/Timer';

function App() {
  const [puzzle, setPuzzle] = useState([]);        // original, read-only
  const [userBoard, setUserBoard] = useState([]);  // editable version
  const [solution, setSolution] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [isGameActive, setIsGameActive] = useState(false);
  const [startTime, setStartTime] = useState(null);

  const fetchPuzzle = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/new-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!res.ok) throw new Error(`Failed to fetch. Status: ${res.status}`);
      const data = await res.json();
      if (!data.puzzle) throw new Error("Invalid puzzle data");

      setPuzzle(data.puzzle);
      setUserBoard(data.puzzle.map(row => [...row])); // deep copy
      setSolution(data.solution);
      setStartTime(Date.now());
      setIsGameActive(true);
      setSelectedCell(null);
    } catch (err) {
      console.error("Fetch error:", err.message);
    }
  };

  const isCellEditable = (row, col) => puzzle[row][col] === 0;

  const handleCellSelect = (r, c) => {
    if (!isCellEditable(r, c)) return;
    setSelectedCell({ row: r, col: c });
  };

  const handleNumberInput = (num) => {
    if (!selectedCell || !isGameActive) return;
    const { row, col } = selectedCell;
    if (!isCellEditable(row, col)) return;

    const updated = userBoard.map((r, i) =>
      r.map((val, j) => (i === row && j === col ? num : val))
    );
    setUserBoard(updated);
  };

  const checkSolution = async () => {
    const isCorrect = userBoard.flat().every((val, i) => val === solution.flat()[i]);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    if (isCorrect) {
      const res = await fetch('http://localhost:5000/api/submit-solution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ time_taken: timeTaken }),
        credentials: 'include',
      });

      const data = await res.json();
      alert(`✅ Correct! New skill score: ${data.new_skill_score.toFixed(2)}`);
      setIsGameActive(false);
    } else {
      alert('❌ Incorrect. Keep trying.');
    }
  };

  // ⌨️ Keyboard input handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedCell || !isGameActive) return;
      const { row, col } = selectedCell;
      if (!isCellEditable(row, col)) return;

      const key = e.key;

      if (key >= "1" && key <= "9") {
        handleNumberInput(parseInt(key));
      } else if (["Backspace", "Delete", "0"].includes(key)) {
        handleNumberInput(0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCell, isGameActive, userBoard]);

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-4">🧠 Sudoku Trainer</h1>
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={fetchPuzzle}
          disabled={isGameActive}
          className={`px-4 py-2 rounded ${isGameActive ? "bg-gray-400" : "bg-blue-600"} text-white`}
        >
          Start Game
        </button>
        <button
          onClick={checkSolution}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Check
        </button>
      </div>
      <SudokuBoard
        puzzle={puzzle}
        board={userBoard}
        selectedCell={selectedCell}
        onCellSelect={handleCellSelect}
      />
      <NumberPad onNumberSelect={handleNumberInput} />
      <Timer isActive={isGameActive} />
    </div>
  );
}

export default App;
