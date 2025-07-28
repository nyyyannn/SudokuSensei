import random
import copy
from itertools import combinations

# --- Part 1: The Human-Like Solver (Now with Advanced Techniques) ---

class HumanSolver:
    """
    Analyzes a puzzle's difficulty based on the cognitive techniques
    required to solve it, mimicking a human's thought process.
    """
    def __init__(self, board):
        self.candidates = self._initialize_candidates(board)
        self.difficulty_score = 0
        self.hardest_technique = "None"
        self.technique_scores = {
            "Naked Single": 10,
            "Hidden Single": 25,
            "Pointing Pair": 60, # New advanced technique
            "Naked Pair": 80,    # New advanced technique
        }

    def analyze(self):
        """
        Analyzes the puzzle by applying human-like solving techniques
        in order of difficulty and records the hardest one used.
        """
        stalled = False
        while not self._is_solved() and not stalled:
            made_move = False
            
            # --- Try techniques in order of cognitive ease ---
            move_found, technique = self._find_naked_singles()
            if move_found:
                self._update_difficulty(technique)
                made_move = True
                continue

            move_found, technique = self._find_hidden_singles()
            if move_found:
                self._update_difficulty(technique)
                made_move = True
                continue
            
            # --- NEW: Advanced Techniques ---
            move_found, technique = self._find_pointing_pairs()
            if move_found:
                self._update_difficulty(technique)
                made_move = True
                continue

            move_found, technique = self._find_naked_pairs()
            if move_found:
                self._update_difficulty(technique)
                made_move = True
                continue

            if not made_move:
                stalled = True
        
        return {
            "score": self.difficulty_score,
            "hardest_technique": self.hardest_technique
        }

    def _initialize_candidates(self, board):
        candidates = {}
        for r in range(9):
            for c in range(9):
                if board[r][c] == 0:
                    possible_nums = set(range(1, 10))
                    for peer in self._get_peer_cells(r, c):
                        possible_nums.discard(board[peer[0]][peer[1]])
                    candidates[(r, c)] = possible_nums
        return candidates

    def _find_naked_singles(self):
        for cell, cands in self.candidates.items():
            if len(cands) == 1:
                num = list(cands)[0]
                self._place_number(cell, num)
                return True, "Naked Single"
        return False, None

    def _find_hidden_singles(self):
        for unit_type in ['row', 'col', 'box']:
            for i in range(9):
                counts = {n: [] for n in range(1, 10)}
                unit_cells = self._get_unit_cells(unit_type, i)
                for cell in unit_cells:
                    if cell in self.candidates:
                        for cand in self.candidates[cell]:
                            counts[cand].append(cell)
                for num, cells in counts.items():
                    if len(cells) == 1:
                        self._place_number(cells[0], num)
                        return True, "Hidden Single"
        return False, None

    def _find_naked_pairs(self):
        """
        Finds two cells in a unit with the exact same two candidates,
        and eliminates those candidates from other cells in the unit.
        """
        for unit_type in ['row', 'col', 'box']:
            for i in range(9):
                unit_cells = self._get_unit_cells(unit_type, i)
                # Find all cells with exactly two candidates
                pairs = [cell for cell in unit_cells if cell in self.candidates and len(self.candidates[cell]) == 2]
                # If there are at least two such cells, check for combinations
                if len(pairs) >= 2:
                    for c1, c2 in combinations(pairs, 2):
                        if self.candidates[c1] == self.candidates[c2]:
                            # Naked pair found!
                            pair_cands = self.candidates[c1]
                            made_change = False
                            for cell_to_clean in unit_cells:
                                if cell_to_clean not in [c1, c2] and cell_to_clean in self.candidates:
                                    if self.candidates[cell_to_clean].intersection(pair_cands):
                                        self.candidates[cell_to_clean].difference_update(pair_cands)
                                        made_change = True
                            if made_change:
                                return True, "Naked Pair"
        return False, None

    def _find_pointing_pairs(self):
        """
        Finds candidates in a box that are confined to a single row or column,
        allowing elimination of that candidate from the rest of the row/column.
        """
        for box_idx in range(9):
            box_cells = self._get_unit_cells('box', box_idx)
            for num in range(1, 10):
                num_placements = [cell for cell in box_cells if cell in self.candidates and num in self.candidates[cell]]
                
                if 2 <= len(num_placements) <= 3:
                    rows = {r for r, c in num_placements}
                    cols = {c for r, c in num_placements}
                    
                    made_change = False
                    # Check if all are in the same row
                    if len(rows) == 1:
                        row = rows.pop()
                        cells_to_clean = [(row, c) for c in range(9) if (row, c) not in box_cells]
                        for cell in cells_to_clean:
                            if cell in self.candidates and num in self.candidates[cell]:
                                self.candidates[cell].discard(num)
                                made_change = True
                    
                    # Check if all are in the same column
                    if len(cols) == 1:
                        col = cols.pop()
                        cells_to_clean = [(r, col) for r in range(9) if (r, col) not in box_cells]
                        for cell in cells_to_clean:
                            if cell in self.candidates and num in self.candidates[cell]:
                                self.candidates[cell].discard(num)
                                made_change = True
                    
                    if made_change:
                        return True, "Pointing Pair"
        return False, None

    def _place_number(self, cell, num):
        if cell in self.candidates:
            self.candidates[cell] = {num} # Set it to the solved number
            for peer in self._get_peer_cells(cell[0], cell[1]):
                if peer in self.candidates:
                    self.candidates[peer].discard(num)
            del self.candidates[cell] # Remove from candidates list

    def _update_difficulty(self, technique):
        score = self.technique_scores.get(technique, 0)
        if score > self.difficulty_score:
            self.difficulty_score = score
            self.hardest_technique = technique

    def _get_unit_cells(self, unit_type, index):
        cells = []
        if unit_type == 'row':
            for c in range(9): cells.append((index, c))
        elif unit_type == 'col':
            for r in range(9): cells.append((r, index))
        elif unit_type == 'box':
            start_r, start_c = 3 * (index // 3), 3 * (index % 3)
            for r in range(start_r, start_r + 3):
                for c in range(start_c, start_c + 3):
                    cells.append((r, c))
        return cells

    def _get_peer_cells(self, r, c):
        peers = set()
        for i in range(9): peers.add((r, i)); peers.add((i, c))
        box_r, box_c = 3 * (r // 3), 3 * (c // 3)
        for i in range(box_r, box_r + 3):
            for j in range(box_c, box_c + 3):
                peers.add((i, j))
        peers.discard((r, c))
        return peers

    def _is_solved(self):
        return len(self.candidates) == 0

# --- Part 2 & 3: Generator and Brute-Force Solver (Unchanged) ---
# The beauty of this design is that the generator and the brute-force
# uniqueness checker don't need to change at all. They just do their job,
# and the HumanSolver provides the final layer of analysis.

class SudokuGenerator:
    def __init__(self, difficulty='medium'):
        self.board = [[0 for _ in range(9)] for _ in range(9)]
        self.brute_force_solver = SudokuSolver(self.board)
        difficulty_map = {'easy': 40, 'medium': 34, 'hard': 28, 'extreme': 22}
        self.cells_to_fill = difficulty_map.get(difficulty, 34)
        self._generate_full_solution()
        self._poke_holes()
        self._analyze_difficulty()
    def _generate_full_solution(self):
        self.brute_force_solver.solve()
        self.solution = copy.deepcopy(self.board)
        self.board = copy.deepcopy(self.solution)
    def _poke_holes(self):
        cells = [(r, c) for r in range(9) for c in range(9)]
        random.shuffle(cells)
        cells_to_remove = 81 - self.cells_to_fill
        removed_count = 0
        for row, col in cells:
            if removed_count >= cells_to_remove: break
            temp = self.board[row][col]
            self.board[row][col] = 0
            board_copy = copy.deepcopy(self.board)
            solver_for_check = SudokuSolver(board_copy)
            if solver_for_check.count_solutions() != 1:
                self.board[row][col] = temp
            else:
                removed_count += 1
    def _analyze_difficulty(self):
        human_solver = HumanSolver(self.board)
        full_analysis = human_solver.analyze()
        self.analysis = {
            "score": full_analysis["score"],
            "hardest_technique": full_analysis["hardest_technique"]
        }

    def get_puzzle_and_analysis(self):
        print(self.board)
        return {"puzzle": self.board, "solution": self.solution, "analysis": self.analysis}

class SudokuSolver:
    def __init__(self, board): self.board = board; self.solution_count = 0
    def solve(self):
        find = self._find_empty();
        if not find: return True
        else: row, col = find
        nums = list(range(1, 10)); random.shuffle(nums)
        for num in nums:
            if self._is_valid(num, (row, col)):
                self.board[row][col] = num
                if self.solve(): return True
                self.board[row][col] = 0
        return False
    def count_solutions(self, limit=2):
        find = self._find_empty()
        if not find: self.solution_count += 1; return
        row, col = find
        for num in range(1, 10):
            if self._is_valid(num, (row, col)):
                self.board[row][col] = num; self.count_solutions(limit)
                if self.solution_count >= limit: return
        self.board[row][col] = 0
        return self.solution_count
    def _find_empty(self):
        for i in range(9):
            for j in range(9):
                if self.board[i][j] == 0: return (i, j)
        return None
    def _is_valid(self, num, pos):
        row, col = pos
        if num in self.board[row]: return False
        if num in [self.board[i][col] for i in range(9)]: return False
        box_x, box_y = col // 3, row // 3
        for i in range(box_y * 3, box_y * 3 + 3):
            for j in range(box_x * 3, box_x * 3 + 3):
                if self.board[i][j] == num: return False
        return True

def print_board(board, title="Sudoku Puzzle"):
    print(f"--- {title} ---")
    for i, row in enumerate(board):
        if i % 3 == 0 and i != 0: print("- - - - - - - - - - - -")
        printable_row = [str(cell) if cell != 0 else '.' for cell in row]
        print(f"{' '.join(printable_row[0:3])} | {' '.join(printable_row[3:6])} | {' '.join(printable_row[6:9])}")
    print("-" * 23)

