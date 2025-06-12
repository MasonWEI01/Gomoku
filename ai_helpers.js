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

// 禁手诱导防御 - 强化版
function evaluateForbiddenTrap(row, col, opponentPlayer) {
    let trapScore = 0;
    const aiPlayer = 2;
    
    // 检查是否能设置禁手陷阱
    const trapResult = setForbiddenTrap(row, col, opponentPlayer);
    if (trapResult.canTrap) {
        trapScore += 20000; // 成功设置禁手陷阱的高分奖励
        
        // 如果能迫使对手走入禁手点，额外加分
        if (trapResult.isForced) {
            trapScore += 15000;
        }
    }
    
    // 检查周围的空位是否会成为禁手点
    for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
            if (dr === 0 && dc === 0) continue;
            
            const r = row + dr;
            const c = col + dc;
            
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === 0) {
                // 模拟AI在(row,col)落子
                board[row][col] = aiPlayer;
                
                // 检查这个位置对黑棋是否是禁手点
                const forbidden = checkForbiddenMove(r, c, opponentPlayer);
                
                if (forbidden.isForbidden) {
                    // 根据禁手类型给予不同分数
                    if (forbidden.type === 'Double Three') {
                        trapScore += 8000; // 双三禁手陷阱
                    } else if (forbidden.type === 'Double Four') {
                        trapScore += 12000; // 双四禁手陷阱
                    } else if (forbidden.type === 'Long Connection') {
                        trapScore += 5000; // 长连禁手陷阱
                    }
                    
                    // 检查是否能通过威胁迫使对手走入禁手点
                    const patterns = analyzePattern(row, col, aiPlayer, board);
                    if (patterns.liveThrees > 0 || patterns.chongFours > 0) {
                        trapScore += 10000; // 威胁性禁手陷阱
                    }
                }
                
                board[row][col] = 0;
            }
        }
    }
    
    return trapScore;
}

// 设置禁手陷阱
function setForbiddenTrap(row, col, opponentPlayer) {
    const aiPlayer = 2;
    const FORBIDDEN_PATTERNS = [
        // 双三禁手模式
        { pattern: 'double_three', priority: 90 },
        // 双四禁手模式  
        { pattern: 'double_four', priority: 95 },
        // 长连禁手模式
        { pattern: 'long_connection', priority: 80 }
    ];
    
    for (const forbiddenPattern of FORBIDDEN_PATTERNS) {
        const trapPoint = matchForbiddenPattern(row, col, forbiddenPattern, opponentPlayer);
        if (trapPoint) {
            // 制造诱导性威胁
            const canForce = makeDecoyThreat(row, col, trapPoint, aiPlayer);
            return {
                canTrap: true,
                isForced: canForce,
                trapPoint: trapPoint,
                pattern: forbiddenPattern.pattern
            };
        }
    }
    
    return { canTrap: false, isForced: false };
}

// 匹配禁手模式
function matchForbiddenPattern(row, col, pattern, opponentPlayer) {
    // 简化版：检查周围是否存在可能形成禁手的结构
    const directions = [
        { dr: 0, dc: 1 },  // 水平
        { dr: 1, dc: 0 },  // 垂直
        { dr: 1, dc: 1 },  // 对角线 \
        { dr: 1, dc: -1 }  // 对角线 /
    ];
    
    for (let tr = row - 2; tr <= row + 2; tr++) {
        for (let tc = col - 2; tc <= col + 2; tc++) {
            if (tr >= 0 && tr < BOARD_SIZE && tc >= 0 && tc < BOARD_SIZE && board[tr][tc] === 0) {
                // 检查在这个位置落子是否会形成禁手
                const forbidden = checkForbiddenMove(tr, tc, opponentPlayer);
                if (forbidden.isForbidden && 
                    ((pattern.pattern === 'double_three' && forbidden.type === 'Double Three') ||
                     (pattern.pattern === 'double_four' && forbidden.type === 'Double Four') ||
                     (pattern.pattern === 'long_connection' && forbidden.type === 'Long Connection'))) {
                    return { row: tr, col: tc };
                }
            }
        }
    }
    
    return null;
}

