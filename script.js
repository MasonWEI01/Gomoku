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
    
    // Count total moves to determine game phase
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] !== 0) moveCount++;
        }
    }
    
    // Opening strategy - safe positions
    if (moveCount <= 2) {
        return getSafeOpeningMove();
    }
    
    // 1. Check if AI can win (but avoid forbidden moves)
    const winMove = findWinningMove(aiPlayer);
    if (winMove && !checkForbiddenMove(winMove.row, winMove.col, aiPlayer).isForbidden) {
        return winMove;
    }
    
    // 2. Block opponent's winning moves
    const blockMove = findWinningMove(humanPlayer);
    if (blockMove && !checkForbiddenMove(blockMove.row, blockMove.col, aiPlayer).isForbidden) {
        return blockMove;
    }
    
    // 3. Try to create 4-3 winning combinations
    const fourThreeMove = findFourThreeMove();
    if (fourThreeMove) {
        return fourThreeMove;
    }
    
    // 4. Create safe threats (chong fours)
    const chongFourMove = findSafeChongFourMove();
    if (chongFourMove) {
        return chongFourMove;
    }
    
    // 5. Use enhanced evaluation with forbidden move avoidance
    return findBestSafeMove();
}

function getSafeOpeningMove() {
    const center = Math.floor(BOARD_SIZE / 2);
    
    // First move: center
    if (board[center][center] === 0) {
        return { row: center, col: center };
    }
    
    // Safe opening patterns (Huayue, Puyue style)
    const safeOpenings = [
        { row: center - 1, col: center - 1 },
        { row: center + 1, col: center + 1 },
        { row: center - 1, col: center + 1 },
        { row: center + 1, col: center - 1 },
        { row: center, col: center - 1 },
        { row: center, col: center + 1 },
        { row: center - 1, col: center },
        { row: center + 1, col: center }
    ];
    
    for (const move of safeOpenings) {
        if (move.row >= 0 && move.row < BOARD_SIZE && 
            move.col >= 0 && move.col < BOARD_SIZE && 
            board[move.row][move.col] === 0 &&
            !checkForbiddenMove(move.row, move.col, 2).isForbidden) {
            return move;
        }
    }
    
    return { row: center, col: center - 2 }; // Fallback
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
    
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === 0) {
                // Check if this move is forbidden
                if (checkForbiddenMove(r, c, aiPlayer).isForbidden) {
                    continue;
                }
                
                board[r][c] = aiPlayer;
                const patterns = analyzePattern(r, c, aiPlayer, board);
                board[r][c] = 0;
                
                // 4-3 combination: one chong four + one live three
                // or live four + live three (but live four usually wins immediately)
                if ((patterns.chongFours >= 1 && patterns.liveThrees >= 1) ||
                    (patterns.liveFours >= 1 && patterns.liveThrees >= 1)) {
                    return { row: r, col: c };
                }
                
                // Double chong four is also very strong
                if (patterns.chongFours >= 2) {
                    return { row: r, col: c };
                }
            }
        }
    }
    return null;
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
    
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === 0) {
                // Skip forbidden moves
                if (checkForbiddenMove(r, c, aiPlayer).isForbidden) {
                    continue;
                }
                
                board[r][c] = aiPlayer;
                let currentScore = scorePositionAdvanced(board, aiPlayer, r, c);
                board[r][c] = 0;
                
                if (currentScore > bestScore) {
                    bestScore = currentScore;
                    move = { row: r, col: c };
                }
            }
        }
    }
    
    // If no safe move found, pick a random safe one
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


// --- Event Listeners ---
canvas.addEventListener('click', handleBoardClick);
resetButton.addEventListener('click', initGame);

// --- Start Game ---
initGame();

console.log("五子棋脚本已加载。棋盘大小: " + BOARD_SIZE + "x" + BOARD_SIZE + ", 单元格大小: " + CELL_SIZE);
