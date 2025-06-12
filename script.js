const canvas = document.getElementById('gobang-board');
const ctx = canvas.getContext('2d');
const resetButton = document.getElementById('reset-button');
const currentPlayerSpan = document.getElementById('current-player');
const gameStatusP = document.getElementById('game-status');

const BOARD_SIZE = 15; // 15x15 board
const CELL_SIZE = 40; // Size of each cell in pixels
const PADDING = 20; // Padding around the board

canvas.width = (BOARD_SIZE - 1) * CELL_SIZE + 2 * PADDING;
canvas.height = (BOARD_SIZE - 1) * CELL_SIZE + 2 * PADDING;

let board = []; // 0: empty, 1: black (player), 2: white (AI)
let currentPlayer = 2; // 2 for white (AI first), 1 for black (player)
let gameOver = false;

// --- Initialization ---
function initGame() {
    board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
    currentPlayer = 2; // White (AI) goes first
    gameOver = false;
    drawBoard();
    updateGameInfo('Computer (White) thinking...');
    gameStatusP.textContent = '';
    // AI makes the first move
    setTimeout(computerMove, 500);
}

// --- Drawing Functions ---
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#D2B48C'; // Wooden board color
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;

    for (let i = 0; i < BOARD_SIZE; i++) {
        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(PADDING, PADDING + i * CELL_SIZE);
        ctx.lineTo(PADDING + (BOARD_SIZE - 1) * CELL_SIZE, PADDING + i * CELL_SIZE);
        ctx.stroke();

        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(PADDING + i * CELL_SIZE, PADDING);
        ctx.lineTo(PADDING + i * CELL_SIZE, PADDING + (BOARD_SIZE - 1) * CELL_SIZE);
        ctx.stroke();
    }

    // Star points (天元和星位)
    const starPoints = [
        { x: 3, y: 3 }, { x: 11, y: 3 },
        { x: 3, y: 11 }, { x: 11, y: 11 },
        { x: 7, y: 7 } // 天元
    ];
    if (BOARD_SIZE === 15) {
        starPoints.push({x:3, y:7}, {x:7, y:3}, {x:7, y:11}, {x:11, y:7});
    }


    ctx.fillStyle = '#000';
    starPoints.forEach(point => {
        if (point.x < BOARD_SIZE && point.y < BOARD_SIZE) {
            ctx.beginPath();
            ctx.arc(PADDING + point.x * CELL_SIZE, PADDING + point.y * CELL_SIZE, 5, 0, 2 * Math.PI);
            ctx.fill();
        }
    });

    // Redraw pieces
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] !== 0) {
                drawPiece(r, c, board[r][c]);
            }
        }
    }
}

function drawPiece(row, col, player) {
    const x = PADDING + col * CELL_SIZE;
    const y = PADDING + row * CELL_SIZE;
    ctx.beginPath();
    ctx.arc(x, y, CELL_SIZE / 2 - 2, 0, 2 * Math.PI);
    ctx.fillStyle = player === 1 ? '#000' : '#FFF'; // Black or White
    ctx.fill();
    ctx.strokeStyle = player === 1 ? '#333' : '#CCC'; // Border for pieces
    ctx.lineWidth = 1;
    ctx.stroke();
}

// --- Game Logic ---
function updateGameInfo(message) {
    currentPlayerSpan.textContent = message;
}

function handleBoardClick(event) {
    if (gameOver || currentPlayer !== 1) return; // Only player's turn

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const col = Math.round((x - PADDING) / CELL_SIZE);
    const row = Math.round((y - PADDING) / CELL_SIZE);

    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE && board[row][col] === 0) {
        makeMove(row, col, 1);
        if (!gameOver) {
            currentPlayer = 2;
            updateGameInfo('Computer (White) thinking...');
            // AI's turn - simple delay for now
            setTimeout(computerMove, 500);
        }
    }
}

function makeMove(row, col, player) {
    board[row][col] = player;
    drawPiece(row, col, player);

    if (player === 2) { // Check forbidden moves for White (AI) - now White has restrictions
        const forbidden = checkForbiddenMove(row, col, player);
        if (forbidden.isForbidden) {
            gameOver = true;
            gameStatusP.textContent = `White (${forbidden.type}) Forbidden Move! Black (You) Wins!`;
            updateGameInfo('Black (You) Wins!');
            return; // End move processing
        }
    }

    if (checkWin(row, col, player, board)) {
        gameOver = true;
        gameStatusP.textContent = `${player === 1 ? 'Congratulations! Black (You)' : 'Computer (White)'} Wins!`;
        updateGameInfo(`${player === 1 ? 'Black (You)' : 'White (Computer)'} Wins!`);
    }
}

function checkWin(row, col, player, boardToCheck = board) {
    // Check horizontal, vertical, and two diagonals
    const directions = [
        { dr: 0, dc: 1 },  // Horizontal
        { dr: 1, dc: 0 },  // Vertical
        { dr: 1, dc: 1 },  // Diagonal \ 
        { dr: 1, dc: -1 }  // Diagonal / 
    ];

    for (const { dr, dc } of directions) {
        let count = 1;
        // Check in one direction
        for (let i = 1; i < 5; i++) {
            const r = row + dr * i;
            const c = col + dc * i;
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && boardToCheck[r][c] === player) {
                count++;
            } else {
                break;
            }
        }
        // Check in the opposite direction
        for (let i = 1; i < 5; i++) {
            const r = row - dr * i;
            const c = col - dc * i;
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && boardToCheck[r][c] === player) {
                count++;
            } else {
                break;
            }
        }
        if (count >= 5) return true;
    }
    return false;
}

function computerMove() {
    if (gameOver) return;

    // Basic AI: Find an empty spot and play
    // This will be replaced with more sophisticated AI later
    let bestMove = findBestMoveForAI();

    if (bestMove) {
        makeMove(bestMove.row, bestMove.col, 2);
        if (!gameOver) {
            currentPlayer = 1;
            updateGameInfo('Your turn (Black)');
        }
    } else {
        // No valid moves left (shouldn't happen if game not over, implies a draw or bug)
        gameOver = true;
        gameStatusP.textContent = 'Draw!';
        updateGameInfo('Draw!');
    }
}

// --- Forbidden Move Logic (for Black Player) ---
// Helper to count consecutive pieces for forbidden checks
function countConsecutivePieces(row, col, dr, dc, player, tempBoard) {
    let count = 0;
    for (let i = 1; i < 5; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && tempBoard[r][c] === player) {
            count++;
        } else {
            break;
        }
    }
    return count;
}

