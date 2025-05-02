"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { GameMetrics } from "@/lib/types"

interface StarCatcherProps {
  age: number
  onComplete: (metrics: GameMetrics) => void
}

interface Alien {
  box: number // 0-8
  appearedAt: number
  visible: boolean
  hit: boolean
}

interface AlienGhost {
  id: number;
  x: number;
  y: number;
  opacity: number;
}

interface Distractor {
  box: number
  appearedAt: number
  visible: boolean
}

interface TargetHit {
  targetAppearTime: number;
  hitTime: number;
  isCorrect: boolean;
}

const GRID_SIZE = 3
const BOX_COUNT = GRID_SIZE * GRID_SIZE

export default function StarCatcher({ age, onComplete }: StarCatcherProps) {
  const [gameState, setGameState] = useState<"intro" | "playing" | "complete">("intro")
  const [alien, setAlien] = useState<Alien | null>(null)
  const [score, setScore] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [errors, setErrors] = useState(0)
  const [distractionEvents, setDistractionEvents] = useState(0)
  const [reactionTimes, setReactionTimes] = useState<number[]>([])
  const [round, setRound] = useState(0)
  const [totalRounds, setTotalRounds] = useState(30)
  const [ghosts, setGhosts] = useState<AlienGhost[]>([])
  const [alienAppearTs, setAlienAppearTs] = useState<number>(0);
  const [isGridHovered, setIsGridHovered] = useState(false);
  const [distractors, setDistractors] = useState<Distractor[]>([])
  const [distractorClicks, setDistractorClicks] = useState(0)
  const [targetHits, setTargetHits] = useState<TargetHit[]>([])
  const [wrongTargetClicks, setWrongTargetClicks] = useState(0)

  // Game config based on age
  const getGameConfig = () => {
    if (age >= 4 && age <= 6) {
      return { 
        alienVisibleTime: 1600, 
        totalRounds: 20, 
        popAnimDuration: 400,
        distractorChance: 0.3, // 30% chance of distractor
        maxDistractors: 1
      }
    } else if (age >= 7 && age <= 12) {
      return { 
        alienVisibleTime: 1300, 
        totalRounds: 30, 
        popAnimDuration: 350,
        distractorChance: 0.4,
        maxDistractors: 2
      }
    } else {
      return { 
        alienVisibleTime: 1100, 
        totalRounds: 40, 
        popAnimDuration: 300,
        distractorChance: 0.5,
        maxDistractors: 2
      }
    }
  }
  const config = getGameConfig()

  // Start game
  const initializeGame = () => {
    setScore(0)
    setStartTime(Date.now())
    setErrors(0)
    setDistractionEvents(0)
    setReactionTimes([])
    setRound(0)
    setTotalRounds(config.totalRounds)
    setAlien(null)
    setGameState("playing")
  }

  // Alien pop-up logic
  useEffect(() => {
    if (gameState !== "playing") return
    if (round >= totalRounds) {
      setTimeout(() => setGameState("complete"), 500)
      return
    }
    // Show alien in a random box
    const availableBoxes = Array.from({ length: BOX_COUNT }, (_, i) => i)
    const box = availableBoxes.splice(Math.floor(Math.random() * availableBoxes.length), 1)[0]
    const appearedAt = Date.now()
    setAlien({ box, appearedAt, visible: true, hit: false })
    setAlienAppearTs(appearedAt)

    // Maybe add distractors
    if (Math.random() < config.distractorChance) {
      const distractorCount = Math.floor(Math.random() * config.maxDistractors) + 1
      const newDistractors: Distractor[] = []
      
      for (let i = 0; i < distractorCount; i++) {
        if (availableBoxes.length > 0) {
          const dBox = availableBoxes.splice(Math.floor(Math.random() * availableBoxes.length), 1)[0]
          newDistractors.push({ box: dBox, appearedAt, visible: true })
        }
      }
      setDistractors(newDistractors)
    } else {
      setDistractors([])
    }

    // Hide alien and distractors after visible time
    const timeout = setTimeout(() => {
      setAlien((prev) => {
        if (prev && prev.visible && !prev.hit) {
          setErrors(e => e + 1)
          setDistractionEvents(d => d + 1)
        }
        return null
      })
      setDistractors([])
      setRound(r => r + 1)
    }, config.alienVisibleTime)

    return () => clearTimeout(timeout)
  }, [gameState, round, totalRounds, config.alienVisibleTime])

  // Add ghost animation frame
  useEffect(() => {
    if (ghosts.length === 0) return;

    const animateGhosts = () => {
      setGhosts(prev => prev
        .map(ghost => ({
          ...ghost,
          y: ghost.y - 2,
          opacity: ghost.opacity - 0.02
        }))
        .filter(ghost => ghost.opacity > 0)
      );
    };

    const interval = setInterval(animateGhosts, 16);
    return () => clearInterval(interval);
  }, [ghosts]);

  // Handle box click
  const handleBoxClick = (idx: number) => {
    if (gameState !== "playing") return
    const clickTime = Date.now()

    // Check if clicked on distractor
    if (distractors.some(d => d.visible && d.box === idx)) {
      setErrors(e => e + 1)
      setDistractorClicks(c => c + 1)
      setTargetHits(prev => [...prev, {
        targetAppearTime: alien?.appearedAt || clickTime,
        hitTime: clickTime,
        isCorrect: false
      }])
      return
    }

    if (alien && alien.visible && idx === alien.box && !alien.hit) {
      setScore(s => s + 1)
      setTargetHits(prev => [...prev, {
        targetAppearTime: alien.appearedAt,
        hitTime: clickTime,
        isCorrect: true
      }])
      
      // Create ghost effect
      const boxElement = document.querySelector(`[data-box="${idx}"]`);
      if (boxElement) {
        const rect = boxElement.getBoundingClientRect();
        setGhosts(prev => [...prev, {
          id: Date.now(),
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          opacity: 1
        }]);
      }
      
      setAlien(a => a ? { ...a, hit: true, visible: false } : a)
      setRound(r => r + 1)
    } else {
      setErrors(e => e + 1)
      setWrongTargetClicks(w => w + 1)
      setTargetHits(prev => [...prev, {
        targetAppearTime: alien?.appearedAt || clickTime,
        hitTime: clickTime,
        isCorrect: false
      }])
    }
  }

  // Metrics calculation (same as before, but errorRate is per round)
  const calculateMetrics = () => {
    const endTime = Date.now()
    const playTimeMs = endTime - startTime
    const playTimeMin = playTimeMs / 60000

    // Get only correct hits
    const correctHits = targetHits.filter(hit => hit.isCorrect)
    
    // Calculate reaction times for correct hits
    const reactionTimes = correctHits.map(hit => hit.hitTime - hit.targetAppearTime)
    
    // Calculate mean reaction time
    const avgReactionTime = reactionTimes.length > 0
      ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
      : 0

    // Calculate reaction time variability (standard deviation)
    let rtVariability = 0
    if (reactionTimes.length > 0) {
      const squaredDiffs = reactionTimes.map(rt => Math.pow(rt - avgReactionTime, 2))
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) / reactionTimes.length
      rtVariability = Math.sqrt(variance)
    }

    // Error rate: wrong target clicks / total rounds
    const errorRate = (wrongTargetClicks / totalRounds) * 100

    // Distraction events: clicks on distractors per minute
    const distractionEventsPerMin = distractorClicks / playTimeMin

    // Total completion time in seconds
    const completionTime = playTimeMs / 1000

    return {
      age,
      adhd_status: Math.random() > 0.8 ? 1 : 0,
      playtime_min: playTimeMin,
      session_incomplete: 0,
      sc_er: errorRate,                    // Error rate: wrong target clicks
      sc_de: distractionEventsPerMin,      // Distraction events per minute
      sc_tct: completionTime,              // Total completion time
      sc_rtv: rtVariability,               // Reaction time variability
      movementVariance: undefined,
      score: score,
      sustainedFailures: distractorClicks, // Total distractor clicks
      impulseErrors: distractorClicks,     // Same as sustainedFailures for this game
    }
  }

  return (
    <div className="w-full max-w-4xl">
      {gameState === "intro" && (
        <Card className="bg-black/50 backdrop-blur-md border-purple-500/30 p-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Space Whack-a-Alien</h2>
          <p className="text-gray-300 mb-6 text-lg">
            Click the alien 👽 as soon as it appears!<br />
            Try to hit as many as you can.
          </p>
          <Button
            onClick={initializeGame}
            className="bg-purple-600 hover:bg-purple-700 text-white text-lg py-6 px-8"
          >
            Start Game
          </Button>
        </Card>
      )}

      {gameState === "playing" && (
        <div className="flex flex-col items-center">
          <div className="mb-4 text-white text-lg">
            Score: {score} &nbsp;|&nbsp; Round: {round + 1}/{totalRounds}
          </div>
          <div
            className="relative"
            style={{
              width: 500,
              height: 540, // increased for bottom padding
              margin: "0 auto"
            }}
          >
            <div
              className="grid grid-cols-3 gap-4 bg-black/70 rounded-lg p-6 border border-purple-500/30"
              style={{
                width: 480,
                height: 500,
                cursor: isGridHovered
                  ? `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><text y='48' font-size='56'>🔨</text></svg>") 32 32, pointer`
                  : "auto",
                paddingBottom: 100 // extra padding at the bottom
              }}
              onMouseEnter={() => setIsGridHovered(true)}
              onMouseLeave={() => setIsGridHovered(false)}
            >
              {[...Array(BOX_COUNT)].map((_, idx) => {
                let content = null;
                
                // Show alien if present
                if (alien && alien.visible && alien.box === idx && !alien.hit) {
                  // Alien rise animation
                  const elapsed = Math.min(Date.now() - alienAppearTs, config.popAnimDuration);
                  const rise = 20 - (elapsed / config.popAnimDuration) * 20; // from 20px down to 0
                  content = (
                    <span
                      style={{
                        display: "inline-block",
                        transform: `translateY(${rise}px)`,
                        transition: "transform 0.18s",
                        willChange: "transform"
                      }}
                    >
                      👽
                    </span>
                  );
                }
                
                // Show distractor if present
                const distractor = distractors.find(d => d.visible && d.box === idx);
                if (distractor) {
                  content = <span className="animate-bounce">🧑‍🚀</span>;
                }

                return (
                  <div
                    key={idx}
                    data-box={idx}
                    onClick={() => handleBoxClick(idx)}
                    className="flex items-center justify-center rounded-md"
                    style={{
                      width: 140,
                      height: 140,
                      border: alien && alien.visible && alien.box === idx && !alien.hit
                        ? "3px solid #50FF50"
                        : "2px solid #444",
                      fontSize: 64,
                      userSelect: "none",
                      transition: "all 0.2s",
                      position: "relative",
                      overflow: "hidden",
                      cursor: isGridHovered
                        ? `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><text y='48' font-size='56'>🔨</text></svg>") 32 32, pointer`
                        : "auto",
                      background: `
                        linear-gradient(
                          135deg, 
                          rgba(40, 40, 40, 0.95) 0%,
                          rgba(20, 20, 20, 0.95) 100%
                        )
                      `,
                      boxShadow: `
                        inset 0 0 15px rgba(0, 0, 0, 0.5),
                        0 2px 4px rgba(0, 0, 0, 0.4)
                      `,
                      // Add metallic texture
                      backgroundImage: `
                        linear-gradient(
                          45deg,
                          rgba(255,255,255,0.05) 25%,
                          transparent 25%,
                          transparent 75%,
                          rgba(255,255,255,0.05) 75%
                        ),
                        linear-gradient(
                          45deg,
                          rgba(255,255,255,0.05) 25%,
                          transparent 25%,
                          transparent 75%,
                          rgba(255,255,255,0.05) 75%
                        )
                      `,
                      backgroundSize: "30px 30px",
                      backgroundPosition: "0 0, 15px 15px"
                    }}
                  >
                    {content}
                  </div>
                );
              })}
            </div>
            {/* Ghost animations */}
            {ghosts.map(ghost => (
              <div
                key={ghost.id}
                className="pointer-events-none"
                style={{
                  position: "fixed",
                  left: ghost.x,
                  top: ghost.y,
                  opacity: ghost.opacity,
                  transform: 'translate(-50%, -50%)',
                  fontSize: '64px',
                  transition: 'all 0.016s linear',
                  zIndex: 50,
                  pointerEvents: "none"
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    transform: `translateY(-40px)`,
                    transition: "transform 0.5s"
                  }}
                >
                  👾
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {gameState === "complete" && (
        <Card className="bg-black/50 backdrop-blur-md border-purple-500/30 p-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Game Complete!</h2>
          <p className="text-gray-300 mb-6 text-lg">
            You whacked {score} aliens!
          </p>
          <Button
            onClick={() => onComplete(calculateMetrics())}
            className="bg-purple-600 hover:bg-purple-700 text-white text-lg py-6 px-8"
          >
            Continue
          </Button>
        </Card>
      )}
    </div>
  )
}