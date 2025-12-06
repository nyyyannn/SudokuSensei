import React, { useState, useEffect, useCallback } from 'react';
import SudokuBoard from './SudokuBoard';
import NumberPad from './NumberPad';
import Timer from './Timer';
import Popup from './Popup';
import Confetti from './Confetti';

function Game({ user, onLogout }) {

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

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
  const [targetTime, setTargetTime] = useState(null);
  const [userStats, setUserStats] = useState({
    player_skill: user.player_skill || 20.0,
    puzzles_played: user.puzzles_played || 0,
    games_given_up: user.games_given_up || 0
  });
  const [popup, setPopup] = useState({ show: false, message: '', type: 'info', showConfirm: false, action: null });
  const [showConfetti, setShowConfetti] = useState(false);

  const refreshUserStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/check`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.authenticated && data.user) {
        setUserStats({
          player_skill: data.user.player_skill || 20.0,
          puzzles_played: data.user.puzzles_played || 0,
          games_given_up: data.user.games_given_up || 0
        });
      }
    } catch (err) {
      console.error('Failed to refresh user stats:', err);
    }
  }, [API_BASE]);

  const saveGame = useCallback(async () => {
    if (!puzzle.length || !userBoard.length) return;

    try {
      await fetch(`${API_BASE}/api/game/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          puzzle,
          user_board: userBoard,
          solution,
          start_time: startTime,
          is_game_active: isGameActive,
          elapsed_time: elapsedTime,
          target_time: targetTime
        }),
      });
    } catch (err) {
      console.error('Failed to save game:', err);
    }
  }, [API_BASE, puzzle, userBoard, solution, startTime, isGameActive, elapsedTime, targetTime]);

  const loadGame = useCallback(async () => {
    try {
      await refreshUserStats();

      const response = await fetch(`${API_BASE}/api/game/load`, {
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
        setTargetTime(game.target_time || null);
        setIsPuzzleSolved(false);
        setWaitingToStart(!game.is_game_active);
        setPuzzleLoaded(game.is_game_active);
      } else {
        fetchPuzzle(true);
      }
    } catch (err) {
      console.error('Failed to load game:', err);
      fetchPuzzle(true);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, refreshUserStats]);

  useEffect(() => {
    loadGame();
  }, [loadGame]);

  const fetchPuzzle = async (autoStart = true) => {
    try {
      const res = await fetch(`${API_BASE}/api/new-game`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!res.ok) throw new Error(`Failed to fetch. Status: ${res.status}`);
      const data = await res.json();
      if (!data.puzzle) throw new Error("Invalid puzzle data");

      const newPuzzle = data.puzzle;
      const newUserBoard = newPuzzle.map(row => [...row]);

      setPuzzle(newPuzzle);
      setUserBoard(newUserBoard);
      setSolution(data.solution);
      setTargetTime(data.target_time || null);
      setStartTime(Date.now());
      setElapsedTime(0);
      setPuzzleLoaded(autoStart);
      setIsGameActive(autoStart);
      setWaitingToStart(!autoStart);

      await refreshUserStats();

      await fetch(`${API_BASE}/api/game/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          puzzle: newPuzzle,
          user_board: newUserBoard,
          solution: data.solution,
          start_time: Date.now(),
          is_game_active: autoStart,
          elapsed_time: 0,
          target_time: data.target_time || null
        }),
      });

    } catch (err) {
      console.error("Fetch error:", err.message);
    }
  };

  const handleLogout = async () => {
    try {
      if (isGameActive && !isPuzzleSolved) await saveGame();
      await fetch(`${API_BASE}/api/auth/logout`, {
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-green-900 to-black">
        <div className="text-xl text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gradient-to-br from-gray-900 via-green-900 to-black p-4 overflow-hidden flex flex-col">
      {showConfetti && <Confetti />}
      {popup.show && (
        <Popup
          message={popup.message}
          type={popup.type}
          showConfirm={popup.showConfirm}
          onClose={() => {
            setPopup({ show: false, message: '', type: 'info', showConfirm: false, action: null });
          }}
          onConfirm={() => {
            if (popup.action === 'giveUp') {
              handleGiveUpConfirm();
            } else if (popup.action === 'nextPuzzle') {
              handleNextPuzzleConfirm();
            }
          }}
          onCancel={() => {
            if (popup.action === 'nextPuzzle') {
              handleNextPuzzleCancel();
            } else {
              setPopup({ show: false, message: '', type: 'info', showConfirm: false, action: null });
            }
          }}
        />
      )}
      <div className="max-w-7xl mx-auto w-full flex flex-col h-full">
        <div className="flex justify-between items-start mb-2 flex-shrink-0">
          <div className="flex flex-col">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">Sudoku Sensei</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-white/80">
              <div className="text-2xl font-semibold">Welcome, {user.name}!</div>
              <div className="text-sm mt-1">
                Skill: {userStats.player_skill.toFixed(1)} | 
                Played: {userStats.puzzles_played} | 
                Given up: {userStats.games_given_up}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-2 transition-all duration-300 ease-in-out transform hover:scale-105"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Logout
            </button>
          </div>
        </div>

        <div className="flex justify-center items-center mb-3 flex-shrink-0">
          {!isGameActive && !waitingToStart && !isPuzzleSolved && (
            <button
              onClick={() => fetchPuzzle(true)}
              className="px-4 py-2 text-sm rounded bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 transition-all duration-300 ease-in-out transform hover:scale-105"
            >
              Start Game
            </button>
          )}

          {waitingToStart && (
            <button
              onClick={startPuzzleNow}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 text-sm rounded hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 ease-in-out transform hover:scale-105"
            >
              Start Puzzle
            </button>
          )}

          {isGameActive && !isPuzzleSolved && (
            <div className="flex gap-3">
              <button
                onClick={handleGiveUp}
                className="bg-red-500 text-white px-4 py-2 text-sm rounded hover:bg-red-600 flex items-center gap-2 transition-all duration-300 ease-in-out transform hover:scale-105"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Give Up
              </button>
              <button
                onClick={checkSolution}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 text-sm rounded hover:from-green-700 hover:to-emerald-700 flex items-center gap-2 transition-all duration-300 ease-in-out transform hover:scale-105"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Check
              </button>
            </div>
          )}

          {isPuzzleSolved && (
            <button
              onClick={handleNextPuzzle}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 text-sm rounded hover:from-green-700 hover:to-emerald-700 transition-all duration-300 ease-in-out transform hover:scale-105"
            >
              Next Puzzle
            </button>
          )}
        </div>

        {puzzleLoaded && (
          <div className="flex flex-col items-center justify-center w-full flex-1 overflow-auto">
            <div className="mb-4">
              <SudokuBoard
                puzzle={puzzle}
                board={userBoard}
                selectedCell={selectedCell}
                onCellSelect={handleCellSelect}
              />
            </div>
            <div className="flex items-center gap-3 mb-2">
              <Timer isActive={isGameActive} resetSignal={startTime} elapsedTime={elapsedTime} />
              {targetTime && (
                <div className="text-xl text-white/90 font-semibold">
                  Target: {Math.floor(targetTime / 60)}:{String(targetTime % 60).padStart(2, '0')}
                </div>
              )}
            </div>
            <div className="mb-2">
              <NumberPad onNumberSelect={handleNumberInput} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Game; 