// Helper to check for open threes or fours (live threes/fours)
// type: 3 for three, 4 for four
// Returns true if it's an open three/four, false otherwise
function isOpenThreat(row, col, dr, dc, player, type, tempBoard) {
    let consecutive = 1; // Start with the current piece
    let openEnds = 0;
    let spaces = 0; // count spaces within the pattern for specific checks like jump threes

    // Check one direction
    let r = row + dr;
    let c = col + dc;
    let path1 = [];
    for (let i = 0; i < 5; i++) { // Check up to 4 more spots for a 5-in-a-row pattern
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
            path1.push(tempBoard[r][c]);
            if (tempBoard[r][c] === player) consecutive++;
            else if (tempBoard[r][c] === 0) { spaces++; break; } // Found an open end or space
            else break; // Blocked by opponent
            r += dr;
            c += dc;
        } else break; // Off board
    }
    if (path1.length > 0 && path1[path1.length-1] === 0) openEnds++;
    else if (path1.length === 0 || (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE)) { /* Edge of board, not open */ }

    // Check opposite direction
    r = row - dr;
    c = col - dc;
    let path2 = [];
    for (let i = 0; i < 5; i++) {
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
            path2.push(tempBoard[r][c]);
            if (tempBoard[r][c] === player) consecutive++;
            else if (tempBoard[r][c] === 0) { spaces++; break; }
            else break;
            r -= dr;
            c -= dc;
        } else break;
    }
    if (path2.length > 0 && path2[path2.length-1] === 0) openEnds++;
    else if (path2.length === 0 || (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE)) { /* Edge of board, not open */ }
    
    // This is a simplified check. Real open three/four detection is more complex.
    // For forbidden moves, we are interested in patterns that *would become* a win if not for the forbidden rule.

    if (type === 3) {
        // A live three is typically XOOOX or XOOXO_ or _XOOX_
        // For forbidden double-three, we need to find two such patterns intersecting at the new move.
        // A simple check: if we have 3 in a row and two open ends (OOO__ or __OOO or _OOO_)
        // Or a jump three like O_OO or OO_O with open ends.
        // This simplified version checks if placing a piece makes a line of 3 with open ends.
        let actualStones = 1;
        let p1 = 0, p2 = 0;
        let s1 = 0, s2 = 0; // spaces

        // Dir 1
        for(let i=1; i<=4; i++) {
            const r1 = row + dr*i; const c1 = col + dc*i;
            if(r1 < 0 || r1 >= BOARD_SIZE || c1 < 0 || c1 >= BOARD_SIZE) break;
            if(tempBoard[r1][c1] === player) p1++; else if(tempBoard[r1][c1] === 0) {s1++; break;} else break;
        }
        // Dir 2
        for(let i=1; i<=4; i++) {
            const r2 = row - dr*i; const c2 = col - dc*i;
            if(r2 < 0 || r2 >= BOARD_SIZE || c2 < 0 || c2 >= BOARD_SIZE) break;
            if(tempBoard[r2][c2] === player) p2++; else if(tempBoard[r2][c2] === 0) {s2++; break;} else break;
        }
        
        // Check for OOO (live three)
        if (p1 + p2 === 2 && s1 > 0 && s2 > 0) return true; // .OOO.
        // Check for O.OO (jump live three)
        if (p1 === 1 && tempBoard[row+dr][col+dc] === player && tempBoard[row+dr*2][col+dc*2] === 0 && p2 === 1 && tempBoard[row-dr][col-dc] === player && tempBoard[row-dr*2][col-dc*2] === 0) return true; // O.O + O.O -> O.OO.
        // Check for OO.O
        if (p1 === 0 && s1 > 0 && p2 === 2 && tempBoard[row-dr][col-dc] === player && tempBoard[row-dr*2][col-dc*2] === player && tempBoard[row-dr*3][col-dc*3] === 0) return true; // .OO.O
        if (p2 === 0 && s2 > 0 && p1 === 2 && tempBoard[row+dr][col+dc] === player && tempBoard[row+dr*2][col+dc*2] === player && tempBoard[row+dr*3][col+dc*3] === 0) return true; // O.OO.
        
        // More robust check for live three (XOOOX pattern or similar)
        // Pattern: 0, P, P, P, 0 (0 means empty, P means player)
        // Or P, 0, P, P, 0 or P, P, 0, P, 0
        // This requires checking specific patterns around (row, col)
        // For simplicity, the above check is a starting point.
        // A true live three has exactly 3 stones of 'player' in a line of 5, with the ends open.
        // Example: _OOO_ or O_OO_ or OO_O_
        let stonesInLine = 0;
        let openEndsCount = 0;
        let segments = [];
        // Scan 4 spots to the left/up
        for(let i = -4; i <= 4; i++) {
            if (i === 0) continue;
            const r_scan = row + dr * i;
            const c_scan = col + dc * i;
            if (r_scan >= 0 && r_scan < BOARD_SIZE && c_scan >= 0 && c_scan < BOARD_SIZE) {
                segments.push(tempBoard[r_scan][c_scan]);
            } else {
                segments.push(-1); // -1 for off-board
            }
        }
        // Check patterns like [0, P, P, 0] after adding current stone to make [0, P, P, P, 0]
        // This is complex, will use a simpler heuristic for now.
        // A simpler definition: a line of 3 that is not blocked on either side and is not already part of a 4 or 5.
        let line = [];
        for(let k = -2; k <= 2; k++) { // Check a segment of 5 around the potential 3-in-a-row
            const r_k = row + dr * k;
            const c_k = col + dc * k;
            if (r_k >=0 && r_k < BOARD_SIZE && c_k >=0 && c_k < BOARD_SIZE) line.push(tempBoard[r_k][c_k]);
            else line.push(-1); // -1 for outside board
        }
        // Example patterns for live three centered at index 2 (current move)
        // [0,P,P,P,0], [0,P,P,0,P] (becomes P,P,P,0,P), [P,0,P,P,0] (becomes P,0,P,P,P,0)
        // This needs a proper pattern matching engine.
        // For now, if count (p1+p2) is 2, and s1>0 and s2>0, it's a live three.
        if (p1 + p2 === 2 && s1 > 0 && s2 > 0) return true;
        // Jump threes: P_PP or PP_P with open ends
        if (p1 === 1 && tempBoard[row+dr][col+dc] === player && tempBoard[row+dr*2][col+dc*2] === 0 && s2 > 0 && p2 === 1) return true; // P P . P
        if (p2 === 1 && tempBoard[row-dr][col-dc] === player && tempBoard[row-dr*2][col-dc*2] === 0 && s1 > 0 && p1 === 1) return true; // P . P P

    }
    if (type === 4) {
        // Live four: _OOOO_ or O_OOO_ etc.
        // A line of 4 that is not blocked on at least one side to become a 5.
        let p1 = 0, p2 = 0;
        let s1 = 0, s2 = 0;
        for(let i=1; i<=4; i++) {
            const r1 = row + dr*i; const c1 = col + dc*i;
            if(r1 < 0 || r1 >= BOARD_SIZE || c1 < 0 || c1 >= BOARD_SIZE) break;
            if(tempBoard[r1][c1] === player) p1++; else if(tempBoard[r1][c1] === 0) {s1++; break;} else break;
        }
        for(let i=1; i<=4; i++) {
            const r2 = row - dr*i; const c2 = col - dc*i;
            if(r2 < 0 || r2 >= BOARD_SIZE || c2 < 0 || c2 >= BOARD_SIZE) break;
            if(tempBoard[r2][c2] === player) p2++; else if(tempBoard[r2][c2] === 0) {s2++; break;} else break;
        }
        // Forms a line of 4 (p1+p2 === 3) and has at least one open end (s1>0 || s2>0)
        if (p1 + p2 === 3 && (s1 > 0 || s2 > 0)) return true;
    }
    return false;
}

