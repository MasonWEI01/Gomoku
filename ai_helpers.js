// 辅助函数：检查是否存在对称开局
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