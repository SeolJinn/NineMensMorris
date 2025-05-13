"use client"

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useRouter, useSearchParams } from 'next/navigation';
import { GameState, initialGameState } from '../gameLogic';
import { createGameSession, getGameSession, updateGameSession, subscribeToGameSession } from './supabase';

type GameContextType = {
  gameState: GameState;
  sessionId: string | null;
  isHost: boolean;
  gameUrl: string | null;
  playerRole: 'Player 1' | 'Player 2' | 'Observer';
  isCreatingGame: boolean;
  isJoiningGame: boolean;
  updateGameState: (newState: GameState) => void;
  createNewSession: () => Promise<void>;
  joinSession: (id: string) => Promise<boolean>;
  copyGameLink: () => void;
};

export const GameContext = createContext<GameContextType>({
  gameState: initialGameState,
  sessionId: null,
  isHost: false,
  gameUrl: null,
  playerRole: 'Observer',
  isCreatingGame: false,
  isJoiningGame: false,
  updateGameState: () => {},
  createNewSession: async () => {},
  joinSession: async () => false,
  copyGameLink: () => {},
});

export const useGameContext = () => useContext(GameContext);

type GameProviderProps = {
  children: ReactNode;
};

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [playerRole, setPlayerRole] = useState<'Player 1' | 'Player 2' | 'Observer'>('Observer');
  const [isCreatingGame, setIsCreatingGame] = useState<boolean>(false);
  const [isJoiningGame, setIsJoiningGame] = useState<boolean>(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get the base URL for sharing
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return '';
  };
  
  const gameUrl = sessionId ? `${getBaseUrl()}/game?session=${sessionId}` : null;  // Create a new game session
  const createNewSession = async () => {
    try {
      setIsCreatingGame(true);
      
      // Create a game session with player1_id metadata
      const newSessionId = await createGameSession({
        ...initialGameState,
        metadata: {
          player1_id: uuidv4(), // Generate a unique ID for player 1
          player2_id: null
        }
      });
      
      if (newSessionId) {
        // Store player1 ID in localStorage for persistence
        if (typeof window !== 'undefined') {
          localStorage.setItem(`player_role_${newSessionId}`, 'Player 1');
        }
        
        // Set session data
        setSessionId(newSessionId);
        setIsHost(true);
        setPlayerRole('Player 1');
        
        // Use window.location for a full page navigation
        window.location.href = `/game?session=${newSessionId}`;
      } else {
        // If there's no session ID, turn off the loading state
        setIsCreatingGame(false);
      }
    } catch (error) {
      console.error("Error creating game session:", error);
      // If there's an error, turn off the loading state
      setIsCreatingGame(false);
    }
  };  // Join an existing game session
  const joinSession = async (id: string): Promise<boolean> => {
    if (!id) return false;
    
    try {
      setIsJoiningGame(true);
      
      const session = await getGameSession(id);
      if (session) {
        // Set session data
        setSessionId(id);
        setGameState(session.game_state);
        
        // Check localStorage first to see if we already have a role for this session
        const storedRole = typeof window !== 'undefined' ? localStorage.getItem(`player_role_${id}`) : null;
        
        if (storedRole === 'Player 1') {
          // If we're stored as Player 1, keep that role
          setIsHost(true);
          setPlayerRole('Player 1');
        } else if (storedRole === 'Player 2') {
          // If we're stored as Player 2, keep that role
          setPlayerRole('Player 2');
        } else {
          // No stored role, determine based on game state
          const gameState = session.game_state;
          const metadata = gameState.metadata || {};
          
          // If the game is fresh (no moves made) and player2_id is null,
          // we can join as Player 2
          if (gameState.player1Pieces === 9 && 
              gameState.player2Pieces === 9 && 
              !metadata.player2_id) {
            
            // Save player2 role in localStorage
            if (typeof window !== 'undefined') {
              localStorage.setItem(`player_role_${id}`, 'Player 2');
            }
            
            setPlayerRole('Player 2');
            
            // Update the session with player2_id
            const player2Id = uuidv4();
            await updateGameSession(id, {
              ...gameState,
              metadata: {
                ...metadata,
                player2_id: player2Id
              }
            });
          } else {
            // If the game has already started, join as observer
            setPlayerRole('Observer');
            if (typeof window !== 'undefined') {
              localStorage.setItem(`player_role_${id}`, 'Observer');
            }
          }
        }
        
        // IMPORTANT: Always turn off the loading state
        setIsJoiningGame(false);
        return true;
      }
      
      setIsJoiningGame(false);
      return false;
    } catch (error) {
      console.error("Error joining game session:", error);
      setIsJoiningGame(false);
      return false;
    }
  };
  
  // Update game state in both local state and Supabase
  const updateGameState = (newState: GameState) => {
    setGameState(newState);
    
    // Only update the database if we have a session ID
    if (sessionId) {
      updateGameSession(sessionId, newState);
    }
  };
  
  // Copy game link to clipboard
  const copyGameLink = () => {
    if (gameUrl && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(gameUrl);
      alert('Game link copied to clipboard!');
    }
  };
    // We've removed the useEffect hook that was causing double loading
  // The game page component now handles checking for the session parameter
  
  // Subscribe to real-time updates for the current session
  useEffect(() => {
    if (!sessionId) return;
    
    const subscription = subscribeToGameSession(
      sessionId,
      (payload) => {
        if (payload.new && payload.new.game_state) {
          setGameState(payload.new.game_state);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [sessionId]);
    return (
    <GameContext.Provider
      value={{
        gameState,
        sessionId,
        isHost,
        gameUrl,
        playerRole,
        isCreatingGame,
        isJoiningGame,
        updateGameState,
        createNewSession,
        joinSession,
        copyGameLink,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