function checkForbiddenMove(row, col, player = 2) {
    // Now forbidden moves are for White (AI), player parameter allows flexibility
    let tempBoard = board.map(arr => arr.slice());
    tempBoard[row][col] = player; // Assume the move is made

    const directions = [
        { dr: 0, dc: 1 },  // Horizontal
        { dr: 1, dc: 0 },  // Vertical
        { dr: 1, dc: 1 },  // Diagonal \ 
        { dr: 1, dc: -1 }  // Diagonal / 
    ];

    // 1. Check for Long Connection (more than 5) - 長連
    for (const { dr, dc } of directions) {
        let count = 1;
        // Check in one direction
        for (let i = 1; i < BOARD_SIZE; i++) { // Check further than 5
            const r = row + dr * i;
            const c = col + dc * i;
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && tempBoard[r][c] === player) {
                count++;
            } else {
                break;
            }
        }
        // Check in the opposite direction
        for (let i = 1; i < BOARD_SIZE; i++) {
            const r = row - dr * i;
            const c = col - dc * i;
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && tempBoard[r][c] === player) {
                count++;
            } else {
                break;
            }
        }
        if (count > 5) return { isForbidden: true, type: 'Long Connection' };
    }

    // 2. Check for Double Four (雙四) and Double Three (雙三)
    // A move is a double-four if it simultaneously creates two lines of four pieces.
    // A move is a double-three if it simultaneously creates two live threes.
    // This doesn't count if one of the fours/threes also forms a five (winning move).
    // If it's a winning move, it's not a forbidden move.
    if (checkWin(row, col, player, tempBoard)) {
        return { isForbidden: false }; // Winning move overrides forbidden (standard RIF rule for this check)
    }

    let liveThreeCount = 0;
    let liveFourCount = 0; // Or冲四 (Chong Four - a four that can be extended to five)

    for (const { dr, dc } of directions) {
        // Check for live three
        if (isLineType(row, col, player, 3, dr, dc, tempBoard, true)) {
            liveThreeCount++;
        }
        // Check for four (live or non-live, as long as it's a four)
        if (isLineType(row, col, player, 4, dr, dc, tempBoard, false)) {
             // Check if this four is part of a long-connect, if so, it's not counted for double-four if long-connect is forbidden
            // For simplicity, we count all fours formed by this move.
            liveFourCount++;
        }
    }
    
    if (liveFourCount >= 2) return { isForbidden: true, type: 'Double Four' };
    if (liveThreeCount >= 2) return { isForbidden: true, type: 'Double Three' };

    return { isForbidden: false };
}

// Helper function to check for n-in-a-row patterns
// isLive: for threes, checks if it's a live three. For fours, this can be ignored or used to distinguish live fours.
// Helper function to check for n-in-a-row patterns
// isLiveCheck: for threes, checks if it's a live three. For fours, checks for live or冲四 (chong four).
function isLineType(r, c, player, n, dr, dc, currentBoard, isLiveCheck) {
    const opponent = player === 1 ? 2 : 1;
    let patterns = [];

    if (n === 3 && isLiveCheck) { // Live Three (活三)
        // Patterns: 0PPP0 (01110), 0P0PP0 (010110), 0PP0P0 (011010)
        // The new stone is at index 3 of a 7-length window for simplicity of checking patterns around it.
        // Window: [c-3, c-2, c-1, c, c+1, c+2, c+3]
        patterns = [
            // 0 P P P 0 (P is the new stone)
            [[0, player, player, player, 0], [dr, dc]], // e.g., _X[X]X_
            // 0 P 0 P P 0 (P is the new stone)
            [[0, player, 0, player, player, 0], [dr, dc]], // e.g., _X_[X]X_
            // 0 P P 0 P 0 (P is the new stone)
            [[0, player, player, 0, player, 0], [dr, dc]]  // e.g., _XX_[X]_
        ];
    }
    if (n === 4) { // Four (活四, 冲四)
        // Live Four (活四): 0PPPP0 (011110)
        // Chong Four (冲四): XPPPP0 (211110), 0PPPPX (011112), P0PPP (10111), PP0PP (11011), PPP0P (11101)
        // For forbidden double-four, any of these count if they don't make a five.
        patterns = [
            // Live Four: 0 P P P P 0 (new stone is one of the Ps)
            [[0, player, player, player, player, 0], [dr,dc]],
            // Chong Fours (that are not also live fours)
            // X P P P P 0
            [[opponent, player, player, player, player, 0], [dr,dc]],
            // 0 P P P P X
            [[0, player, player, player, player, opponent], [dr,dc]],
            // P 0 P P P (new stone makes it P0PPP or P P0PP etc.)
            [[player, 0, player, player, player], [dr,dc]],
            // P P 0 P P
            [[player, player, 0, player, player], [dr,dc]],
            // P P P 0 P
            [[player, player, player, 0, player], [dr,dc]]
        ];
    }

    for (const [pattern, [dRow, dCol]] of patterns) {
        const patternLength = pattern.length;
        const startOffset = -Math.floor(patternLength / 2); // To center pattern around (r,c) or check variants

        // Try to match the pattern with the new stone (r,c) being each of the 'player' stones in the pattern
        for (let i = 0; i < patternLength; i++) {
            if (pattern[i] !== player) continue; // The new stone must correspond to a 'player' spot in pattern

            let match = true;
            for (let j = 0; j < patternLength; j++) {
                const R = r + (j - i) * dRow;
                const C = c + (j - i) * dCol;

                if (R < 0 || R >= BOARD_SIZE || C < 0 || C >= BOARD_SIZE) {
                    if (pattern[j] === 0) continue; // Empty space off board is fine for open end
                    match = false; break;
                }
                if (currentBoard[R][C] !== pattern[j]) {
                    // Special case: if pattern expects 0 (empty) but board has current player's stone,
                    // it might be a jump pattern where the current move fills that 0.
                    // This needs careful handling if we want to detect jump threes/fours this way.
                    // For now, strict match.
                    if (R === r && C === c && pattern[j] === 0 && currentBoard[R][C] === player) {
                        // This means the pattern expected an empty spot where the new stone IS.
                        // This is valid for patterns like P_PP becoming PPPP if new stone is at _
                        // Let's assume the `currentBoard` ALREADY has the new stone at (r,c)
                        // So, if pattern[j] is player, and (R,C) is (r,c), it's fine.
                        // If pattern[j] is 0, and (R,C) is (r,c), this means the pattern is like X_XX and we placed at _.
                        // This logic is tricky. The `currentBoard` passed to `isLineType` should be the state *after* the move.
                         match = false; break;
                    }
                    if (currentBoard[R][C] !== pattern[j]) {
                         match = false; break;
                    }
                }
            }
            if (match) return true;
        }
    }
    return false;
}




