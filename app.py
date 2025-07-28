from flask_cors import CORS
from flask import Flask, request, jsonify, session
from generator import SudokuGenerator 
import os
import math

app = Flask(__name__)
# IMPORTANT: Update this origin to your actual frontend URL in production
CORS(app, supports_credentials=True, origins=["http://localhost:5173"]) 
app.secret_key = os.urandom(24) 

def count_empty_cells(puzzle):
    """Helper function to count the number of empty cells (zeros) in a puzzle."""
    return sum(row.count(0) for row in puzzle)

@app.route('/api/new-game', methods=['POST'])
def new_game():
    """
    Generates a new puzzle and calculates a FAIR target time based on empty cells.
    """
    player_skill = session.get('player_skill', 20.0)
    
    if player_skill < 30:
        difficulty_setting = 'easy'
        seconds_per_cell = 10
    elif player_skill < 70:
        difficulty_setting = 'medium'
        seconds_per_cell = 15
    else:
        difficulty_setting = 'hard'
        seconds_per_cell = 20

    print(f"Player skill is {player_skill:.2f}. Generating a '{difficulty_setting}' puzzle.")
    
    generator = SudokuGenerator(difficulty=difficulty_setting)
    result = generator.get_puzzle_and_analysis()

    puzzle_board = result['puzzle']
    empty_cells = count_empty_cells(puzzle_board)
    target_time = empty_cells * seconds_per_cell

    # Store necessary info for the new reward calculation
    session['target_time'] = target_time
    session['seconds_per_cell'] = seconds_per_cell
    session['difficulty_setting'] = difficulty_setting

    if 'player_skill' not in session:
        session['player_skill'] = 20.0
        session['puzzles_played'] = 0

    print(f"Puzzle has {empty_cells} empty cells. Target time is {target_time}s.")

    result['target_time'] = target_time
    return jsonify(result)

@app.route('/api/submit-solution', methods=['POST'])
def submit_solution():
    """
    Updates player skill with the new "Cells' Worth of Time" logic.
    """
    data = request.get_json()
    time_taken = data.get('time_taken')
    
    target_time = session.get('target_time', 300)
    seconds_per_cell = session.get('seconds_per_cell', 15)
    difficulty_setting = session.get('difficulty_setting', 'medium')
    
    old_skill = session.get('player_skill', 20.0)
    skill_change = 0

    # --- FINAL REWARD LOGIC ---
    if time_taken <= target_time:
        # Player met the target. Reward is based on "cells' worth of time" saved.
        time_saved = target_time - time_taken
        
        # Determine a bonus multiplier based on puzzle difficulty
        if difficulty_setting == 'easy':
            difficulty_bonus = 0.75
        elif difficulty_setting == 'medium':
            difficulty_bonus = 1.0
        else: # hard
            difficulty_bonus = 1.25
            
        # Calculate skill change based on the new, more intuitive formula
        skill_change = (time_saved / seconds_per_cell) * difficulty_bonus
        
    else:
        # Penalty logic remains the same (it's already fair and dynamic)
        time_excess_ratio = (time_taken / target_time) - 1
        penalty_factor = math.tanh(time_excess_ratio * 2) 
        max_loss = 10.0
        skill_change = -penalty_factor * max_loss

    # Update player skill
    session['player_skill'] = max(10.0, old_skill + skill_change) 
    session['puzzles_played'] = session.get('puzzles_played', 0) + 1

    print(f"Time: {time_taken:.1f}s, Target: {target_time}s. Skill change: {skill_change:.2f}. New skill: {session['player_skill']:.2f}")

    return jsonify({
        'status': 'success',
        'new_skill_score': session['player_skill'],
        'old_skill_score': old_skill,
        'skill_change': skill_change,
        'was_target_met': time_taken <= target_time
    })

if __name__ == '__main__':
    app.run(debug=True)