// 制造诱导性威胁
function makeDecoyThreat(row, col, trapPoint, aiPlayer) {
    // 检查AI在(row,col)落子是否能形成威胁，迫使对手防守到禁手点
    board[row][col] = aiPlayer;
    const patterns = analyzePattern(row, col, aiPlayer, board);
    board[row][col] = 0;
    
    // 如果能形成活三或冲四，且禁手点在防守路径上，则认为可以迫使
    if (patterns.liveThrees > 0 || patterns.chongFours > 0) {
        // 简化判断：如果禁手点在附近，认为有可能迫使对手走入
        const distance = Math.abs(row - trapPoint.row) + Math.abs(col - trapPoint.col);
        return distance <= 3;
    }
    
    return false;
}

// 动态威胁评估系统 - 三级威胁预警机制
const THREAT_LEVEL = {
    "L5": 99999,      // 黑棋已有四连（必堵）
    "L4": 5000,       // 黑棋活三/冲四
    "L3": 300,        // 黑棋双活二/潜在活三
    "L2": 50          // 黑棋单活二
};

// 评估防守价值 - 强化版攻防一体化策略
function evaluateDefensiveValue(row, col, opponentPlayer) {
    let defenseScore = 0;
    const aiPlayer = 2;
    
    // 检查对手在此位置的威胁
    board[row][col] = opponentPlayer;
    const opponentPatterns = analyzePattern(row, col, opponentPlayer, board);
    board[row][col] = 0; // 先恢复空位
    
    // 动态威胁评估 - 按威胁等级分配权重
    const threatLevel = calculateThreatLevel(opponentPatterns);
    
    // L5级威胁：阻断活四（绝对优先）
    if (opponentPatterns.liveFours > 0) {
        defenseScore += THREAT_LEVEL.L5;
    }
    
    // L4级威胁：阻断冲四和活三
    if (opponentPatterns.chongFours > 0) {
        defenseScore += THREAT_LEVEL.L4;
    }
    if (opponentPatterns.liveThrees > 0) {
        defenseScore += THREAT_LEVEL.L4;
        // 双重封锁：检查是否能同时阻断多条发展线
        defenseScore += evaluateQuantumDefense(row, col, opponentPlayer);
    }
    
    // L3级威胁：阻断双活二和潜在活三
    if (opponentPatterns.liveTwos >= 2) {
        defenseScore += THREAT_LEVEL.L3;
    }
    
    // L2级威胁：阻断单活二
    if (opponentPatterns.liveTwos === 1) {
        defenseScore += THREAT_LEVEL.L2;
    }
    
    // 现在检查AI在此位置的进攻价值
    board[row][col] = aiPlayer;
    const aiPatterns = analyzePattern(row, col, aiPlayer, board);
    board[row][col] = 0; // 恢复
    
    // 攻防一体化：进攻式防守加分
    if ((opponentPatterns.liveThrees > 0 || opponentPatterns.chongFours > 0) && 
        (aiPatterns.liveThrees > 0 || aiPatterns.chongFours > 0)) {
        defenseScore += 15000; // 阻断时永远保持"一石三鸟"思维
    }
    
    // 蜘蛛网防御矩阵：在关键控制点落子
    defenseScore += buildSpiderWebDefense(row, col, opponentPlayer);
    
    return defenseScore;
}

// 计算威胁等级
function calculateThreatLevel(patterns) {
    if (patterns.liveFours > 0) return "L5";
    if (patterns.chongFours > 0 || patterns.liveThrees > 0) return "L4";
    if (patterns.liveTwos >= 2) return "L3";
    if (patterns.liveTwos === 1) return "L2";
    return "L1";
}

