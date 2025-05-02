"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Moon, Sparkles, Rocket as RocketIcon } from "lucide-react"

// Define types
interface SignalType {
  type: string;
  active: boolean;
  timeRemaining: number;
}

interface RocketType {
  launched: boolean;
  y: number;
  speed: number;
}

interface GameMetrics {
  age: number;
  adhd_status: number;
  playtime_min: number;
  session_incomplete: number;
  wfs_fpr: number;
  wfs_prc: number;
  wfs_rt: number;
  wfs_gs: number;
  wfs_gs_total: number;
}

const getRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

interface WaitForSignalProps {
  age: number;
  onComplete: (metrics: GameMetrics) => void;
}

export default function WaitForSignal({ age, onComplete }: WaitForSignalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState("intro")
  const [signal, setSignal] = useState({ type: "red", active: false, timeRemaining: 0 })
  const [rocket, setRocket] = useState<RocketType>({ launched: false, y: 0, speed: 0 })
  const [startTime, setStartTime] = useState(0)
  const [falsePositives, setFalsePositives] = useState(0)
  const [prematureResponses, setPrematureResponses] = useState(0)
  const [reactionTimes, setReactionTimes] = useState<number[]>([])
  const [gazeShifts, setGazeShifts] = useState(0)
  const [signalStartTime, setSignalStartTime] = useState(0)
  const [gameTime, setGameTime] = useState(0)
  const [successfulLaunches, setSuccessfulLaunches] = useState(0)
  const [targetLaunches, setTargetLaunches] = useState(5)

  const getGameConfig = () => {
    if (age >= 4 && age <= 6) {
      return {
        signalDuration: { min: 1500, max: 2500 },
        intervalDuration: { min: 1500, max: 2500 },
        signalSize: 100,
        gameDuration: 120000,
        rocketSpeed: 5,
        targetLaunches: 3,
      }
    } else if (age >= 7 && age <= 12) {
      return {
        signalDuration: { min: 1000, max: 2000 },
        intervalDuration: { min: 1000, max: 2000 },
        signalSize: 80,
        gameDuration: 120000,
        rocketSpeed: 7,
        targetLaunches: 5,
      }
    } else {
      return {
        signalDuration: { min: 800, max: 1500 },
        intervalDuration: { min: 800, max: 1500 },
        signalSize: 60,
        gameDuration: 120000,
        rocketSpeed: 10,
        targetLaunches: 7,
      }
    }
  }

  const config = getGameConfig()

  const initializeGame = () => {
    console.log("Initializing game...")
    setSignal({ type: "red", active: false, timeRemaining: 0 })
    setRocket({ launched: false, y: 0, speed: 0 })
    setFalsePositives(0)
    setPrematureResponses(0)
    setReactionTimes([])
    setGazeShifts(0)
    setStartTime(Date.now())
    setGameTime(0)
    setSuccessfulLaunches(0)
    setTargetLaunches(config.targetLaunches)
    setGameState("playing")
  }

  useEffect(() => {
    if (gameState !== "playing") return

    const handleKeyDown = (e: { code: string; preventDefault: () => void }) => {
      if (e.code === "Space") {
        e.preventDefault()

        if (rocket.launched) return

        if (signal.active) {
          if (signal.type === "green") {
            const now = Date.now()
            const reactionTime = now - signalStartTime
            setReactionTimes((prev) => [...prev, reactionTime])
            setRocket({ launched: true, y: 0, speed: config.rocketSpeed })
            setSuccessfulLaunches((prev) => prev + 1)
          } else {
            setFalsePositives((prev) => prev + 1)
          }
        } else {
          setPrematureResponses((prev) => prev + 1)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [gameState, signal, rocket, signalStartTime, config.rocketSpeed])

  const handleCanvasClick = () => {
    if (gameState !== "playing" || rocket.launched) return

    if (signal.active) {
      if (signal.type === "green") {
        const now = Date.now()
        const reactionTime = now - signalStartTime
        setReactionTimes((prev) => [...prev, reactionTime])
        setRocket({ launched: true, y: 0, speed: config.rocketSpeed })
        setSuccessfulLaunches((prev) => prev + 1)
      } else {
        setFalsePositives((prev) => prev + 1)
      }
    } else {
      setPrematureResponses((prev) => prev + 1)
    }
  }

  useEffect(() => {
    if (gameState !== "playing") return

    const gameLoop = setInterval(() => {
      const now = Date.now()
      const elapsed = now - startTime
      setGameTime(elapsed)

      if (elapsed >= config.gameDuration || successfulLaunches >= targetLaunches) {
        clearInterval(gameLoop)
        setGameState("complete")
        return
      }

      setSignal((prev) => {
        if (prev.active) {
          if (prev.timeRemaining <= 0) {
            return {
              ...prev,
              active: false,
              timeRemaining: getRandomInt(config.intervalDuration.min, config.intervalDuration.max),
            }
          } else {
            return { ...prev, timeRemaining: prev.timeRemaining - 100 }
          }
        } else {
          if (prev.timeRemaining <= 0) {
            const newSignalType = Math.random() > 0.4 ? "green" : "red"
            setSignalStartTime(now)
            if (Math.random() > 0.7) setGazeShifts((prev) => prev + 1)
            return {
              type: newSignalType,
              active: true,
              timeRemaining: getRandomInt(config.signalDuration.min, config.signalDuration.max),
            }
          } else {
            return { ...prev, timeRemaining: prev.timeRemaining - 100 }
          }
        }
      })
    }, 100)

    return () => clearInterval(gameLoop)
  }, [gameState, startTime, config, successfulLaunches, targetLaunches])

  useEffect(() => {
    if (gameState !== "playing") return

    const canvas = canvasRef.current
    if (!canvas) {
      console.error("Canvas ref is null")
      return
    }

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      console.error("Could not get 2D context")
      return
    }

    const width = canvas.width
    const height = canvas.height

    let animationFrameId: number
    let stars = []
    // Reduced star count from 200 to 100
    for (let i = 0; i < 100; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 1, // Increased minimum star size
        opacity: Math.random() * 0.5 + 0.3, // Reduced opacity range for less twinkling
        speed: Math.random() * 0.3 + 0.1 // Slightly reduced speed range
      })
    }

    const createNebula = (x: number, y: number, radius: number, colors: string[]) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
      colors.forEach((color, index) => gradient.addColorStop(index / (colors.length - 1), color))
      return gradient
    }

    // Removed planet object and related code

    const render = () => {
      ctx.clearRect(0, 0, width, height)
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height)
      bgGradient.addColorStop(0, "#030b2e")
      bgGradient.addColorStop(0.5, "#0c1445")
      bgGradient.addColorStop(1, "#1b0c2e")
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, width, height)

      stars.forEach((star) => {
        star.y += star.speed
        if (star.y > height) { star.y = 0; star.x = Math.random() * width }
        // Reduced twinkling effect
        star.opacity = 0.3 + Math.abs(Math.sin(Date.now() * 0.0005 + stars.indexOf(star))) * 0.4
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fill()
      })

      const platformWidth = 200
      const platformHeight = 60
      const platformGradient = ctx.createLinearGradient(width / 2 - platformWidth / 2, height - platformHeight, width / 2 + platformWidth / 2, height - platformHeight)
      platformGradient.addColorStop(0, "#4158D0")
      platformGradient.addColorStop(0.5, "#C850C0")
      platformGradient.addColorStop(1, "#4158D0")
      ctx.fillStyle = platformGradient
      ctx.beginPath()
      ctx.moveTo(width / 2 - platformWidth / 2, height - platformHeight)
      ctx.lineTo(width / 2 + platformWidth / 2, height - platformHeight)
      ctx.lineTo(width / 2 + platformWidth / 2 - 20, height)
      ctx.lineTo(width / 2 - platformWidth / 2 + 20, height)
      ctx.closePath()
      ctx.fill()

      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(width / 2 - platformWidth / 4, height - platformHeight + 10)
      ctx.lineTo(width / 2 - platformWidth / 4, height - 5)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(width / 2 + platformWidth / 4, height - platformHeight + 10)
      ctx.lineTo(width / 2 + platformWidth / 4, height - 5)
      ctx.stroke()

      const pulseSize = 2 + Math.sin(Date.now() * 0.005) * 2
      const launchCircleGradient = ctx.createRadialGradient(width / 2, height - platformHeight - 2, 0, width / 2, height - platformHeight - 2, 30 + pulseSize)
      launchCircleGradient.addColorStop(0, "rgba(0, 255, 255, 0.8)")
      launchCircleGradient.addColorStop(0.7, "rgba(0, 255, 255, 0.2)")
      launchCircleGradient.addColorStop(1, "rgba(0, 255, 255, 0)")
      ctx.fillStyle = launchCircleGradient
      ctx.beginPath()
      ctx.arc(width / 2, height - platformHeight - 2, 30 + pulseSize, 0, Math.PI * 2)
      ctx.fill()

      if (signal.active) {
        const signalX = width / 2
        const signalY = height / 2 - 50
        const signalGlow = ctx.createRadialGradient(signalX, signalY, 0, signalX, signalY, config.signalSize * 1.5)
        if (signal.type === "green") {
          signalGlow.addColorStop(0, "rgba(0, 255, 100, 0.8)")
          signalGlow.addColorStop(0.4, "rgba(0, 255, 100, 0.5)")
          signalGlow.addColorStop(0.7, "rgba(0, 255, 100, 0.2)")
          signalGlow.addColorStop(1, "rgba(0, 255, 100, 0)")
        } else {
          signalGlow.addColorStop(0, "rgba(255, 0, 50, 0.8)")
          signalGlow.addColorStop(0.4, "rgba(255, 0, 50, 0.5)")
          signalGlow.addColorStop(0.7, "rgba(255, 0, 50, 0.2)")
          signalGlow.addColorStop(1, "rgba(255, 0, 50, 0)")
        }
        ctx.fillStyle = signalGlow
        ctx.beginPath()
        ctx.arc(signalX, signalY, config.signalSize * 1.5, 0, Math.PI * 2)
        ctx.fill()

        const signalGradient = ctx.createRadialGradient(signalX, signalY, 0, signalX, signalY, config.signalSize)
        if (signal.type === "green") {
          signalGradient.addColorStop(0, "#FFFFFF")
          signalGradient.addColorStop(0.2, "#5EFF8F")
          signalGradient.addColorStop(0.8, "#0BA840")
          signalGradient.addColorStop(1, "#076A28")
        } else {
          signalGradient.addColorStop(0, "#FFFFFF")
          signalGradient.addColorStop(0.2, "#FF5E5E")
          signalGradient.addColorStop(0.8, "#A8150B")
          signalGradient.addColorStop(1, "#6A0707")
        }
        ctx.fillStyle = signalGradient
        ctx.beginPath()
        ctx.arc(signalX, signalY, config.signalSize, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = signal.type === "green" ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.3)"
        ctx.beginPath()
        ctx.arc(signalX - config.signalSize * 0.3, signalY - config.signalSize * 0.3, config.signalSize * 0.3, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = "white"
        ctx.font = `bold ${config.signalSize * 0.5}px sans-serif`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(signal.type === "green" ? "GO!" : "WAIT", signalX, signalY)

        const pulseRadius = config.signalSize + (Date.now() % 1000) / 1000 * 30
        ctx.strokeStyle = signal.type === "green" ? "rgba(94, 255, 143, 0.5)" : "rgba(255, 94, 94, 0.5)"
        ctx.lineWidth = 6
        ctx.beginPath()
        ctx.arc(signalX, signalY, pulseRadius, 0, Math.PI * 2)
        ctx.stroke()
      }

      if (rocket.launched) {
        const rocketY = height - 120 - rocket.y
        ctx.save()
        ctx.translate(width / 2, rocketY)
        // Increased rocket size from 1.5x to 2.0x
        ctx.scale(2.0, 2.0)
        ctx.fillStyle = "#fff"
        ctx.beginPath()
        ctx.moveTo(0, -30)
        ctx.lineTo(12, 20)
        ctx.lineTo(-12, 20)
        ctx.closePath()
        ctx.fill()
        ctx.fillStyle = "#C850C0"
        ctx.beginPath()
        ctx.moveTo(-12, 20)
        ctx.lineTo(-22, 30)
        ctx.lineTo(-12, 10)
        ctx.closePath()
        ctx.fill()
        ctx.beginPath()
        ctx.moveTo(12, 20)
        ctx.lineTo(22, 30)
        ctx.lineTo(12, 10)
        ctx.closePath()
        ctx.fill()
        ctx.fillStyle = "#4158D0"
        ctx.beginPath()
        ctx.arc(0, -10, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = `rgba(255, ${getRandomInt(100, 200)}, 0, 0.7)`
        ctx.beginPath()
        ctx.moveTo(-7, 22)
        ctx.lineTo(0, 22 + getRandomInt(12, 22))
        ctx.lineTo(7, 22)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      } else {
        ctx.save()
        ctx.translate(width / 2, height - 120)
        // Increased stationary rocket size from 1.5x to 2.0x
        ctx.scale(2.0, 2.0)
        ctx.fillStyle = "#fff"
        ctx.beginPath()
        ctx.moveTo(0, -30)
        ctx.lineTo(12, 20)
        ctx.lineTo(-12, 20)
        ctx.closePath()
        ctx.fill()
        ctx.fillStyle = "#C850C0"
        ctx.beginPath()
        ctx.moveTo(-12, 20)
        ctx.lineTo(-22, 30)
        ctx.lineTo(-12, 10)
        ctx.closePath()
        ctx.fill()
        ctx.beginPath()
        ctx.moveTo(12, 20)
        ctx.lineTo(22, 30)
        ctx.lineTo(12, 10)
        ctx.closePath()
        ctx.fill()
        ctx.fillStyle = "#4158D0"
        ctx.beginPath()
        ctx.arc(0, -10, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => cancelAnimationFrame(animationFrameId)
  }, [gameState, signal, rocket, config])

  useEffect(() => {
    if (!rocket.launched) return
    let rafId: number
    const animate = () => {
      setRocket((prev) => {
        if (prev.y < (canvasRef.current ? canvasRef.current.height : 400)) {
          return { ...prev, y: prev.y + prev.speed }
        } else {
          setTimeout(() => setRocket({ launched: false, y: 0, speed: config.rocketSpeed }), 500)
          return prev
        }
      })
      rafId = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(rafId)
  }, [rocket.launched, config.rocketSpeed])

  useEffect(() => {
    if (gameState !== "complete") return
    const playtime_min = Math.round(gameTime / 60000)
    const avgReactionTime = reactionTimes.length > 0 ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length) : 0

    // Normalize metrics to match model ranges
    const normalizedMetrics: GameMetrics = {
      age,
      adhd_status: 0,
      playtime_min: Math.min(Math.max(playtime_min * 2, 0.1), 2.0), // Scale to 0.1-2.0
      session_incomplete: successfulLaunches < targetLaunches ? 1 : 0,
      wfs_fpr: Math.min(Math.max(falsePositives * 5, 0), 20), // Scale to 0-20
      wfs_prc: Math.min(Math.max(prematureResponses * 5, 0), 20), // Scale to 0-20
      wfs_rt: Math.min(Math.max(avgReactionTime / 50, 0), 50), // Scale to 0-50 (ms/50 for normalization)
      wfs_gs: Math.min(Math.max(gazeShifts * 2, 0), 10), // Scale to 0-10
      wfs_gs_total: gazeShifts,
    }

    console.log("Calculated Metrics:", normalizedMetrics)
    if (onComplete) onComplete(normalizedMetrics)
  }, [gameState])

  useEffect(() => {
    const resizeCanvas = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth < 600 ? window.innerWidth - 20 : 500
        canvasRef.current.height = 400
      }
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)
    return () => window.removeEventListener("resize", resizeCanvas)
  }, [])

  return (
    <Card className="flex flex-col items-center p-4 w-full max-w-lg mx-auto">
      {gameState === "intro" && (
        <div className="flex flex-col items-center gap-4">
          <Sparkles size={36} className="text-blue-400" />
          <h2 className="text-2xl font-bold">Wait For Signal</h2>
          <p className="text-center">
            When you see <span className="text-green-400 font-bold">GO!</span>, press <b>Space</b> (or tap the screen) to launch the rocket.<br />
            If you see <span className="text-red-400 font-bold">WAIT</span>, <b>do not press</b> anything!
          </p>
          <Button onClick={initializeGame} className="mt-4">
            Start Game
          </Button>
        </div>
      )}

      {gameState === "playing" && (
        <div className="flex flex-col items-center w-full">
          <canvas
            ref={canvasRef}
            width={600}
            height={650}
            className="border rounded-lg w-full"
            style={{ touchAction: "manipulation", maxWidth: "100%" }}
            tabIndex={0}
            onClick={handleCanvasClick}
          />
          <div className="flex justify-between w-full mt-2 text-xs text-gray-400">
            <span>Launches: {successfulLaunches}/{targetLaunches}</span>
            <span>Time: {Math.max(0, Math.round((config.gameDuration - gameTime) / 1000))}s</span>
          </div>
        </div>
      )}

      {gameState === "complete" && (
        <div className="flex flex-col items-center gap-4">
          <RocketIcon size={36} className="text-green-400" />
          <h2 className="text-2xl font-bold">Mission Complete!</h2>
          <div className="w-full text-left">
            <div>Successful Launches: <b>{successfulLaunches}</b></div>
            <div>False Positives: <b>{falsePositives}</b></div>
            <div>Premature Responses: <b>{prematureResponses}</b></div>
            <div>Avg. Reaction Time: <b>{reactionTimes.length > 0 ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length) : 0} ms</b></div>
            <div>Gaze Shifts: <b>{gazeShifts}</b></div>
          </div>
          <Button onClick={initializeGame}>Play Again</Button>
        </div>
      )}
    </Card>
  )
}