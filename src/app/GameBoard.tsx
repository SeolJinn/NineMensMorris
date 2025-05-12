"use client";

import React, { useState } from 'react';
import styles from './GameBoard.module.css';
import { positions, connections } from './gameData';
import { initialGameState, placePiece, movePiece, removeOpponentPiece, GameState } from './gameLogic';

const GameBoard = () => {  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [millMessage, setMillMessage] = useState<string | null>(null);  const handlePlaceOrMovePiece = (index: number): void => {
    // If game is over, don't allow any moves
    if (gameState.gameOver) {
      return;
    }
    
    if (gameState.canRemoveOpponentPiece) {
      const opponentPlayer = gameState.currentPlayer === 'Player 1' ? 'Player 2' : 'Player 1';
      
      // Ensure the selected piece belongs to the opponent
      if (gameState.board[index] !== opponentPlayer) {
        setMillMessage('You must remove an opponent piece!');
        return;
      }

      // Remove opponent's piece using the game logic function
      const newState = removeOpponentPiece(gameState, index);
      
      // Check if the piece was actually removed (state changed)
      if (newState.board[index] === null) {
        setGameState({ ...newState, canRemoveOpponentPiece: false }); // Reset the flag after removal
        setMillMessage(null); // Clear the mill message after removing an opponent's piece
      } else {
        // The piece wasn't removed - it must be in a mill
        setMillMessage("You can't remove a piece that's in a mill unless there are no other options.");
      }
      return;
    }

    if (!gameState.placementPhaseOver) {
      // Placement phase
      const result = placePiece(gameState, index);
      
      if (result.actionTookPlace) {
        if (result.millJustFormed) {
          setMillMessage(`${result.newState.currentPlayer} formed a mill! Remove an opponent's piece.`);
        } else {
          setMillMessage(null);
        }
        setGameState(result.newState);
      }    } else {
      // Movement phase
      if (selectedPiece === null) {
        // Select a piece to move
        if (gameState.board[index] === gameState.currentPlayer) {
          setSelectedPiece(index);
        }
      } else if (selectedPiece === index) {
        // If the same piece is clicked again, deselect it
        setSelectedPiece(null);
      } else if (gameState.board[index] === gameState.currentPlayer) {
        // If another piece of the same player is clicked, select that piece instead
        setSelectedPiece(index);
      } else {
        // Try to move the selected piece
        const result = movePiece(gameState, selectedPiece, index);
        
        if (result.actionTookPlace) {
          if (result.millJustFormed) {
            setMillMessage(`${result.newState.currentPlayer} formed a mill! Remove an opponent's piece.`);
          } else {
            setMillMessage(null);
          }
          setGameState(result.newState);
          setSelectedPiece(null); // Deselect the piece after moving
        }
      }
    }
  };

  const { board, currentPlayer } = gameState;

  const renderLines = () => (
    <>
      {connections.map(([start, end], index) => {
        const startX = positions[start].x * 60 + 20;
        const startY = positions[start].y * 60 + 20;
        const endX = positions[end].x * 60 + 20;
        const endY = positions[end].y * 60 + 20;

        return (
          <line
            key={index}
            x1={startX}
            y1={startY}
            x2={endX}
            y2={endY}
            stroke="#fff"
            strokeWidth="2"
          />
        );
      })}
    </>
  );
  const renderGameInfo = () => {
    // Count the number of pieces each player has on the board
    const player1PiecesOnBoard = gameState.board.filter(cell => cell === 'Player 1').length;
    const player2PiecesOnBoard = gameState.board.filter(cell => cell === 'Player 2').length;
    
    // Determine the current phase
    let phase = 'Placement';
    if (gameState.placementPhaseOver) {
      phase = player1PiecesOnBoard === 3 || player2PiecesOnBoard === 3 ? 'Flying' : 'Movement';
    }
    
    return (
      <div className={styles.gameInfo}>
        <h2>Game Information</h2>
        {gameState.gameOver ? (
          <div className={styles.gameOverMessage}>
            <h3>Game Over!</h3>
            <p>{gameState.winner} wins!</p>
          </div>
        ) : (
          <>
            <p>Phase: {phase}</p>
            <p>Current Turn: {currentPlayer}</p>
            {millMessage && <p className={styles.millMessage}>{millMessage}</p>}            
            {phase === 'Flying' && (
              <p className={styles.flyingMessage}>
                {player1PiecesOnBoard === 3 && player2PiecesOnBoard === 3
                  ? 'Both players can fly!'
                  : player1PiecesOnBoard === 3
                  ? 'Player 1 can fly!'
                  : 'Player 2 can fly!'} 
                (Move to any vacant position)
              </p>
            )}
          </>
        )}
        <table>
          <thead>
            <tr>
              <th>Player</th>
              <th>Pieces Left</th>
              <th>{gameState.placementPhaseOver ? 'Pieces on Board' : 'Mills Left To Place'}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Player 1</td>
              <td>{gameState.player1Pieces}</td>
              <td>{gameState.placementPhaseOver ? player1PiecesOnBoard : gameState.player1MillsLeftToPlace}</td>
            </tr>
            <tr>
              <td>Player 2</td>
              <td>{gameState.player2Pieces}</td>
              <td>{gameState.placementPhaseOver ? player2PiecesOnBoard : gameState.player2MillsLeftToPlace}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      {renderGameInfo()}
      <svg className={styles.board} viewBox="0 0 420 420">
        {renderLines()}
        {positions.map((pos) => (
          <circle
            key={pos.id}
            cx={pos.x * 60 + 20}
            cy={pos.y * 60 + 20}
            r="20"
            className={`${styles.cell} ${board[pos.id] === 'Player 1' ? styles.player1 : ''} ${board[pos.id] === 'Player 2' ? styles.player2 : ''} ${selectedPiece === pos.id ? styles.selected : ''}`}
            onClick={() => handlePlaceOrMovePiece(pos.id)}
          />
        ))}
      </svg>
    </div>
  );
};

export default GameBoard;
