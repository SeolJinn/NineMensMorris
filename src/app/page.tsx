"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGameContext } from "./lib/gameContext";

export default function Home() {
  const { createNewSession, isCreatingGame, isJoiningGame } = useGameContext();
  const [joinSessionId, setJoinSessionId] = useState("");  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedId = joinSessionId.trim();
    
    if (trimmedId) {
      // Navigate directly to the game page with the session ID
      // The game page will handle joining through its useEffect
      window.location.href = `/game?session=${trimmedId}`;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-gradient-to-b from-gray-900 to-black text-white">
      <h1 className="text-4xl md:text-6xl font-bold mb-4 text-center">Nine Men&apos;s Morris</h1>
      <p className="text-xl text-center max-w-2xl mb-8">
        Play the classic strategy board game online with friends
      </p>

      <div className="flex flex-col md:flex-row gap-6 w-full max-w-3xl">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg flex-1 flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-4">Create New Game</h2>
          <p className="text-gray-300 mb-6 text-center">
            Start a new game and invite a friend to play
          </p>          <button
            onClick={createNewSession}
            disabled={isCreatingGame}
            className={`w-full py-3 px-6 ${isCreatingGame ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} rounded-md font-medium transition-colors flex items-center justify-center`}
          >
            {isCreatingGame ? (
              <>
                <span className="animate-spin inline-block mr-2 w-4 h-4 border-2 border-t-transparent rounded-full"></span>
                Creating...
              </>
            ) : (
              'Create Game'
            )}
          </button>
        </div>

        <div className="bg-gray-800 p-8 rounded-lg shadow-lg flex-1">
          <h2 className="text-2xl font-bold mb-4 text-center">Join Game</h2>
          <p className="text-gray-300 mb-6 text-center">
            Enter the game code to join an existing game
          </p>
          <form onSubmit={handleJoinSession} className="flex flex-col gap-4">
            <input
              type="text"
              value={joinSessionId}
              onChange={(e) => setJoinSessionId(e.target.value)}
              placeholder="Enter game code"
              className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />            <button
              type="submit"
              disabled={isJoiningGame}
              className={`w-full py-3 px-6 ${isJoiningGame ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} rounded-md font-medium transition-colors flex items-center justify-center`}
            >
              {isJoiningGame ? (
                <>
                  <span className="animate-spin inline-block mr-2 w-4 h-4 border-2 border-t-transparent rounded-full"></span>
                  Joining...
                </>
              ) : (
                'Join Game'
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="mt-12 text-center">
        <h3 className="text-xl font-bold mb-4">How to Play</h3>
        <p className="max-w-2xl text-gray-300">
          Nine Men's Morris is a strategy board game for two players. Each player tries to form mills—three of their pieces in a row—to capture opponent's pieces. When a player is reduced to two pieces, they have lost the game.
        </p>
      </div>
    </div>
  );
}