// 量子纠缠防守 - 同时阻断多条发展线
function evaluateQuantumDefense(row, col, opponentPlayer) {
    let quantumScore = 0;
    const directions = [
        { dr: 0, dc: 1 },  // 水平
        { dr: 1, dc: 0 },  // 垂直
        { dr: 1, dc: 1 },  // 对角线 \
        { dr: 1, dc: -1 }  // 对角线 /
    ];
    
    let blockedLines = 0;
    
    for (const { dr, dc } of directions) {
        // 检测这个位置是否能阻断对手在该方向的发展
        if (canBlockDevelopmentLine(row, col, dr, dc, opponentPlayer)) {
            blockedLines++;
        }
    }
    
    // 同时阻断3条以上发展线时给予量子纠缠奖励
    if (blockedLines >= 3) {
        quantumScore += 8000; // 量子纠缠防守奖励
    } else if (blockedLines >= 2) {
        quantumScore += 3000; // 双向阻断奖励
    }
    
    return quantumScore;
}

// 检查是否能阻断发展线
function canBlockDevelopmentLine(row, col, dr, dc, opponentPlayer) {
    // 检查在该方向上是否存在对手的棋子形成威胁
    let hasOpponentStones = false;
    let potentialLength = 0;
    
    // 检查正方向
    for (let i = 1; i <= 4; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
            if (board[r][c] === opponentPlayer) {
                hasOpponentStones = true;
                potentialLength++;
            } else if (board[r][c] === 0) {
                potentialLength++;
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
            if (board[r][c] === opponentPlayer) {
                hasOpponentStones = true;
                potentialLength++;
            } else if (board[r][c] === 0) {
                potentialLength++;
            } else {
                break;
            }
        }
    }
    
    // 如果有对手棋子且潜在长度足够形成五连，则认为可以阻断
    return hasOpponentStones && potentialLength >= 3;
}

// 蜘蛛网防御矩阵
function buildSpiderWebDefense(row, col, opponentPlayer) {
    let spiderScore = 0;
    
    // 检测所有可能发展成五连的方向
    const directions = [
        { dr: 0, dc: 1 },  // 水平
        { dr: 1, dc: 0 },  // 垂直
        { dr: 1, dc: 1 },  // 对角线 \
        { dr: 1, dc: -1 }  // 对角线 /
    ];
    
    for (const { dr, dc } of directions) {
        const threatPath = detectThreatPath(row, col, dr, dc, opponentPlayer, 5);
        if (threatPath.length >= 3) { // 三连以上威胁
            // 在路径"七寸位"落子（关键控制点）
            const criticalPoint = calcCriticalNode(threatPath, row, col);
            if (criticalPoint.isCritical) {
                spiderScore += 2000; // 关键控制点高分
            }
        }
    }
    
    return spiderScore;
}

// 检测威胁路径
function detectThreatPath(row, col, dr, dc, player, maxLength) {
    const path = [];
    
    // 检查正方向
    for (let i = 1; i <= maxLength; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
            if (board[r][c] === player || board[r][c] === 0) {
                path.push({ r, c, value: board[r][c] });
            } else {
                break;
            }
        }
    }
    
    // 检查反方向
    for (let i = 1; i <= maxLength; i++) {
        const r = row - dr * i;
        const c = col - dc * i;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
            if (board[r][c] === player || board[r][c] === 0) {
                path.unshift({ r, c, value: board[r][c] });
            } else {
                break;
            }
        }
    }
    
    return path;
}

// 计算关键控制节点
function calcCriticalNode(threatPath, currentRow, currentCol) {
    // 简化版：如果当前位置在威胁路径的中心区域，则认为是关键点
    const pathLength = threatPath.length;
    const centerStart = Math.floor(pathLength * 0.3);
    const centerEnd = Math.floor(pathLength * 0.7);
    
    for (let i = centerStart; i <= centerEnd; i++) {
        if (threatPath[i] && threatPath[i].r === currentRow && threatPath[i].c === currentCol) {
            return { isCritical: true, index: i };
        }
    }
    
    return { isCritical: false, index: -1 };
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