// --- Enhanced AI Logic with Forbidden Move Avoidance and 4-3 Strategy ---

// Pattern recognition for advanced strategies
function analyzePattern(row, col, player, tempBoard) {
    const directions = [
        { dr: 0, dc: 1 },  // Horizontal
        { dr: 1, dc: 0 },  // Vertical
        { dr: 1, dc: 1 },  // Diagonal \
        { dr: 1, dc: -1 }  // Diagonal /
    ];
    
    let patterns = {
        liveFours: 0,
        chongFours: 0,
        liveThrees: 0,
        deadThrees: 0,
        liveTwos: 0
    };
    
    for (const { dr, dc } of directions) {
        const pattern = getLinePattern(row, col, dr, dc, player, tempBoard);
        patterns.liveFours += pattern.liveFours;
        patterns.chongFours += pattern.chongFours;
        patterns.liveThrees += pattern.liveThrees;
        patterns.deadThrees += pattern.deadThrees;
        patterns.liveTwos += pattern.liveTwos;
    }
    
    return patterns;
}

function getLinePattern(row, col, dr, dc, player, tempBoard) {
    const opponent = player === 1 ? 2 : 1;
    let line = [];
    
    // Get 9-cell line centered on the move
    for (let i = -4; i <= 4; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
            line.push(tempBoard[r][c]);
        } else {
            line.push(-1); // Out of bounds
        }
    }
    
    let patterns = {
        liveFours: 0,
        chongFours: 0,
        liveThrees: 0,
        deadThrees: 0,
        liveTwos: 0
    };
    
    // Check for various patterns
    const lineStr = line.join(',');
    const p = player;
    const o = opponent;
    
    // Live Four patterns: _XXXX_
    if (lineStr.includes(`0,${p},${p},${p},${p},0`)) patterns.liveFours++;
    
    // Chong Four patterns: OXXXX_, _XXXXO, X_XXX, XX_XX, XXX_X
    if (lineStr.includes(`${o},${p},${p},${p},${p},0`) || 
        lineStr.includes(`0,${p},${p},${p},${p},${o}`) ||
        lineStr.includes(`${p},0,${p},${p},${p}`) ||
        lineStr.includes(`${p},${p},0,${p},${p}`) ||
        lineStr.includes(`${p},${p},${p},0,${p}`)) {
        patterns.chongFours++;
    }
    
    // Live Three patterns: _XXX_, _X_XX_, _XX_X_
    if (lineStr.includes(`0,${p},${p},${p},0`) ||
        lineStr.includes(`0,${p},0,${p},${p},0`) ||
        lineStr.includes(`0,${p},${p},0,${p},0`)) {
        patterns.liveThrees++;
    }
    
    // Dead Three patterns (blocked on one side)
    if (lineStr.includes(`${o},${p},${p},${p},0`) ||
        lineStr.includes(`0,${p},${p},${p},${o}`)) {
        patterns.deadThrees++;
    }
    
    // Live Two patterns: _XX_, _X_X_
    if (lineStr.includes(`0,${p},${p},0`) ||
        lineStr.includes(`0,${p},0,${p},0`)) {
        patterns.liveTwos++;
    }
    
    return patterns;
}

function evaluateWindow(window, player) {
    let score = 0;
    const opponent = player === 1 ? 2 : 1;
    let playerCount = 0;
    let opponentCount = 0;
    let emptyCount = 0;

    for (let piece of window) {
        if (piece === player) playerCount++;
        else if (piece === opponent) opponentCount++;
        else emptyCount++;
    }

    // Score for the AI (player)
    if (playerCount === 5) {
        score += 1000000; // AI wins
    } else if (playerCount === 4 && emptyCount === 1) {
        score += 50000;   // AI has a live four
    } else if (playerCount === 3 && emptyCount === 2) {
        score += 5000;    // AI has a live three
    } else if (playerCount === 2 && emptyCount === 3) {
        score += 500;     // AI has a live two
    } else if (playerCount === 1 && emptyCount === 4) {
        score += 50;      // AI has one stone in an open window
    }
    
    // Score for the opponent (to block)
    if (opponentCount === 5) {
        score -= 800000; // Opponent wins
    } else if (opponentCount === 4 && emptyCount === 1) {
        score -= 100000;  // Opponent has a live four (urgent to block)
    } else if (opponentCount === 3 && emptyCount === 2) {
        score -= 10000;   // Opponent has a live three
    } else if (opponentCount === 2 && emptyCount === 3) {
        score -= 1000;    // Opponent has a live two
    }
    
    // Bonus for AI's non-live but threatening fours
    if (playerCount === 4 && opponentCount === 1) {
        score += 1000; // AI's blocked four, still good for pressure
    }
    if (opponentCount === 4 && playerCount === 1) {
        score -= 2000; // Opponent's blocked four
    }

    return score;
}

function scorePosition(tempBoard, player) {
    let score = 0;
    const center = Math.floor(BOARD_SIZE / 2);
    
    // Center preference
    for(let r=0; r<BOARD_SIZE; r++) {
        for(let c=0; c<BOARD_SIZE; c++) {
            if(tempBoard[r][c] === player) {
                score += (7 - (Math.abs(r - center) + Math.abs(c - center))/2 );
            }
            else if (tempBoard[r][c] !== 0) {
                 score -= (3 - (Math.abs(r - center) + Math.abs(c - center))/4 );
            }
        }
    }

    // Horizontal scores
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c <= BOARD_SIZE - 5; c++) {
            const window = tempBoard[r].slice(c, c + 5);
            score += evaluateWindow(window, player);
        }
    }
    // Vertical scores
    for (let c = 0; c < BOARD_SIZE; c++) {
        for (let r = 0; r <= BOARD_SIZE - 5; r++) {
            const window = [];
            for (let i = 0; i < 5; i++) window.push(tempBoard[r + i][c]);
            score += evaluateWindow(window, player);
        }
    }
    // Positive diagonal scores (\)
    for (let r = 0; r <= BOARD_SIZE - 5; r++) {
        for (let c = 0; c <= BOARD_SIZE - 5; c++) {
            const window = [];
            for (let i = 0; i < 5; i++) window.push(tempBoard[r + i][c + i]);
            score += evaluateWindow(window, player);
        }
    }
    // Negative diagonal scores (/)
    for (let r = 0; r <= BOARD_SIZE - 5; r++) {
        for (let c = BOARD_SIZE - 1; c >= 4; c--) {
            const window = [];
            for (let i = 0; i < 5; i++) window.push(tempBoard[r + i][c - i]);
            score += evaluateWindow(window, player);
        }
    }
    return score;
}

