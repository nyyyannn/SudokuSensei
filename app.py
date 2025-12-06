from flask_cors import CORS
from flask import Flask, request, jsonify, session, redirect, url_for
from generator import SudokuGenerator, print_board
import os
import math
from pymongo import MongoClient
from bson import ObjectId
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
# IMPORTANT: Update this origin to your actual frontend URL in production
CORS(app, supports_credentials=True, origins=["http://localhost:5173","https://sudokusensei.onrender.com"]) 
app.secret_key = os.getenv("SECRET_KEY")

# Session configuration to prevent loss on refresh
app.config['SESSION_COOKIE_SECURE'] = True  
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'None'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)  # Session lasts 7 days

# MongoDB connection
MONGO_URI = os.getenv('MONGO_URI')
client = MongoClient(MONGO_URI)
db = client.SudokuSensei
users_collection = db.users
games_collection = db.games


def count_empty_cells(puzzle):
    """Helper function to count the number of empty cells (zeros) in a puzzle."""
    return sum(row.count(0) for row in puzzle)

@app.route('/api/auth/check', methods=['GET'])
def check_auth():
    """Check if user is authenticated"""
    try:
        user_id = session.get('user_id')
        
        if user_id:
            user = users_collection.find_one({'_id': ObjectId(user_id)})
            if user:
                return jsonify({
                    'authenticated': True,
                    'user': {
                        'name': user['name'],
                        'id': str(user['_id']),
                        'player_skill': user.get('player_skill', 20.0),
                        'puzzles_played': user.get('puzzles_played', 0),
                        'games_given_up': user.get('games_given_up', 0)
                    }
                })
            else:
                # Clear invalid session
                session.clear()
            
        return jsonify({'authenticated': False})
    except Exception as e:
        return jsonify({'authenticated': False, 'error': str(e)})

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    """Sign up a new user with just a name"""
    data = request.get_json()
    name = data.get('name', '').strip()
    
    if not name:
        return jsonify({'error': 'Name is required'}), 400
    
    # Check if user already exists
    existing_user = users_collection.find_one({'name': name})
    if existing_user:
        return jsonify({'error': 'User with this name already exists'}), 409
    
    # Create new user
    user = {
        'name': name,
        'created_at': datetime.utcnow(),
        'player_skill': 20.0,
        'puzzles_played': 0,
        'games_given_up': 0
    }
    
    result = users_collection.insert_one(user)
    user['_id'] = result.inserted_id
    
    # Set session as permanent
    session.permanent = True
    session['user_id'] = str(user['_id'])
    session['user_name'] = user['name']
    session['player_skill'] = user['player_skill']
    session['puzzles_played'] = user['puzzles_played']
    session['games_given_up'] = user['games_given_up']
    
    return jsonify({
        'success': True,
        'user': {
            'name': user['name'],
            'id': str(user['_id'])
        }
    })

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user with just a name"""
    data = request.get_json()
    name = data.get('name', '').strip()
    
    if not name:
        return jsonify({'error': 'Name is required'}), 400
    
    # Find user
    user = users_collection.find_one({'name': name})
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    user_id = ObjectId(user['_id'])
    
    # Set session as permanent
    session.permanent = True
    session['user_id'] = str(user['_id'])
    session['user_name'] = user['name']
    session['player_skill'] = user.get('player_skill', 20.0)
    session['puzzles_played'] = user.get('puzzles_played', 0)
    session['games_given_up'] = user.get('games_given_up', 0)
    
    # Check if there's a saved game and restore target_time to session
    game = games_collection.find_one({'user_id': user_id})
    if game and game.get('is_game_active'):
        target_time = game.get('target_time')
        if target_time:
            session['target_time'] = target_time
            session['seconds_per_cell'] = game.get('seconds_per_cell')
            session['difficulty_setting'] = game.get('difficulty_setting')
    
    return jsonify({
        'success': True,
        'user': {
            'name': user['name'],
            'id': str(user['_id'])
        }
    })

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Logout user - save game state before clearing session"""
    if session.get('user_id'):
        user_id = ObjectId(session['user_id'])
        
        # Check if there's an active game and save it with current timer state
        game = games_collection.find_one({'user_id': user_id})
        if game and game.get('is_game_active'):
            # Update the game with current session timer data if available
            game_data = {
                'target_time': session.get('target_time'),
                'seconds_per_cell': session.get('seconds_per_cell'),
                'difficulty_setting': session.get('difficulty_setting'),
                'updated_at': datetime.utcnow()
            }
            # Only update fields that exist in session
            game_data = {k: v for k, v in game_data.items() if v is not None}
            if game_data:
                games_collection.update_one(
                    {'user_id': user_id},
                    {'$set': game_data}
                )
    
    session.clear()
    return jsonify({'success': True})

@app.route('/api/game/give-up', methods=['POST'])
def give_up():
    """Handle user giving up on current puzzle"""
    if not session.get('user_id'):
        return jsonify({'error': 'Not authenticated'}), 401
    
    user_id = ObjectId(session['user_id'])
    
    # Get current user data
    user = users_collection.find_one({'_id': user_id})
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Ensure games_given_up field exists
    current_give_ups = user.get('games_given_up', 0)
    new_give_ups = current_give_ups + 1
    
    # Get current puzzles played
    current_puzzles_played = user.get('puzzles_played', 0)
    new_puzzles_played = current_puzzles_played + 1
    
    # Update in database
    users_collection.update_one(
        {'_id': user_id},
        {
            '$set': {
                'games_given_up': new_give_ups,
                'puzzles_played': new_puzzles_played
            }
        }
    )
    
    # Update session
    session['games_given_up'] = new_give_ups
    session['puzzles_played'] = new_puzzles_played
    
    # Clear saved game state
    games_collection.delete_one({'user_id': user_id})
    
    return jsonify({
        'success': True,
        'games_given_up': new_give_ups,
        'puzzles_played': new_puzzles_played
    })

