# Sudoku Sensei with MongoDB Authentication

A Sudoku game with user authentication, session management, and auto-save functionality.

## Features

- **User Authentication**: Simple name-based login/signup (no passwords required)
- **Session Management**: Users stay logged in across browser sessions
- **Auto-save**: Game state is automatically saved and restored
- **Refresh Prevention**: Users can't refresh the page during active games
- **Progress Tracking**: Player skill scores are tracked and persisted

## Setup Instructions

### Prerequisites

1. **MongoDB**: Make sure MongoDB is running on your system
   - Install MongoDB from https://www.mongodb.com/try/download/community
   - Or use MongoDB Atlas (cloud service)

2. **Python**: Python 3.7+ required
3. **Node.js**: Node.js 14+ required

### Backend Setup

1. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure MongoDB URI**:
   - Copy `env.example` to `.env`
   - Update the `MONGO_URI` in `.env` to point to your MongoDB instance
   - For local MongoDB: `mongodb://localhost:27017/sudoku_app`
   - For MongoDB Atlas: `mongodb+srv://username:password@cluster.mongodb.net/sudoku_app`

3. **Start the backend server**:
   ```bash
   python app.py
   ```
   The server will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

## Usage

1. Open your browser and go to `http://localhost:5173`
2. Enter your name to sign up or login
3. Start playing Sudoku!
4. Your progress will be automatically saved
5. You can logout and login again to continue where you left off

## API Endpoints

### Authentication
- `GET /api/auth/check` - Check if user is authenticated
- `POST /api/auth/signup` - Sign up with name
- `POST /api/auth/login` - Login with name
- `POST /api/auth/logout` - Logout

### Game Management
- `POST /api/new-game` - Generate new puzzle
- `POST /api/submit-solution` - Submit solution and update skill
- `POST /api/game/save` - Save current game state
- `GET /api/game/load` - Load saved game state

## Database Collections

- **users**: Stores user information and skill scores
- **games**: Stores current game state for each user

## Security Features

- Session-based authentication
- CORS configured for frontend
- Input validation and sanitization
- Refresh prevention during active games

## Troubleshooting

1. **MongoDB Connection Error**: Make sure MongoDB is running and the URI is correct
2. **CORS Error**: Ensure the frontend is running on `http://localhost:5173`
3. **Session Issues**: Clear browser cookies and try again 