function scorePositionAdvanced(tempBoard, player, moveRow, moveCol) {
    let score = scorePosition(tempBoard, player);
    
    // Advanced pattern analysis for the specific move
    const patterns = analyzePattern(moveRow, moveCol, player, tempBoard);
    
    // Bonus for creating strong patterns
    score += patterns.liveFours * 100000;
    score += patterns.chongFours * 10000;
    score += patterns.liveThrees * 5000;
    score += patterns.deadThrees * 1000;
    score += patterns.liveTwos * 200;
    
    // Bonus for 4-3 combinations
    if (patterns.chongFours >= 1 && patterns.liveThrees >= 1) {
        score += 50000; // Strong 4-3 combination
    }
    
    if (patterns.chongFours >= 2) {
        score += 30000; // Double chong four
    }
    
    // Penalty for risky positions that might lead to forbidden moves
    const riskScore = evaluateForbiddenRisk(moveRow, moveCol, player, tempBoard);
    score -= riskScore;
    
    return score;
}

function evaluateForbiddenRisk(row, col, player, tempBoard) {
    let risk = 0;
    const directions = [
        { dr: 0, dc: 1 },  // Horizontal
        { dr: 1, dc: 0 },  // Vertical
        { dr: 1, dc: 1 },  // Diagonal \
        { dr: 1, dc: -1 }  // Diagonal /
    ];
    
    // Check if this move creates potential for future forbidden moves
    let potentialThrees = 0;
    let potentialFours = 0;
    
    for (const { dr, dc } of directions) {
        // Check if this direction could become a live three
        let count = 1;
        let openEnds = 0;
        
        // Check positive direction
        for (let i = 1; i <= 4; i++) {
            const r = row + dr * i;
            const c = col + dc * i;
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
                if (tempBoard[r][c] === player) count++;
                else if (tempBoard[r][c] === 0) { openEnds++; break; }
                else break;
            } else break;
        }
        
        // Check negative direction
        for (let i = 1; i <= 4; i++) {
            const r = row - dr * i;
            const c = col - dc * i;
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
                if (tempBoard[r][c] === player) count++;
                else if (tempBoard[r][c] === 0) { openEnds++; break; }
                else break;
            } else break;
        }
        
        if (count === 3 && openEnds >= 2) potentialThrees++;
        if (count === 4 && openEnds >= 1) potentialFours++;
    }
    
    // High risk if multiple potential threes (could lead to double-three)
    if (potentialThrees >= 2) risk += 5000;
    if (potentialFours >= 2) risk += 10000;
    
    return risk;
}

// 检查某个位置是否会形成活三
function isLiveThree(row, col, player, tempBoard) {
    const directions = [
        { dr: 0, dc: 1 },  // Horizontal
        { dr: 1, dc: 0 },  // Vertical
        { dr: 1, dc: 1 },  // Diagonal \ 
        { dr: 1, dc: -1 }  // Diagonal / 
    ];
    
    for (const { dr, dc } of directions) {
        let count = 1;
        let leftOpen = false, rightOpen = false;
        
        // 检查左侧
        let leftCount = 0;
        for (let i = 1; i <= 4; i++) {
            const r = row - dr * i;
            const c = col - dc * i;
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
                if (tempBoard[r][c] === player) {
                    leftCount++;
                } else if (tempBoard[r][c] === 0 && i === leftCount + 1) {
                    leftOpen = true;
                    break;
                } else {
                    break;
                }
            } else {
                break;
            }
        }
        
        // 检查右侧
        let rightCount = 0;
        for (let i = 1; i <= 4; i++) {
            const r = row + dr * i;
            const c = col + dc * i;
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
                if (tempBoard[r][c] === player) {
                    rightCount++;
                } else if (tempBoard[r][c] === 0 && i === rightCount + 1) {
                    rightOpen = true;
                    break;
                } else {
                    break;
                }
            } else {
                break;
            }
        }
        
        count += leftCount + rightCount;
        
        // 活三：正好3个子且两端都开放
        if (count === 3 && leftOpen && rightOpen) {
            return true;
        }
    }
    return false;
}

// 检查某个位置是否会形成活四或冲四
function isFourPattern(row, col, player, tempBoard) {
    const directions = [
        { dr: 0, dc: 1 },  // Horizontal
        { dr: 1, dc: 0 },  // Vertical
        { dr: 1, dc: 1 },  // Diagonal \ 
        { dr: 1, dc: -1 }  // Diagonal / 
    ];
    
    for (const { dr, dc } of directions) {
        let count = 1;
        let openEnds = 0;
        
        // 检查左侧
        let leftCount = 0;
        for (let i = 1; i <= 4; i++) {
            const r = row - dr * i;
            const c = col - dc * i;
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
                if (tempBoard[r][c] === player) {
                    leftCount++;
                } else if (tempBoard[r][c] === 0 && i === leftCount + 1) {
                    openEnds++;
                    break;
                } else {
                    break;
                }
            } else {
                break;
            }
        }
        
        // 检查右侧
        let rightCount = 0;
        for (let i = 1; i <= 4; i++) {
            const r = row + dr * i;
            const c = col + dc * i;
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
                if (tempBoard[r][c] === player) {
                    rightCount++;
                } else if (tempBoard[r][c] === 0 && i === rightCount + 1) {
                    openEnds++;
                    break;
                } else {
                    break;
                }
            } else {
                break;
            }
        }
        
        count += leftCount + rightCount;
        
        // 四的模式：活四（两端开放）或冲四（至少一端开放）
        if (count === 4 && openEnds >= 1) {
            return { isFour: true, isLiveFour: openEnds === 2 };
        }
    }
    return { isFour: false, isLiveFour: false };
}

// 寻找四三胜的机会
function findFourThreeWin(player, tempBoard) {
    const moves = [];
    
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (tempBoard[r][c] === 0) {
                tempBoard[r][c] = player;
                
                // 检查是否会触发禁手
                const forbidden = checkForbiddenMove(r, c, player);
                if (!forbidden.isForbidden) {
                    const fourPattern = isFourPattern(r, c, player, tempBoard);
                    const liveThree = isLiveThree(r, c, player, tempBoard);
                    
                    // 寻找同时形成四和三的位置（四三胜）
                    if (fourPattern.isFour && liveThree) {
                        tempBoard[r][c] = 0;
                        return { row: r, col: c, priority: 1000 }; // 最高优先级
                    }
                    
                    // 寻找能形成活四的位置
                    if (fourPattern.isLiveFour) {
                        moves.push({ row: r, col: c, priority: 800 });
                    }
                    // 寻找能形成冲四的位置
                    else if (fourPattern.isFour) {
                        moves.push({ row: r, col: c, priority: 600 });
                    }
                    // 寻找能形成活三的位置
                    else if (liveThree) {
                        moves.push({ row: r, col: c, priority: 400 });
                    }
                }
                
                tempBoard[r][c] = 0;
            }
        }
    }
    
    // 返回优先级最高的移动
    if (moves.length > 0) {
        moves.sort((a, b) => b.priority - a.priority);
        return moves[0];
    }
    
    return null;
}

