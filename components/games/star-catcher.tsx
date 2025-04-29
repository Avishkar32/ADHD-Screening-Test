"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { Star, Asteroid, Spaceship, GameMetrics } from "@/lib/types"
import { getRandomInt } from "@/lib/utils"

interface StarCatcherProps {
  age: number
  onComplete: (metrics: GameMetrics) => void
}

export default function StarCatcher({ age, onComplete }: StarCatcherProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<"intro" | "playing" | "complete">("intro")
  const [stars, setStars] = useState<Star[]>([])
  const [asteroids, setAsteroids] = useState<Asteroid[]>([])
  const [spaceship, setSpaceship] = useState<Spaceship>({ x: 0, y: 0, rotation: 0, thrusterActive: false })
  const [currentStarIndex, setCurrentStarIndex] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [errors, setErrors] = useState(0)
  const [distractionEvents, setDistractionEvents] = useState(0)
  const [reactionTimes, setReactionTimes] = useState<number[]>([])
  const [lastStarTime, setLastStarTime] = useState(0)
  const [canvasInitialized, setCanvasInitialized] = useState(false)

  // Game configuration based on age
  const getGameConfig = () => {
    if (age >= 4 && age <= 6) {
      return {
        starCount: 3,
        asteroidCount: 2,
        asteroidSpeed: 0.8,
        starSize: 60,
        clickableAreaSize: 70,
      }
    } else if (age >= 7 && age <= 12) {
      return {
        starCount: 4,
        asteroidCount: 3,
        asteroidSpeed: 1.2,
        starSize: 50,
        clickableAreaSize: 60,
      }
    } else {
      return {
        starCount: 5,
        asteroidCount: 4,
        asteroidSpeed: 1.5,
        starSize: 40,
        clickableAreaSize: 50,
      }
    }
  }

  const config = getGameConfig()

  // Set up canvas dimensions on mount - IMPORTANT: This must happen before game initialization
  useEffect(() => {
    const setupCanvas = () => {
      const canvas = canvasRef.current
      if (!canvas) {
        console.log("Canvas element not found on mount")
        return
      }

      const container = canvas.parentElement
      if (!container) {
        console.log("Canvas parent element not found")
        // Set default size if container not found
        canvas.width = 800
        canvas.height = 600
      } else {
        // Get dimensions from container
        canvas.width = Math.max(container.clientWidth, 800)
        canvas.height = Math.max(container.clientHeight, 600)
      }
      
      console.log(`Canvas initialized with size: ${canvas.width}x${canvas.height}`)
      setCanvasInitialized(true)
    }

    setupCanvas()
    window.addEventListener("resize", setupCanvas)

    return () => {
      window.removeEventListener("resize", setupCanvas)
    }
  }, []) // Empty dependency array means this runs once on mount

  // Initialize game
  const initializeGame = () => {
    console.log("Initializing game...")
    
    // Important: Ensure canvas is properly referenced before proceeding
    const canvas = canvasRef.current
    if (!canvas) {
      console.error("Canvas reference is not available")
      // Add a small delay and try again - this helps when React hasn't fully rendered the canvas
      setTimeout(() => {
        console.log("Retrying initialization...")
        if (canvasRef.current) {
          initializeGame()
        }
      }, 100)
      return
    }

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      console.error("Could not get 2D context from canvas")
      return
    }

    // Ensure canvas has dimensions
    if (canvas.width === 0 || canvas.height === 0) {
      const container = canvas.parentElement
      canvas.width = container ? container.clientWidth : 800
      canvas.height = container ? container.clientHeight : 600
      console.log(`Reset canvas dimensions to ${canvas.width}x${canvas.height}`)
    }

    const width = canvas.width
    const height = canvas.height

    // Create stars in random positions
    const starColors = ["#FF5E5E", "#5E9DFF", "#5EFF8F", "#FFDD5E", "#C45EFF"]
    const newStars: Star[] = []

    for (let i = 0; i < config.starCount; i++) {
      // Ensure stars are not too close to each other
      let x: number, y: number, tooClose
      let attempts = 0
      do {
        x = getRandomInt(config.starSize * 2, width - config.starSize * 2)
        y = getRandomInt(config.starSize * 2, height - config.starSize * 2)
        tooClose = newStars.some((star) => {
          const dx = x - star.x
          const dy = y - star.y
          return Math.sqrt(dx * dx + dy * dy) < config.starSize * 4
        })
        attempts++
        if (attempts > 100) {
          // Avoid infinite loop if canvas is too small
          tooClose = false
        }
      } while (tooClose)

      newStars.push({
        id: i,
        x,
        y,
        color: starColors[i % starColors.length],
        size: config.starSize,
        collected: false,
        order: i,
      })
    }

    console.log(`Created ${newStars.length} stars`)
    setStars(newStars)

    // Create asteroids
    const newAsteroids: Asteroid[] = []
    for (let i = 0; i < config.asteroidCount; i++) {
      newAsteroids.push({
        id: i,
        x: getRandomInt(0, width),
        y: getRandomInt(0, height),
        size: getRandomInt(15, 25),
        speed: Math.random() * config.asteroidSpeed + 0.5,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
      })
    }

    console.log(`Created ${newAsteroids.length} asteroids`)
    setAsteroids(newAsteroids)

    // Initialize spaceship in the center
    setSpaceship({
      x: width / 2,
      y: height / 2,
      rotation: 0,
      thrusterActive: false,
    })

    console.log("Setting game state to playing")
    setCurrentStarIndex(0)
    setStartTime(Date.now())
    setLastStarTime(Date.now())
    setErrors(0)
    setDistractionEvents(0)
    setReactionTimes([])
    
    // Important: make sure this is called after all state changes
    setGameState("playing")
  }

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== "playing") return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check if clicked on the current star
    const currentStar = stars.find((star) => star.order === currentStarIndex)
    if (!currentStar) return

    const dx = x - currentStar.x
    const dy = y - currentStar.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance <= config.clickableAreaSize) {
      // Correct star clicked
      const now = Date.now()
      const reactionTime = now - lastStarTime
      setReactionTimes((prev) => [...prev, reactionTime])
      setLastStarTime(now)

      // Update star to collected
      setStars((prev) => 
        prev.map((star) => 
          star.id === currentStar.id ? { ...star, collected: true } : star
        )
      )

      // Move to next star
      const nextIndex = currentStarIndex + 1
      setCurrentStarIndex(nextIndex)

      // Move spaceship to the clicked star
      setSpaceship((prev) => ({
        ...prev,
        x: currentStar.x,
        y: currentStar.y,
        thrusterActive: true,
      }))

      // If all stars collected, end game
      if (nextIndex >= stars.length) {
        setTimeout(() => {
          setGameState("complete")
        }, 1000)
      }
    } else {
      // Wrong star or missed
      setErrors((prev) => prev + 1)

      // Check if clicked on a different star (wrong order)
      const clickedStar = stars.find((star) => {
        if (star.collected) return false
        const dx = x - star.x
        const dy = y - star.y
        return Math.sqrt(dx * dx + dy * dy) <= config.clickableAreaSize
      })

      if (clickedStar && clickedStar.order !== currentStarIndex) {
        setErrors((prev) => prev + 1) // Additional error for clicking wrong star
      }
    }
  }

  // Animation loop
  useEffect(() => {
    if (gameState !== "playing") return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    let animationFrameId: number

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      // Draw stars
      stars.forEach((star) => {
        if (star.collected) return

        // Draw star glow
        const gradient = ctx.createRadialGradient(star.x, star.y, star.size * 0.2, star.x, star.y, star.size * 1.5)
        gradient.addColorStop(0, star.color)
        gradient.addColorStop(1, "transparent")

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size * 1.5, 0, Math.PI * 2)
        ctx.fill()

        // Draw twinkling effect
        const twinkle = Math.sin(Date.now() / 200) * 0.2 + 0.8

        // Draw star
        ctx.fillStyle = star.color
        ctx.beginPath()
        drawStar(ctx, star.x, star.y, 5, star.size * 0.5 * twinkle, star.size * 0.25 * twinkle)
        ctx.fill()

        // Highlight current star
        if (star.order === currentStarIndex) {
          ctx.strokeStyle = "white"
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.size * 0.7, 0, Math.PI * 2)
          ctx.stroke()

          // Draw order number
          ctx.fillStyle = "white"
          ctx.font = `${star.size * 0.6}px Arial`
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(`${star.order + 1}`, star.x, star.y)
        }
      })

      // Draw asteroids
      asteroids.forEach((asteroid) => {
        // Update asteroid position
        asteroid.x += Math.cos(asteroid.rotation) * asteroid.speed
        asteroid.y += Math.sin(asteroid.rotation) * asteroid.speed
        asteroid.rotation += asteroid.rotationSpeed

        // Wrap around screen
        if (asteroid.x < -asteroid.size) asteroid.x = width + asteroid.size
        if (asteroid.x > width + asteroid.size) asteroid.x = -asteroid.size
        if (asteroid.y < -asteroid.size) asteroid.y = height + asteroid.size
        if (asteroid.y > height + asteroid.size) asteroid.y = -asteroid.size

        // Draw asteroid
        ctx.save()
        ctx.translate(asteroid.x, asteroid.y)
        ctx.rotate(asteroid.rotation)

        // Asteroid body
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, asteroid.size)
        gradient.addColorStop(0, "#AAA")
        gradient.addColorStop(1, "#666")

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(0, 0, asteroid.size, 0, Math.PI * 2)
        ctx.fill()

        // Asteroid craters
        ctx.fillStyle = "#555"
        for (let i = 0; i < 3; i++) {
          const craterX = (Math.random() - 0.5) * asteroid.size * 0.8
          const craterY = (Math.random() - 0.5) * asteroid.size * 0.8
          const craterSize = asteroid.size * 0.2 * Math.random()
          ctx.beginPath()
          ctx.arc(craterX, craterY, craterSize, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.restore()
      })

      // Draw spaceship
      ctx.save()
      ctx.translate(spaceship.x, spaceship.y)

      // Calculate rotation towards current star
      const currentStar = stars.find((star) => star.order === currentStarIndex)
      if (currentStar && !currentStar.collected) {
        const dx = currentStar.x - spaceship.x
        const dy = currentStar.y - spaceship.y
        const targetRotation = Math.atan2(dy, dx)

        // Smoothly rotate towards target
        let rotDiff = targetRotation - spaceship.rotation
        if (rotDiff > Math.PI) rotDiff -= Math.PI * 2
        if (rotDiff < -Math.PI) rotDiff += Math.PI * 2

        spaceship.rotation += rotDiff * 0.1
      }

      ctx.rotate(spaceship.rotation)

      // Draw spaceship body
      ctx.fillStyle = "#FFFFFF"
      ctx.beginPath()
      ctx.moveTo(20, 0)
      ctx.lineTo(-10, 10)
      ctx.lineTo(-5, 0)
      ctx.lineTo(-10, -10)
      ctx.closePath()
      ctx.fill()

      // Draw cockpit
      ctx.fillStyle = "#7AA8FF"
      ctx.beginPath()
      ctx.arc(5, 0, 7, 0, Math.PI * 2)
      ctx.fill()

      // Draw thruster flame if active
      if (spaceship.thrusterActive) {
        const flameSize = 0.7 + Math.random() * 0.3
        const flameGradient = ctx.createLinearGradient(-5, 0, -25 * flameSize, 0)
        flameGradient.addColorStop(0, "#FF9D7A")
        flameGradient.addColorStop(0.7, "#FF5E5E")
        flameGradient.addColorStop(1, "transparent")

        ctx.fillStyle = flameGradient
        ctx.beginPath()
        ctx.moveTo(-5, 0)
        ctx.lineTo(-15 * flameSize, 5 * flameSize)
        ctx.lineTo(-25 * flameSize, 0)
        ctx.lineTo(-15 * flameSize, -5 * flameSize)
        ctx.closePath()
        ctx.fill()

        // Gradually turn off thruster
        if (Math.random() > 0.95) {
          setSpaceship((prev) => ({ ...prev, thrusterActive: false }))
        }
      }

      ctx.restore()

      // Draw order indicators at the bottom
      const indicatorSize = 40
      const totalWidth = stars.length * (indicatorSize + 10)
      const startX = (width - totalWidth) / 2

      stars.forEach((star, index) => {
        const x = startX + index * (indicatorSize + 10)
        const y = height - indicatorSize - 20

        ctx.fillStyle = star.color
        ctx.beginPath()
        ctx.arc(x + indicatorSize / 2, y + indicatorSize / 2, indicatorSize / 2, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = "white"
        ctx.font = "24px Arial"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(`${index + 1}`, x + indicatorSize / 2, y + indicatorSize / 2)

        if (star.collected) {
          ctx.strokeStyle = "#5EFF8F"
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.arc(x + indicatorSize / 2, y + indicatorSize / 2, indicatorSize / 2 + 5, 0, Math.PI * 2)
          ctx.stroke()
        } else if (index === currentStarIndex) {
          ctx.strokeStyle = "white"
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.arc(x + indicatorSize / 2, y + indicatorSize / 2, indicatorSize / 2 + 5, 0, Math.PI * 2)
          ctx.stroke()
        }
      })

      // Draw instructions
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
      ctx.font = "24px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Click on the stars in order: 1, 2, 3...", width / 2, 40)

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [gameState, stars, asteroids, spaceship, currentStarIndex, config.clickableAreaSize])

  // Helper function to draw a star shape
  const drawStar = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number,
  ) => {
    let rot = (Math.PI / 2) * 3
    const step = Math.PI / spikes

    ctx.beginPath()
    ctx.moveTo(cx, cy - outerRadius)

    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius)
      rot += step
      ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius)
      rot += step
    }

    ctx.lineTo(cx, cy - outerRadius)
    ctx.closePath()
  }

  // Calculate metrics for the game
  const calculateMetrics = () => {
    const endTime = Date.now()
    const playTimeMs = endTime - startTime
    const playTimeMin = playTimeMs / 60000

    // Calculate reaction time variability
    let rtVariability = 0
    if (reactionTimes.length > 0) {
      const avgReactionTime = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
      const rtVariance = reactionTimes.reduce((a, b) => a + Math.pow(b - avgReactionTime, 2), 0) / reactionTimes.length
      rtVariability = Math.sqrt(rtVariance)
    }

    // Error rate as percentage
    const errorRate = (errors / stars.length) * 100

    // Distraction events per minute
    const distractionEventsPerMin = distractionEvents / playTimeMin

    return {
      age,
      adhd_status: Math.random() > 0.8 ? 1 : 0,
      playtime_min: playTimeMin,
      session_incomplete: 0,
      sc_er: errorRate,
      sc_de: distractionEventsPerMin,
      sc_tct: playTimeMs / 1000,
      sc_rtv: rtVariability,
      movementVariance: undefined, // Set to undefined as expected by GameMetrics type
      score: undefined, // Set to undefined as expected by GameMetrics type
      sustainedFailures: 0, // Add appropriate calculation if needed
      impulseErrors: 0, // Add appropriate calculation if needed
    }
  }

  return (
    <div className="w-full max-w-4xl">
      {gameState === "intro" && (
        <Card className="bg-black/50 backdrop-blur-md border-purple-500/30 p-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Star Catcher</h2>
          <p className="text-gray-300 mb-6 text-lg">
            Guide your spaceship to collect stars in the correct sequence.
            <br />
            Click on the stars in numerical order (1, 2, 3...).
          </p>
          <Button 
            onClick={() => {
              console.log("Start Game button clicked");
              
              // Ensure canvas is initialized before starting the game
              if (canvasRef.current) {
                initializeGame();
              } else {
                console.log("Canvas not ready, waiting to initialize");
                // Force canvas creation then initialize
                setCanvasInitialized(true);
                setTimeout(initializeGame, 100);
              }
            }} 
            className="bg-purple-600 hover:bg-purple-700 text-white text-lg py-6 px-8"
          >
            Start Game
          </Button>
        </Card>
      )}

      {gameState === "playing" && (
        <div className="relative w-full h-[600px] rounded-lg overflow-hidden border border-purple-500/30">
          <canvas 
            ref={canvasRef} 
            onClick={handleCanvasClick} 
            className="w-full h-full bg-black/70" 
            width="800" 
            height="600"
            style={{ display: "block" }} // Force block display
          />
        </div>
      )}

      {gameState === "complete" && (
        <Card className="bg-black/50 backdrop-blur-md border-purple-500/30 p-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Game Complete!</h2>
          <p className="text-gray-300 mb-6 text-lg">You've collected all the stars!</p>
          <Button
            onClick={() => onComplete(calculateMetrics())}
            className="bg-purple-600 hover:bg-purple-700 text-white text-lg py-6 px-8"
          >
            Continue
          </Button>
        </Card>
      )}

      {/* This hidden canvas ensures the ref is available during game initialization */}
      {gameState === "intro" && (
        <div style={{ display: "none" }}>
          <canvas ref={canvasRef} width="800" height="600" />
        </div>
      )}
    </div>
  )
}