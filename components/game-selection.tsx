"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Rocket, Star, Shield, CheckCircle } from 'lucide-react'

interface GameSelectionProps {
  onSelectGame: (game: string) => void
  completedGames: string[]
}

export default function GameSelection({ onSelectGame, completedGames }: GameSelectionProps) {
  const games = [
    {
      id: "star-catcher",
      name: "Star Catcher",
      description: "Guide your spaceship to collect stars in a specific sequence while avoiding distractions.",
      icon: <Star className="h-8 w-8 text-yellow-400" />,
      color: "from-indigo-500 to-purple-700",
    },
    {
      id: "wait-for-signal",
      name: "Wait for the Signal",
      description: "Launch your rocket when you see the green signal, but wait when you see red.",
      icon: <Rocket className="h-8 w-8 text-green-400" />,
      color: "from-emerald-500 to-teal-700",
    },
    {
      id: "galactic-defender",
      name: "Galactic Defender",
      description: "Protect your space outpost from alien ships and meteors with precise timing.",
      icon: <Shield className="h-8 w-8 text-blue-400" />,
      color: "from-blue-500 to-violet-700",
    },
  ]

  // Check if all games are completed
  const allCompleted = games.every(game => completedGames.includes(game.id))

  return (
    <div className="w-full max-w-4xl">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">Choose a Game</h2>
      
      {allCompleted && (
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-center">
          <p className="text-white text-lg">
            All games completed! You can play again or view your results.
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {games.map((game) => {
          const isCompleted = completedGames.includes(game.id);
          
          return (
            <Card
              key={game.id}
              className={`bg-black/50 backdrop-blur-md border-purple-500/30 hover:bg-black/60 transition-all duration-300 transform hover:scale-105 relative ${
                isCompleted ? "border-green-500/50" : ""
              }`}
            >
              {isCompleted && (
                <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              )}
              
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className={`p-3 rounded-full bg-gradient-to-br ${game.color}`}>{game.icon}</div>
                </div>
                <CardTitle className="text-xl text-white text-center">{game.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-300 text-center">{game.description}</CardDescription>
              </CardContent>
              <CardFooter>
                <Button
                  className={`w-full bg-gradient-to-r ${game.color} hover:opacity-90 text-white`}
                  onClick={() => onSelectGame(game.id)}
                >
                  {isCompleted ? "Play Again" : "Play Now"}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