function findBestMoveForAI() {
    const aiPlayer = 2;
    const humanPlayer = 1;
    let moveCount = 0;
    
    // 计算总棋子数，判断游戏阶段
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] !== 0) moveCount++;
        }
    }
    
    // 开局策略（前几步）
    if (moveCount <= 4) {
        return getSafeOpeningMove();
    }
    
    // 1. 检查AI是否能赢（但避免禁手）
    const winMove = findWinningMove(aiPlayer);
    if (winMove && !checkForbiddenMove(winMove.row, winMove.col, aiPlayer).isForbidden) {
        return winMove;
    }
    
    // 2. 阻止对手的必胜走法
    const blockMove = findWinningMove(humanPlayer);
    if (blockMove && !checkForbiddenMove(blockMove.row, blockMove.col, aiPlayer).isForbidden) {
        return blockMove;
    }
    
    // 3. 尝试创建四三胜组合
    const fourThreeMove = findFourThreeMove();
    if (fourThreeMove) {
        return fourThreeMove;
    }
    
    // 4. 创建安全的威胁（冲四）
    const chongFourMove = findSafeChongFourMove();
    if (chongFourMove) {
        return chongFourMove;
    }
    
    // 5. 使用增强的评估与禁手避免
    return findBestSafeMove();
}

function getSafeOpeningMove() {
    const center = Math.floor(BOARD_SIZE / 2);
    
    // 天元（中心点）- 白棋先手优势
    if (board[center][center] === 0) {
        return { row: center, col: center };
    }
    
    // 八卦阵开局策略（马步位）
    const bagua = [
        // 日字步（马步）扩张
        { row: center - 2, col: center - 1 },
        { row: center - 2, col: center + 1 },
        { row: center - 1, col: center - 2 },
        { row: center - 1, col: center + 2 },
        { row: center + 1, col: center - 2 },
        { row: center + 1, col: center + 2 },
        { row: center + 2, col: center - 1 },
        { row: center + 2, col: center + 1 },
        // 星位
        { row: center - 3, col: center - 3 },
        { row: center - 3, col: center + 3 },
        { row: center + 3, col: center - 3 },
        { row: center + 3, col: center + 3 },
        { row: center, col: center - 3 },
        { row: center, col: center + 3 },
        { row: center - 3, col: center },
        { row: center + 3, col: center }
    ];
    
    // 检查是否存在对称开局
    if (isSymmetricOpening()) {
        // 如果对手模仿走位，使用剑阵或燕阵打破平衡
        return getAsymmetricMove();
    }
    
    // 尝试八卦阵位置
    for (const move of bagua) {
        if (move.row >= 0 && move.row < BOARD_SIZE && 
            move.col >= 0 && move.col < BOARD_SIZE && 
            board[move.row][move.col] === 0 &&
            !checkForbiddenMove(move.row, move.col, 2).isForbidden) {
            return move;
        }
    }
    
    // 如果八卦阵位置都不可用，尝试构建双二
    const doubleTwoMove = findDoubleTwoMove();
    if (doubleTwoMove) {
        return doubleTwoMove;
    }
    
    // 最后的备选方案
    return { row: center, col: center - 2 };
}

function findWinningMove(player) {
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === 0) {
                board[r][c] = player;
                if (checkWin(r, c, player, board)) {
                    board[r][c] = 0;
                    return { row: r, col: c };
                }
                board[r][c] = 0;
            }
        }
    }
    return null;
}

function findFourThreeMove() {
    const aiPlayer = 2;
    const humanPlayer = 1;
    let bestMove = null;
    let bestScore = -Infinity;
    
    // 1. 寻找四三组合（最高优先级）
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === 0) {
                // 检查是否是禁手
                if (checkForbiddenMove(r, c, aiPlayer).isForbidden) {
                    continue;
                }
                
                board[r][c] = aiPlayer;
                const patterns = analyzePattern(r, c, aiPlayer, board);
                
                // 计算该位置的综合得分
                let score = 0;
                
                // 四三组合（最高优先级）
                if ((patterns.liveFours >= 1 || patterns.chongFours >= 1) && patterns.liveThrees >= 1) {
                    score += 100000;
                }
                
                // 双冲四（次高优先级）
                if (patterns.chongFours >= 2) {
                    score += 80000;
                }
                
                // 活四（高优先级）
                if (patterns.liveFours >= 1) {
                    score += 50000;
                }
                
                // 冲四（中优先级）
                if (patterns.chongFours === 1) {
                    score += 10000;
                }
                
                // 双活三（中优先级）
                if (patterns.liveThrees >= 2) {
                    score += 8000;
                }
                
                // 活三（低优先级）
                if (patterns.liveThrees === 1) {
                    score += 5000;
                }
                
                // 优先使用斜线进攻（隐蔽性高）
                score += evaluateDiagonalThreat(r, c, aiPlayer) * 1000;
                
                // 检查是否能诱导对手触发禁手
                score += evaluateForbiddenTrap(r, c, humanPlayer) * 2000;
                
                board[r][c] = 0;
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = { row: r, col: c };
                }
            }
        }
    }
    
    return bestMove;
}

function findSafeChongFourMove() {
    const aiPlayer = 2;
    
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === 0) {
                if (checkForbiddenMove(r, c, aiPlayer).isForbidden) {
                    continue;
                }
                
                board[r][c] = aiPlayer;
                const patterns = analyzePattern(r, c, aiPlayer, board);
                board[r][c] = 0;
                
                // Create chong four (safe threat)
                if (patterns.chongFours >= 1) {
                    return { row: r, col: c };
                }
            }
        }
    }
    return null;
}

