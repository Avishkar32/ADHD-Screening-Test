"use client"

import { useState } from "react"
import { SpaceBackground } from "@/components/space-background"
import AgeForm from "@/components/age-form"
import GameSelection from "@/components/game-selection"
import StarCatcher from "@/components/games/star-catcher"
import WaitForSignal from "@/components/games/wait-for-signal"
import GalacticDefender from "@/components/games/galactic-defender"
import MetricsDisplay from "@/components/metrics-display"
import type { GameMetrics } from "@/lib/types"

export default function Home() {
  const [age, setAge] = useState<number | null>(null)
  const [currentGame, setCurrentGame] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<GameMetrics[]>([])
  const [completedGames, setCompletedGames] = useState<string[]>([])
  const [showMetrics, setShowMetrics] = useState(false)

  const handleGameComplete = (gameMetrics: GameMetrics) => {
    setMetrics((prev) => [...prev, gameMetrics])
    
    // Add to completed games
    const gameId = currentGame || ""
    if (!completedGames.includes(gameId)) {
      setCompletedGames(prev => [...prev, gameId])
    }
    
    setCurrentGame(null)
    
    // Only show metrics if all three games are completed
    if (completedGames.length === 2) { // Will be 3 after this game
      setShowMetrics(true)
    }
  }

  const handleBackToSelection = () => {
    setShowMetrics(false)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      <SpaceBackground />

      <div className="z-10 w-full max-w-5xl p-6 flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 text-center">ADHD Screening Platform</h1>

        {!age && <AgeForm onAgeSubmit={setAge} />}

        {age && !currentGame && !showMetrics && (
          <GameSelection 
            onSelectGame={setCurrentGame} 
            completedGames={completedGames}
          />
        )}

        {age && currentGame === "star-catcher" && (
          <StarCatcher age={age} onComplete={handleGameComplete} />
        )}

        {age && currentGame === "wait-for-signal" && (
          <WaitForSignal age={age} onComplete={handleGameComplete} />
        )}

        {age && currentGame === "galactic-defender" && (
          <GalacticDefender age={age} onComplete={handleGameComplete} />
        )}

        {showMetrics && <MetricsDisplay metrics={metrics} onBackToSelection={handleBackToSelection} />}

        <div className="mt-8 text-white text-xs opacity-70 text-center">
          <p>This is a simulation for testing purposes only.</p>
          <p>Please consult a healthcare professional for proper diagnosis.</p>
        </div>
      </div>
    </main>
  )
}
