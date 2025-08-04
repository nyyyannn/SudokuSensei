import React, { useState, useEffect, useCallback } from 'react';
import SudokuBoard from './SudokuBoard';
import NumberPad from './NumberPad';
import Timer from './Timer';

function Game({ user, onLogout }) {
  const [puzzle, setPuzzle] = useState([]);
  const [userBoard, setUserBoard] = useState([]);
  const [solution, setSolution] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [isGameActive, setIsGameActive] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPuzzleSolved, setIsPuzzleSolved] = useState(false);
  const [waitingToStart, setWaitingToStart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [puzzleLoaded, setPuzzleLoaded] = useState(false);
  const [userStats, setUserStats] = useState({
    player_skill: user.player_skill || 20.0,
    puzzles_played: user.puzzles_played || 0,
    games_given_up: user.games_given_up || 0
  });

  // Auto-save game state
  const saveGame = useCallback(async () => {
    if (!puzzle.length || !userBoard.length) return;
    
    try {
      await fetch('http://localhost:5000/api/game/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          puzzle,
          user_board: userBoard,
          solution,
          start_time: startTime,
          is_game_active: isGameActive,
          elapsed_time: elapsedTime
        }),
      });
    } catch (err) {
      console.error('Failed to save game:', err);
    }
  }, [puzzle, userBoard, solution, startTime, isGameActive, elapsedTime]);

  // Load saved game
  const loadGame = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/game/load', {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.has_saved_game && data.game) {
        const game = data.game;
        setPuzzle(game.puzzle);
        setUserBoard(game.user_board);
        setSolution(game.solution);
        setStartTime(game.start_time);
        setIsGameActive(game.is_game_active);
        setElapsedTime(game.elapsed_time || 0);
        setIsPuzzleSolved(false);
        setWaitingToStart(!game.is_game_active);
        // Only show puzzle if game was active
        setPuzzleLoaded(game.is_game_active);
      } else {
        // No saved game, start fresh
        fetchPuzzle(true);
      }
    } catch (err) {
      console.error('Failed to load game:', err);
      fetchPuzzle(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Complete refresh prevention and state saving
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isGameActive && !isPuzzleSolved) {
        // Save state before leaving
        saveGame();
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    const handleKeyDown = (e) => {
      // Prevent F5, Ctrl+R, Ctrl+Shift+R
      if (isGameActive && !isPuzzleSolved) {
        if (e.key === 'F5' || 
            (e.ctrlKey && e.key === 'r') || 
            (e.ctrlKey && e.shiftKey && e.key === 'R')) {
          e.preventDefault();
          return false;
        }
      }
    };

    // Prevent right-click context menu
    const handleContextMenu = (e) => {
      if (isGameActive && !isPuzzleSolved) {
        e.preventDefault();
        return false;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isGameActive, isPuzzleSolved, saveGame]);

  // Auto-save when game state changes
  useEffect(() => {
    if (puzzle.length > 0 && userBoard.length > 0) {
      const saveTimeout = setTimeout(saveGame, 2000); // Changed from 1000 to 2000ms
      return () => clearTimeout(saveTimeout);
    }
  }, [puzzle, userBoard, solution, startTime, isGameActive, elapsedTime, saveGame]);

  // Load game on mount
  useEffect(() => {
    loadGame();
  }, [loadGame]);

  // Update elapsed time when game is active
  useEffect(() => {
    if (!isGameActive) return;
    
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isGameActive]);

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
      setStartTime(Date.now());
      setElapsedTime(0);
      // Only show puzzle if auto-starting
      setPuzzleLoaded(autoStart);

      if (autoStart) {
        setIsGameActive(true);
        setWaitingToStart(false);
      } else {
        setIsGameActive(false);
        setWaitingToStart(true);
      }
    } catch (err) {
      console.error("Fetch error:", err.message);
    }
  };

  const startPuzzleNow = () => {
    setStartTime(Date.now());
    setElapsedTime(0);
    setIsGameActive(true);
    setWaitingToStart(false);
    setPuzzleLoaded(true); // Show puzzle when starting
  };

  const handleGiveUp = async () => {
    if (!window.confirm('Are you sure you want to give up? This will be recorded.')) {
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/game/give-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(`Game given up. Total give-ups: ${data.games_given_up}`);
        setUserStats(prev => ({ 
          ...prev, 
          games_given_up: data.games_given_up,
          puzzles_played: data.puzzles_played
        }));
        setIsGameActive(false);
        setIsPuzzleSolved(false);
        setWaitingToStart(false);
        setElapsedTime(0);
        // Start a new puzzle
        fetchPuzzle(false);
      } else {
        alert('Failed to give up. Please try again.');
      }
    } catch (err) {
      console.error('Give up error:', err);
      alert('Failed to give up. Please try again.');
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
      });

      const data = await res.json();
      alert(`✅ Correct! New skill score: ${data.new_skill_score.toFixed(2)}`);
      setIsGameActive(false);
      setIsPuzzleSolved(true);
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
    const startNow = window.confirm("Do you want to start the next puzzle now?");
    fetchPuzzle(startNow);
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      onLogout();
    } catch (err) {
      console.error('Logout error:', err);
      onLogout();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">🧠 Sudoku Sensei</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            <div>Welcome, {user.name}!</div>
            <div className="text-xs">
              Skill: {userStats.player_skill.toFixed(1)} | 
              Played: {userStats.puzzles_played} | 
              Given up: {userStats.games_given_up}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        {!isGameActive && !waitingToStart && !isPuzzleSolved && (
          <button
            onClick={() => fetchPuzzle(true)}
            className="px-4 py-2 rounded bg-blue-600 text-white"
          >
            Start Game
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

        {isGameActive && !isPuzzleSolved && (
          <>
            <button
              onClick={handleGiveUp}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Give Up
            </button>
            <button
              onClick={checkSolution}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Check
            </button>
          </>
        )}

        {isPuzzleSolved && (
          <button
            onClick={handleNextPuzzle}
            className="bg-purple-600 text-white px-4 py-2 rounded"
          >
            Next Puzzle
          </button>
        )}
      </div>

      {puzzleLoaded && (
        <>
          <SudokuBoard
            puzzle={puzzle}
            board={userBoard}
            selectedCell={selectedCell}
            onCellSelect={handleCellSelect}
          />
          <NumberPad onNumberSelect={handleNumberInput} />
        </>
      )}

      <Timer isActive={isGameActive} resetSignal={startTime} elapsedTime={elapsedTime} />
    </div>
  );
}

export default Game; 