function findBestSafeMove() {
    let bestScore = -Infinity;
    let move = null;
    const aiPlayer = 2;
    const humanPlayer = 1;
    
    // 计算棋盘上的总棋子数，判断游戏阶段
    let moveCount = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] !== 0) moveCount++;
        }
    }
    
    // 残局策略（棋盘已有较多棋子）
    const isEndgame = moveCount > BOARD_SIZE * BOARD_SIZE * 0.6;
    
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === 0) {
                // 跳过禁手点
                if (checkForbiddenMove(r, c, aiPlayer).isForbidden) {
                    continue;
                }
                
                board[r][c] = aiPlayer;
                
                // 基础评分
                let currentScore = scorePositionAdvanced(board, aiPlayer, r, c);
                
                // 防守评分：检查这一步是否能阻止对手的威胁
                const defenseScore = evaluateDefensiveValue(r, c, humanPlayer);
                currentScore += defenseScore;
                
                // 八卦点（马步位）加分，用于分割棋盘
                const baguaScore = evaluateBaguaPoint(r, c);
                currentScore += baguaScore;
                
                // 残局策略：深度搜索VCT
                if (isEndgame) {
                    const vctScore = evaluateVCT(r, c, aiPlayer, 5); // 5步深度搜索
                    currentScore += vctScore;
                }
                
                board[r][c] = 0;
                
                if (currentScore > bestScore) {
                    bestScore = currentScore;
                    move = { row: r, col: c };
                }
            }
        }
    }
    
    // 如果没有找到安全的走法，选择一个随机的安全点
    if (!move) {
        const safeCells = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (board[r][c] === 0 && !checkForbiddenMove(r, c, aiPlayer).isForbidden) {
                    safeCells.push({ row: r, col: c });
                }
            }
        }
        if (safeCells.length > 0) {
            const randomIndex = Math.floor(Math.random() * safeCells.length);
            move = safeCells[randomIndex];
        }
    }
    
    return move;
}


// --- 辅助函数：增强AI策略 ---

// 检查是否存在对称开局
function isSymmetricOpening() {
    const center = Math.floor(BOARD_SIZE / 2);
    let blackCount = 0;
    let symmetricCount = 0;
    
    // 检查黑棋的数量
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === 1) { // 黑棋
                blackCount++;
                
                // 检查对称位置是否也有黑棋
                const symR = 2 * center - r;
                const symC = 2 * center - c;
                if (symR >= 0 && symR < BOARD_SIZE && symC >= 0 && symC < BOARD_SIZE && board[symR][symC] === 1) {
                    symmetricCount++;
                }
            }
        }
    }
    
    // 如果超过一半的黑棋形成对称，则认为是对称开局
    return blackCount >= 2 && symmetricCount >= blackCount / 2;
}

// 获取打破对称的走法（剑阵或燕阵）
function getAsymmetricMove() {
    const center = Math.floor(BOARD_SIZE / 2);
    
    // 剑阵（斜线活三）
    const swordFormation = [
        { row: center - 2, col: center - 2 },
        { row: center - 1, col: center - 1 },
        { row: center + 1, col: center + 1 },
        { row: center + 2, col: center + 2 },
        // 反方向
        { row: center - 2, col: center + 2 },
        { row: center - 1, col: center + 1 },
        { row: center + 1, col: center - 1 },
        { row: center + 2, col: center - 2 }
    ];
    
    // 燕阵
    const swallowFormation = [
        { row: center - 1, col: center },
        { row: center - 2, col: center - 1 },
        { row: center - 2, col: center + 1 },
        // 反向
        { row: center + 1, col: center },
        { row: center + 2, col: center - 1 },
        { row: center + 2, col: center + 1 }
    ];
    
    // 优先尝试剑阵（斜线活三威胁更大）
    for (const move of swordFormation) {
        if (move.row >= 0 && move.row < BOARD_SIZE && 
            move.col >= 0 && move.col < BOARD_SIZE && 
            board[move.row][move.col] === 0 &&
            !checkForbiddenMove(move.row, move.col, 2).isForbidden) {
            return move;
        }
    }
    
    // 然后尝试燕阵
    for (const move of swallowFormation) {
        if (move.row >= 0 && move.row < BOARD_SIZE && 
            move.col >= 0 && move.col < BOARD_SIZE && 
            board[move.row][move.col] === 0 &&
            !checkForbiddenMove(move.row, move.col, 2).isForbidden) {
            return move;
        }
    }
    
    // 如果都不可用，返回一个随机的非对称位置
    return { row: center - 1, col: center + 2 };
}

// 寻找能形成双二的位置
function findDoubleTwoMove() {
    const aiPlayer = 2;
    
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === 0) {
                if (checkForbiddenMove(r, c, aiPlayer).isForbidden) {
                    continue;
                }
                
                board[r][c] = aiPlayer;
                const liveTwos = countLiveTwos(r, c, aiPlayer);
                board[r][c] = 0;
                
                if (liveTwos >= 2) {
                    return { row: r, col: c };
                }
            }
        }
    }
    return null;
}

// 计算某个位置能形成的活二数量
function countLiveTwos(row, col, player) {
    const directions = [
        { dr: 0, dc: 1 },  // 水平
        { dr: 1, dc: 0 },  // 垂直
        { dr: 1, dc: 1 },  // 对角线 \ 
        { dr: 1, dc: -1 }  // 对角线 / 
    ];
    
    let liveTwoCount = 0;
    
    for (const { dr, dc } of directions) {
        // 检查是否形成活二
        let count = 1;
        let openEnds = 0;
        
        // 检查正方向
        let consecutiveStones = 0;
        for (let i = 1; i <= 2; i++) {
            const r = row + dr * i;
            const c = col + dc * i;
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
                if (board[r][c] === player) {
                    consecutiveStones++;
                    count++;
                } else if (board[r][c] === 0) {
                    if (consecutiveStones === 0) continue;
                    openEnds++;
                    break;
                } else {
                    break;
                }
            }
        }
        
        // 检查反方向
        consecutiveStones = 0;
        for (let i = 1; i <= 2; i++) {
            const r = row - dr * i;
            const c = col - dc * i;
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
                if (board[r][c] === player) {
                    consecutiveStones++;
                    count++;
                } else if (board[r][c] === 0) {
                    if (consecutiveStones === 0) continue;
                    openEnds++;
                    break;
                } else {
                    break;
                }
            }
        }
        
        // 活二：正好2个子且两端都开放
        if (count === 2 && openEnds === 2) {
            liveTwoCount++;
        }
    }
    
    return liveTwoCount;
}

// 评估斜线威胁
function evaluateDiagonalThreat(row, col, player) {
    const diagonalDirections = [
        { dr: 1, dc: 1 },  // 对角线 \ 
        { dr: 1, dc: -1 }  // 对角线 / 
    ];
    
    let diagonalThreatScore = 0;
    
    for (const { dr, dc } of diagonalDirections) {
        // 检查斜线方向的威胁
        let count = 1;
        let openEnds = 0;
        
        // 检查正方向
        for (let i = 1; i <= 4; i++) {
            const r = row + dr * i;
            const c = col + dc * i;
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
                if (board[r][c] === player) {
                    count++;
                } else if (board[r][c] === 0) {
                    openEnds++;
                    break;
                } else {
                    break;
                }
            }
        }
        
        // 检查反方向
        for (let i = 1; i <= 4; i++) {
            const r = row - dr * i;
            const c = col - dc * i;
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
                if (board[r][c] === player) {
                    count++;
                } else if (board[r][c] === 0) {
                    openEnds++;
                    break;
                } else {
                    break;
                }
            }
        }
        
        // 斜线活三
        if (count === 3 && openEnds === 2) {
            diagonalThreatScore += 3;
        }
        // 斜线活二
        else if (count === 2 && openEnds === 2) {
            diagonalThreatScore += 1;
        }
    }
    
    return diagonalThreatScore;
}

