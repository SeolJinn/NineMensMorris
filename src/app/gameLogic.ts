import { connections, mills } from './gameData';

export const initialGameState: GameState = {
  player1Pieces: 9, // Total pieces Player 1 can place
  player2Pieces: 9, // Total pieces Player 2 can place
  currentPlayer: 'Player 1',
  board: Array(24).fill(null), // Represents the board state
  placementPhaseOver: false, // Initial state of placement phase
  canRemoveOpponentPiece: false, // Initial state for removing opponent's piece
  player1MillsLeftToPlace: 9, // Initial mills left to place for Player 1
  player2MillsLeftToPlace: 9, // Initial mills left to place for Player 2
  player1MillsInGame: 0, // Initial mills in game for Player 1
  player2MillsInGame: 0, // Initial mills in game for Player 2
  gameOver: false, // Game is not over initially
  winner: null, // No winner initially
};

export interface GameState {
    player1Pieces: number;
    player2Pieces: number;
    currentPlayer: 'Player 1' | 'Player 2';
    board: (null | 'Player 1' | 'Player 2')[];
    placementPhaseOver: boolean; // Flag to indicate the end of the placement phase
    canRemoveOpponentPiece: boolean; // Flag to indicate if the player can remove an opponent's piece
    player1MillsLeftToPlace: number; // Mills left to place for Player 1 during placement phase
    player2MillsLeftToPlace: number; // Mills left to place for Player 2 during placement phase
    player1MillsInGame: number; // Mills Player 1 has in the game
    player2MillsInGame: number; // Mills Player 2 has in the game
    gameOver: boolean; // Flag to indicate if the game is over
    winner: 'Player 1' | 'Player 2' | null; // The winner of the game, null if game is not over
}

export interface ActionOutcome {
    newState: GameState;
    millJustFormed: boolean;
    actionTookPlace: boolean;
}

export const placePiece = (state: GameState, index: number): ActionOutcome => {
    const { currentPlayer, board, player1Pieces, player2Pieces } = state;

    // Prevent placing on an occupied spot
    if (board[index] !== null) {
        return {
            newState: state,
            millJustFormed: false,
            actionTookPlace: false
        };
    }

    // Prevent placing if no pieces are left for the current player
    if (
        (currentPlayer === 'Player 1' && player1Pieces === 0) ||
        (currentPlayer === 'Player 2' && player2Pieces === 0)
    ) {
        return {
            newState: state,
            millJustFormed: false,
            actionTookPlace: false
        };
    }

    // Update the board
    const newBoard = [...board];
    newBoard[index] = currentPlayer;

    // Check if a mill was formed by this placement
    const millJustFormed = checkMillFormed({ ...state, board: newBoard }, index);

    // Update the number of pieces left for the current player
    const newPlayer1Pieces =
        currentPlayer === 'Player 1' ? player1Pieces - 1 : player1Pieces;
    const newPlayer2Pieces =
        currentPlayer === 'Player 2' ? player2Pieces - 1 : player2Pieces;

    // Switch to the other player only if no mill was formed
    const nextPlayer = millJustFormed
      ? currentPlayer
      : currentPlayer === 'Player 1'
      ? 'Player 2'
      : 'Player 1';

    // Check if the placement phase is over
    const placementPhaseOver = newPlayer1Pieces === 0 && newPlayer2Pieces === 0;

    return {
        newState: {
            ...state,
            board: newBoard,
            player1Pieces: newPlayer1Pieces,
            player2Pieces: newPlayer2Pieces,
            currentPlayer: nextPlayer,
            placementPhaseOver,
            canRemoveOpponentPiece: millJustFormed
        },
        millJustFormed,
        actionTookPlace: true
    };
};

