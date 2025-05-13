"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GameBoard from "../GameBoard";
import { useGameContext } from "../lib/gameContext";
import { QRCodeSVG } from "qrcode.react";

export default function GamePage() {
  const { 
    gameUrl, 
    sessionId, 
    playerRole, 
    copyGameLink, 
    joinSession,
    isCreatingGame,
    isJoiningGame
  } = useGameContext();
  const [showQrCode, setShowQrCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();  useEffect(() => {
    let isMounted = true;  // Flag to prevent state updates after unmount
    const sessionParam = searchParams?.get("session");
    
    const handleSession = async () => {
      if (!sessionParam) {
        // If no session ID is provided, redirect to home
        if (isMounted) router.replace("/");
        return;
      }
      
      // Only proceed with joining if we don't already have a session ID set
      // This prevents double-joining which causes the flashing
      if (!sessionId) {
        try {
          // Let the context handle the loading state
          const success = await joinSession(sessionParam);
          
          // Only update state if component is still mounted
          if (isMounted) {
            if (!success) {
              setError("Failed to join game. The session may not exist.");
            }
          }
        } catch (err) {
          // Only update state if component is still mounted
          if (isMounted) {
            console.error("Session join error:", err);
            setError("Failed to connect to the game server.");
          }
        }
      }
    };
    
    // Run session handling on mount
    handleSession();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;  // Mark component as unmounted
    };
  }, [joinSession, searchParams, router, sessionId]);// Show loading state when creating game or joining game
  // We added a timeout to prevent being stuck forever in the loading state
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  useEffect(() => {
    if (isCreatingGame || isJoiningGame) {
      // Set a timeout to prevent getting stuck in loading state
      const timer = setTimeout(() => setLoadingTimeout(true), 10000);
      return () => clearTimeout(timer);
    }
  }, [isCreatingGame, isJoiningGame]);

  // If loading timed out, show an error that lets the user retry or go home
  if (loadingTimeout) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center max-w-md p-8 bg-gray-800 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Loading Timeout</h2>
          <p className="mb-6">It's taking longer than expected to load your game. The connection might be slow or there might be an issue with the game server.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-md transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Show loading state when creating game, joining game, or when sessionId isn't set yet
  if (isCreatingGame || isJoiningGame || !sessionId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-xl">
            {isCreatingGame ? "Creating game session..." : isJoiningGame ? "Joining game session..." : "Loading game..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center max-w-md p-8 bg-gray-800 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p className="mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 p-4">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-2xl font-bold mb-2 sm:mb-0">Nine Men&apos;s Morris</h1>
          <div className="flex space-x-4 items-center">
            <div className="text-sm px-3 py-1 bg-blue-600 rounded-full">
              {playerRole}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={copyGameLink}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-sm"
              >
                Copy Invite Link
              </button>
              <button
                onClick={() => setShowQrCode(!showQrCode)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-sm"
              >
                {showQrCode ? "Hide QR Code" : "Show QR Code"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 p-4">
        <div className="container mx-auto flex flex-col lg:flex-row gap-8 justify-center items-center">
          {/* Game board container */}
          <div className="w-full max-w-xl">
            <GameBoard isOnline={true} />
          </div>

          {/* Game info and QR code */}
          <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Game Information</h2>
            
            {sessionId && (
              <div className="mb-4">
                <p className="text-gray-300 mb-1">Game ID:</p>
                <div className="bg-gray-700 p-2 rounded flex justify-between items-center">
                  <code className="text-sm font-mono text-yellow-300">
                    {sessionId}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(sessionId);
                      alert("Game ID copied to clipboard!");
                    }}
                    className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}

            {showQrCode && gameUrl && (
              <div className="mt-6">
                <p className="text-gray-300 mb-2">Scan to join this game:</p>
                <div className="bg-white p-4 rounded-lg inline-block">
                  <QRCodeSVG value={gameUrl} size={200} />
                </div>
              </div>
            )}
            
            <div className="mt-6">
              <h3 className="font-bold mb-2">You are {playerRole}</h3>
              {playerRole === 'Observer' ? (
                <p className="text-yellow-300">You can only watch this game. You cannot make moves.</p>
              ) : playerRole === 'Player 1' ? (
                <p className="text-blue-300">You go first. Wait for Player 2 to join!</p>
              ) : (
                <p className="text-green-300">You go second. Wait for Player 1 to make their move!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