// 评估禁手陷阱
function evaluateForbiddenTrap(row, col, opponentPlayer) {
    let trapScore = 0;
    const aiPlayer = 2;
    
    // 检查周围的空位
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            
            const r = row + dr;
            const c = col + dc;
            
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === 0) {
                // 模拟AI在(row,col)落子
                board[row][col] = aiPlayer;
                
                // 检查这个位置对黑棋是否是禁手点
                const isForbidden = checkForbiddenMove(r, c, opponentPlayer).isForbidden;
                
                // 如果是禁手点，增加分数
                if (isForbidden) {
                    trapScore += 5;
                    
                    // 进一步检查这个禁手点是否会被迫走（例如，AI形成活三或冲四）
                    const patterns = analyzePattern(row, col, aiPlayer, board);
                    if (patterns.liveThrees > 0 || patterns.chongFours > 0) {
                        trapScore += 10; // 如果能迫使对手走入禁手点，分数更高
                    }
                }
                
                board[row][col] = 0;
            }
        }
    }
    
    return trapScore;
}

// 评估防守价值
function evaluateDefensiveValue(row, col, opponentPlayer) {
    let defenseScore = 0;
    const aiPlayer = 2;
    
    // 检查对手在此位置的威胁
    board[row][col] = opponentPlayer;
    const opponentPatterns = analyzePattern(row, col, opponentPlayer, board);
    board[row][col] = aiPlayer; // 恢复为AI的棋子
    
    // 阻止对手的活四
    if (opponentPatterns.liveFours > 0) {
        defenseScore += 50000;
    }
    
    // 阻止对手的冲四
    if (opponentPatterns.chongFours > 0) {
        defenseScore += 10000;
    }
    
    // 阻止对手的活三
    if (opponentPatterns.liveThrees > 0) {
        defenseScore += 5000;
    }
    
    // 阻止对手的活二
    if (opponentPatterns.liveTwos > 0) {
        defenseScore += 500;
    }
    
    // 以攻代守：检查这一步是否同时能形成我方的威胁
    const aiPatterns = analyzePattern(row, col, aiPlayer, board);
    
    // 如果这一步既能防守又能进攻，加分
    if ((opponentPatterns.liveThrees > 0 || opponentPatterns.chongFours > 0) && 
        (aiPatterns.liveThrees > 0 || aiPatterns.chongFours > 0)) {
        defenseScore += 8000; // 以攻代守
    }
    
    return defenseScore;
}

// 评估八卦点（马步位）
function evaluateBaguaPoint(row, col) {
    const center = Math.floor(BOARD_SIZE / 2);
    
    // 马步位（日字形）
    const baguaPoints = [
        { dr: -2, dc: -1 }, { dr: -2, dc: 1 },
        { dr: -1, dc: -2 }, { dr: -1, dc: 2 },
        { dr: 1, dc: -2 }, { dr: 1, dc: 2 },
        { dr: 2, dc: -1 }, { dr: 2, dc: 1 }
    ];
    
    // 检查是否是八卦点
    for (const { dr, dc } of baguaPoints) {
        const r = center + dr;
        const c = center + dc;
        if (row === r && col === c) {
            return 300; // 八卦点加分
        }
    }
    
    return 0;
}

// 评估VCT（连续威胁取胜）
function evaluateVCT(row, col, player, depth) {
    if (depth <= 0) return 0;
    
    const opponent = player === 1 ? 2 : 1;
    let vctScore = 0;
    
    // 检查这一步是否形成威胁
    board[row][col] = player;
    const patterns = analyzePattern(row, col, player, board);
    
    // 如果形成活四，几乎必胜
    if (patterns.liveFours > 0) {
        vctScore += 100000;
    }
    // 如果形成冲四
    else if (patterns.chongFours > 0) {
        // 找出所有对手必须防守的点
        const forcedResponses = findForcedResponses(player);
        
        if (forcedResponses.length === 0) {
            // 对手无法防守
            vctScore += 90000;
        } else {
            // 对手有防守点，但我们可以继续威胁
            let maxChildScore = 0;
            
            for (const response of forcedResponses) {
                board[response.row][response.col] = opponent;
                
                // 寻找下一步威胁
                const nextThreats = findThreateningMoves(player, depth - 1);
                
                if (nextThreats.length > 0) {
                    let maxThreatScore = 0;
                    for (const threat of nextThreats) {
                        const threatScore = evaluateVCT(threat.row, threat.col, player, depth - 1);
                        maxThreatScore = Math.max(maxThreatScore, threatScore);
                    }
                    maxChildScore = Math.max(maxChildScore, maxThreatScore);
                }
                
                board[response.row][response.col] = 0; // 恢复
            }
            
            vctScore += maxChildScore * 0.9; // 折扣因子
        }
    }
    // 如果形成活三
    else if (patterns.liveThrees > 0) {
        vctScore += 5000 + evaluateVCT(row, col, player, depth - 1) * 0.8;
    }
    
    board[row][col] = 0; // 恢复
    return vctScore;
}

// 寻找对手被迫的应对点
function findForcedResponses(player) {
    const opponent = player === 1 ? 2 : 1;
    const responses = [];
    
    // 寻找对手必须防守的点（通常是阻止冲四或活四）
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === 0) {
                board[r][c] = player;
                if (checkWin(r, c, player, board)) {
                    responses.push({ row: r, col: c });
                }
                board[r][c] = 0;
            }
        }
    }
    
    return responses;
}

// 寻找威胁性走法
function findThreateningMoves(player, depth) {
    if (depth <= 0) return [];
    
    const threats = [];
    
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === 0) {
                board[r][c] = player;
                const patterns = analyzePattern(r, c, player, board);
                
                // 威胁性走法：形成活四、冲四或活三
                if (patterns.liveFours > 0 || patterns.chongFours > 0 || patterns.liveThrees > 0) {
                    threats.push({ 
                        row: r, 
                        col: c, 
                        score: patterns.liveFours * 100 + patterns.chongFours * 10 + patterns.liveThrees 
                    });
                }
                
                board[r][c] = 0;
            }
        }
    }
    
    // 按威胁程度排序
    threats.sort((a, b) => b.score - a.score);
    
    // 只返回前几个最具威胁的走法
    return threats.slice(0, 5);
}

// --- Event Listeners ---
canvas.addEventListener('click', handleBoardClick);
resetButton.addEventListener('click', initGame);

// --- Start Game ---
initGame();

console.log("五子棋脚本已加载。棋盘大小: " + BOARD_SIZE + "x" + BOARD_SIZE + ", 单元格大小: " + CELL_SIZE);
console.log("AI策略已增强：包含开局八卦阵、中局四三胜、防守策略和残局VCT算法");
