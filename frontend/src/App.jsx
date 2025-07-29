import React, { useState, useEffect } from 'react';
import SudokuBoard from './components/SudokuBoard';
import NumberPad from './components/NumberPad';
import Timer from './components/Timer';

function App() {
  const [puzzle, setPuzzle] = useState([]);        
  const [userBoard, setUserBoard] = useState([]);  
  const [solution, setSolution] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);

  const [isGameActive, setIsGameActive] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [isPuzzleSolved, setIsPuzzleSolved] = useState(false);

  const [waitingToStart, setWaitingToStart] = useState(false); // ✅ New state for paused next puzzle

  const fetchPuzzle = async (autoStart = true) => {
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
      setUserBoard(data.puzzle.map(row => [...row])); 
      setSolution(data.solution);
      setSelectedCell(null);
      setIsPuzzleSolved(false);

      // ✅ Timer shows 00:00 on new puzzle
      setStartTime(Date.now());

      if (autoStart) {
        setIsGameActive(true);
        setWaitingToStart(false);
      } else {
        setIsGameActive(false);
        setWaitingToStart(true); // Timer shows 00:00 but stopped
      }
    } catch (err) {
      console.error("Fetch error:", err.message);
    }
  };

  const startPuzzleNow = () => {
    setStartTime(Date.now()); // ✅ Reset timer start
    setIsGameActive(true);
    setWaitingToStart(false);
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
      });

      const data = await res.json();
      alert(`✅ Correct! New skill score: ${data.new_skill_score.toFixed(2)}`);
      setIsGameActive(false); // ✅ Stop timer
      setIsPuzzleSolved(true); // ✅ Enable "Next Puzzle"
    } else {
      alert('❌ Incorrect. Keep trying.');
    }
  };

  // Handle keyboard input
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

  const handleNextPuzzle = () => {
    // ✅ Ask user if they want to start immediately
    const startNow = window.confirm("Do you want to start the next puzzle now?");
    fetchPuzzle(startNow);
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-4">🧠 Sudoku Sensei</h1>

      <div className="flex justify-between items-center mb-4">
        {!isGameActive && !waitingToStart && !isPuzzleSolved && (
          <button
            onClick={() => fetchPuzzle(true)}
            className="px-4 py-2 rounded bg-blue-600 text-white"
          >
            Start Game
          </button>
        )}

        <button
          onClick={checkSolution}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Check
        </button>

        {isPuzzleSolved && (
          <button
            onClick={handleNextPuzzle}
            className="bg-purple-600 text-white px-4 py-2 rounded"
          >
            Next Puzzle
          </button>
        )}

        {waitingToStart && (
          <button
            onClick={startPuzzleNow}
            className="bg-orange-500 text-white px-4 py-2 rounded"
          >
            Start Puzzle
          </button>
        )}
      </div>

      <SudokuBoard
        puzzle={puzzle}
        board={userBoard}
        selectedCell={selectedCell}
        onCellSelect={handleCellSelect}
      />
      <NumberPad onNumberSelect={handleNumberInput} />

      <Timer isActive={isGameActive} resetSignal={startTime} />
    </div>
  );
}

export default App;