export const movePiece = (state: GameState, fromIndex: number, toIndex: number): ActionOutcome => {
    const { currentPlayer, board, placementPhaseOver } = state;

    // Ensure the placement phase is over
    if (!placementPhaseOver) {
        return {
            newState: state,
            millJustFormed: false,
            actionTookPlace: false
        };
    }

    // Validate the move
    if (board[fromIndex] !== currentPlayer || board[toIndex] !== null) {
        return {
            newState: state,
            millJustFormed: false,
            actionTookPlace: false
        };
    }

    // Prevent moving a piece to the same position
    if (fromIndex === toIndex) {
        return {
            newState: state,
            millJustFormed: false,
            actionTookPlace: false
        };
    }

    // Count how many pieces the current player has on the board
    const playerPiecesCount = board.filter(cell => cell === currentPlayer).length;

    // If the player has exactly 3 pieces, they can fly (move to any vacant spot)
    // Otherwise, check if the positions are connected
    const isValidMove = playerPiecesCount === 3 || connections.some((connection) => {
        const [start, end] = connection;
        return (
            (start === fromIndex && end === toIndex) ||
            (start === toIndex && end === fromIndex)
        );
    });

    if (!isValidMove) {
        return {
            newState: state,
            millJustFormed: false,
            actionTookPlace: false
        };
    }

    // Update the board
    const newBoard = [...board];
    newBoard[fromIndex] = null;
    newBoard[toIndex] = currentPlayer;

    // Check if a mill was formed by this move
    const millJustFormed = checkMillFormed({ ...state, board: newBoard }, toIndex);

    // Switch to the other player only if no mill was formed
    const nextPlayer = millJustFormed
      ? currentPlayer
      : currentPlayer === 'Player 1'
      ? 'Player 2'
      : 'Player 1';

    return {
        newState: {
            ...state,
            board: newBoard,
            currentPlayer: nextPlayer,
            canRemoveOpponentPiece: millJustFormed
        },
        millJustFormed,
        actionTookPlace: true
    };
};

export const checkMillFormed = (state: GameState, index: number): boolean => {
    const { board, currentPlayer } = state;

    // Check if the current index is part of any mill
    return mills.some((mill) => {
        if (!mill.includes(index)) return false;

        // Check if all positions in the mill belong to the current player
        return mill.every((pos) => board[pos] === currentPlayer);
    });
};

export const removeOpponentPiece = (state: GameState, index: number): GameState => {
    const { board, currentPlayer, placementPhaseOver } = state;
    const opponentPlayer = currentPlayer === 'Player 1' ? 'Player 2' : 'Player 1';

    // Ensure the piece belongs to the opponent and the position is not empty
    if (board[index] !== opponentPlayer || board[index] === null) {
        return state;
    }

    // Check if the piece is part of a mill
    const isPartOfMill = mills.some(mill => 
        mill.includes(index) && mill.every(pos => board[pos] === opponentPlayer)
    );

    if (isPartOfMill) {
        // Count opponent's pieces on the board
        const opponentPiecesCount = board.filter(cell => cell === opponentPlayer).length;
        
        // Count how many of opponent's pieces are part of mills
        let opponentPiecesInMills = 0;
        const occupiedPositions = new Set();
        
        mills.forEach(mill => {
            if (mill.every(pos => board[pos] === opponentPlayer)) {
                mill.forEach(pos => {
                    if (!occupiedPositions.has(pos)) {
                        occupiedPositions.add(pos);
                        opponentPiecesInMills++;
                    }
                });
            }
        });

        // If opponent has more than 3 pieces and not all are in mills, prevent removing this piece
        if (opponentPiecesCount > 3 && opponentPiecesCount > opponentPiecesInMills) {
            return state;
        }
    }

    // Remove the opponent's piece
    const newBoard = [...board];
    newBoard[index] = null;

    // Only check for game over conditions if the placement phase is complete
    let gameOver = false;
    let winner = null;
    
    if (placementPhaseOver) {
        // Count how many pieces the opponent has after removal
        const opponentPiecesCount = newBoard.filter(cell => cell === opponentPlayer).length;
        
        // Check if the game is over (opponent has fewer than 3 pieces)
        if (opponentPiecesCount < 3) {
            gameOver = true;
            winner = currentPlayer;
        }
    }

    // Switch to the other player after removing an opponent's piece
    const nextPlayer = opponentPlayer; // Switch to the opponent

    return {
        ...state,
        board: newBoard,
        currentPlayer: nextPlayer, // Update the current player
        gameOver,
        winner
    };
};