@app.route('/api/game/save', methods=['POST'])
def save_game():
    """Save current game state"""
    if not session.get('user_id'):
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.get_json()
    user_id = ObjectId(session['user_id'])
    
    game_data = {
        'user_id': user_id,
        'puzzle': data.get('puzzle'),
        'user_board': data.get('user_board'),
        'solution': data.get('solution'),
        'start_time': data.get('start_time'),
        'is_game_active': data.get('is_game_active', False),
        'elapsed_time': data.get('elapsed_time', 0),
        'target_time': data.get('target_time') or session.get('target_time'),
        'seconds_per_cell': session.get('seconds_per_cell'),
        'difficulty_setting': session.get('difficulty_setting'),
        'updated_at': datetime.utcnow()
    }
    
    # Update or insert game state
    games_collection.update_one(
        {'user_id': user_id},
        {'$set': game_data},
        upsert=True
    )
    
    return jsonify({'success': True})

@app.route('/api/game/load', methods=['GET'])
def load_game():
    """Load saved game state"""
    if not session.get('user_id'):
        return jsonify({'error': 'Not authenticated'}), 401
    
    user_id = ObjectId(session['user_id'])
    game = games_collection.find_one({'user_id': user_id})
    
    if game:
        # Restore target_time to session if it exists
        target_time = game.get('target_time')
        if target_time:
            session['target_time'] = target_time
            session['seconds_per_cell'] = game.get('seconds_per_cell')
            session['difficulty_setting'] = game.get('difficulty_setting')
        
        return jsonify({
            'has_saved_game': True,
            'game': {
                'puzzle': game.get('puzzle'),
                'user_board': game.get('user_board'),
                'solution': game.get('solution'),
                'start_time': game.get('start_time'),
                'is_game_active': game.get('is_game_active', False),
                'elapsed_time': game.get('elapsed_time', 0),
                'target_time': target_time
            }
        })
    
    return jsonify({'has_saved_game': False})

@app.route('/api/new-game', methods=['POST'])
def new_game():
    """
    Generates a new puzzle and calculates a FAIR target time based on empty cells.
    """
    if not session.get('user_id'):
        return jsonify({'error': 'Not authenticated'}), 401
    
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
    
    generator = SudokuGenerator(difficulty=difficulty_setting)
    result = generator.get_puzzle_and_analysis()

    puzzle_board = result['puzzle']
    solution_board = result['solution']
    empty_cells = count_empty_cells(puzzle_board)
    target_time = empty_cells * seconds_per_cell

    # Print puzzle and solution to console
    print(f"\n=== Generated {difficulty_setting.upper()} Sudoku Puzzle ===")
    print_board(puzzle_board, title=f"{difficulty_setting.capitalize()} Puzzle")
    print("\n--- Complete Solution ---")
    print_board(solution_board, title=f"{difficulty_setting.capitalize()} Solution")
    print("=" * 50 + "\n")

    # Store necessary info for the new reward calculation
    session['target_time'] = target_time
    session['seconds_per_cell'] = seconds_per_cell
    session['difficulty_setting'] = difficulty_setting

    result['target_time'] = target_time
    return jsonify(result)

@app.route('/api/submit-solution', methods=['POST'])
def submit_solution():
    """
    Updates player skill with the new "Cells' Worth of Time" logic.
    """
    if not session.get('user_id'):
        return jsonify({'error': 'Not authenticated'}), 401
    
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

    # Update player skill in session
    new_skill = max(10.0, old_skill + skill_change)
    session['player_skill'] = new_skill
    session['puzzles_played'] = session.get('puzzles_played', 0) + 1
    
    # Update in database
    user_id = ObjectId(session['user_id'])
    users_collection.update_one(
        {'_id': user_id},
        {
            '$set': {
                'player_skill': new_skill,
                'puzzles_played': session['puzzles_played']
            }
        }
    )

    # Clean up: Delete saved game since puzzle is completed
    games_collection.delete_one({'user_id': user_id})

    # Get updated puzzles_played from database
    updated_user = users_collection.find_one({'_id': user_id})
    puzzles_played = updated_user.get('puzzles_played', 0) if updated_user else session['puzzles_played']
    
    return jsonify({
        'status': 'success',
        'new_skill_score': new_skill,
        'old_skill_score': old_skill,
        'skill_change': skill_change,
        'was_target_met': time_taken <= target_time,
        'puzzles_played': puzzles_played
    })

@app.route('/api/debug/session', methods=['GET'])
def debug_session():
    """Debug endpoint to check session status"""
    try:
        session_data = {
            'user_id': session.get('user_id'),
            'user_name': session.get('user_name'),
            'player_skill': session.get('player_skill'),
            'puzzles_played': session.get('puzzles_played'),
            'games_given_up': session.get('games_given_up'),
            'session_id': session.sid if hasattr(session, 'sid') else 'N/A'
        }
        return jsonify({
            'session_exists': bool(session.get('user_id')),
            'session_data': session_data
        })
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

