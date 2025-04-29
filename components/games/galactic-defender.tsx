"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import type { Threat, GameMetrics } from "@/lib/types"
import { getRandomInt } from "@/lib/utils"

interface GalacticDefenderProps {
  age: number
  onComplete: (metrics: GameMetrics) => void
}

export default function GalacticDefender({ age, onComplete }: GalacticDefenderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<"intro" | "countdown" | "playing" | "complete">("intro")
  const [showInstructions, setShowInstructions] = useState(true)
  const [showDemo, setShowDemo] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [threats, setThreats] = useState<Threat[]>([])
  const [health, setHealth] = useState(100)
  const [score, setScore] = useState(0)
  const [shieldEnergy, setShieldEnergy] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [gameTime, setGameTime] = useState(0)
  const [reticleActive, setReticleActive] = useState(false)
  const [impulseErrors, setImpulseErrors] = useState(0)
  const [sustainedFailures, setSustainedFailures] = useState(0)
  const [reactionTimes, setReactionTimes] = useState<number[]>([])
  const [movementVariance, setMovementVariance] = useState(0)
  const [lastReticleTime, setLastReticleTime] = useState(0)
  const [beamActive, setBeamActive] = useState(false)
  const [beamTarget, setBeamTarget] = useState<{ x: number; y: number } | null>(null)

  // Game configuration based on age
  const getGameConfig = () => {
    if (age >= 4 && age <= 6) {
      return {
        gameDuration: 120000, // 2 minutes
        threatSpawnRate: 3000, // ms between threats
        threatSpeed: { min: 1, max: 2 },
        reticleBlinkRate: 1500, // ms between blinks
        shieldChargeRate: 2, // energy points per 100ms
        difficultyMultiplier: 0.7,
      }
    } else if (age >= 7 && age <= 12) {
      return {
        gameDuration: 180000, // 3 minutes
        threatSpawnRate: 2000,
        threatSpeed: { min: 1.5, max: 3 },
        reticleBlinkRate: 1200,
        shieldChargeRate: 1.5,
        difficultyMultiplier: 1.0,
      }
    } else {
      return {
        gameDuration: 180000, // 3 minutes
        threatSpawnRate: 1500,
        threatSpeed: { min: 2, max: 4 },
        reticleBlinkRate: 1000,
        shieldChargeRate: 1,
        difficultyMultiplier: 1.3,
      }
    }
  }

  const config = getGameConfig()

  // Initialize game
  const initializeGame = () => {
    setThreats([])
    setHealth(100)
    setScore(0)
    setShieldEnergy(0)
    setImpulseErrors(0)
    setSustainedFailures(0)
    setReactionTimes([])
    setMovementVariance(0)
    setGameState("countdown")

    // Start countdown
    let count = 5
    setCountdown(count)
    const countdownInterval = setInterval(() => {
      count -= 1
      setCountdown(count)
      if (count <= 0) {
        clearInterval(countdownInterval)
        setStartTime(Date.now())
        setGameTime(0)
        setGameState("playing")
      }
    }, 1000)
  }

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== "playing") return

    // If shield energy is not full, clicking is an impulse error
    if (shieldEnergy < 100) {
      setImpulseErrors((prev) => prev + 1)
      return
    }

    // If reticle is not active, clicking is an impulse error
    if (!reticleActive) {
      setImpulseErrors((prev) => prev + 1)
      return
    }

    // Calculate reaction time
    const now = Date.now()
    const reactionTime = now - lastReticleTime
    setReactionTimes((prev) => [...prev, reactionTime])

    // Find the threat that is currently lockable
    const lockableThreat = threats.find((threat) => threat.lockable && !threat.locked && !threat.destroyed)

    if (lockableThreat) {
      // Lock the threat
      setThreats((prev) =>
        prev.map((threat) => (threat.id === lockableThreat.id ? { ...threat, locked: true } : threat)),
      )

      // Fire beam at the threat
      setBeamActive(true)
      setBeamTarget({ x: lockableThreat.x, y: lockableThreat.y })

      // Reset shield energy
      setShieldEnergy(0)

      // Increase score
      setScore((prev) => prev + 1)

      // After beam animation, destroy the threat
      setTimeout(() => {
        setBeamActive(false)
        setBeamTarget(null)

        setThreats((prev) =>
          prev.map((threat) => (threat.id === lockableThreat.id ? { ...threat, destroyed: true } : threat)),
        )
      }, 500)
    }
  }

  // Calculate metrics and call onComplete
  function calculateMetrics() {
    const avgReactionTime =
      reactionTimes.length > 0
        ? Math.round(reactionTimes.reduce((acc, t) => acc + t, 0) / reactionTimes.length)
        : 0
    const metrics: GameMetrics = {
      score,
      health,
      impulseErrors,
      sustainedFailures,
      avgReactionTime,
      movementVariance: Math.round(movementVariance * 100) / 100,
      duration: Math.round(gameTime / 1000),
    }
    onComplete(metrics)
  }

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") return

    const gameLoop = setInterval(() => {
      const now = Date.now()
      const elapsed = now - startTime
      setGameTime(elapsed)

      // Check if game time is up
      if (elapsed >= config.gameDuration) {
        clearInterval(gameLoop)
        setGameState("complete")
        calculateMetrics()
        return
      }

      // Charge shield energy
      setShieldEnergy((prev) => Math.min(100, prev + config.shieldChargeRate))

      // Spawn new threats
      if (elapsed % config.threatSpawnRate < 100) {
        const newThreat: Threat = {
          id: Date.now(),
          x: getRandomInt(50, canvasRef.current?.width ? canvasRef.current.width - 50 : 750),
          y: -50,
          type: Math.random() > 0.5 ? "alien" : "meteor",
          speed: getRandomInt(config.threatSpeed.min * 10, config.threatSpeed.max * 10) / 10,
          lockable: false,
          locked: false,
          destroyed: false,
        }
        setThreats((prev) => [...prev, newThreat])
      }

      // Make a random threat lockable
      if (elapsed % config.reticleBlinkRate < 100) {
        const unlockableThreats = threats.filter(
          (threat) => !threat.lockable && !threat.locked && !threat.destroyed && threat.y > 50 && threat.y < 400,
        )
        if (unlockableThreats.length > 0) {
          const randomThreat = unlockableThreats[Math.floor(Math.random() * unlockableThreats.length)]
          setThreats((prev) =>
            prev.map((threat) => (threat.id === randomThreat.id ? { ...threat, lockable: true } : threat)),
          )
          setReticleActive(true)
          setLastReticleTime(now)
          setTimeout(() => {
            setReticleActive(false)
            setThreats((prev) => {
              const threat = prev.find((t) => t.id === randomThreat.id)
              if (threat && threat.lockable && !threat.locked && !threat.destroyed) {
                setSustainedFailures((prev) => prev + 1)
                return prev.map((t) => (t.id === randomThreat.id ? { ...t, lockable: false } : t))
              }
              return prev
            })
          }, 1000)
        }
      }

      // Update threats
      setThreats((prev) => {
        const updatedThreats = prev.map((threat) => {
          if (threat.destroyed) {
            return { ...threat, y: threat.y - 10 }
          }
          const newY = threat.y + threat.speed
          if (newY > (canvasRef.current?.height ? canvasRef.current.height : 600) && !threat.destroyed) {
            setHealth((h) => Math.max(0, h - (threat.type === "alien" ? 5 : 10)))
            return { ...threat, y: newY, destroyed: true }
          }
          return { ...threat, y: newY }
        })
        return updatedThreats.filter(
          (threat) => threat.y > -100 && threat.y < (canvasRef.current?.height ? canvasRef.current.height + 100 : 700),
        )
      })

      // Check if health is depleted
      if (health <= 0) {
        clearInterval(gameLoop)
        setGameState("complete")
        calculateMetrics()
      }

      // Simulate movement variance (for metrics)
      if (Math.random() > 0.9) {
        setMovementVariance((prev) => prev + Math.random() * 0.5)
      }
    }, 100)

    return () => {
      clearInterval(gameLoop)
    }
  }, [gameState, startTime, threats, health, config, reticleActive])

  // Animation loop
  useEffect(() => {
    if (gameState !== "playing" && gameState !== "countdown") return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    let animationFrameId: number

    const render = () => {
      // Space background
      ctx.fillStyle = "#0b1026"
      ctx.fillRect(0, 0, width, height)
      // Stars
      for (let i = 0; i < 60; i++) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.7 + 0.3})`
        ctx.beginPath()
        ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 1.5 + 0.5, 0, Math.PI * 2)
        ctx.fill()
      }

      if (gameState === "countdown") {
        ctx.fillStyle = "white"
        ctx.font = "bold 72px Arial"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(countdown.toString(), width / 2, height / 2)
        ctx.font = "24px Arial"
        ctx.fillText("Get ready to defend your space outpost!", width / 2, height / 2 + 80)
      } else {
        // Outpost
        ctx.fillStyle = "#3a4060"
        ctx.fillRect(width / 2 - 100, height - 50, 200, 50)
        ctx.fillStyle = "#6a7fff"
        ctx.fillRect(width / 2 - 80, height - 70, 160, 20)
        ctx.fillStyle = "#fff"
        ctx.beginPath()
        ctx.arc(width / 2, height - 80, 15, 0, Math.PI * 2)
        ctx.fill()

        // Threats
        threats.forEach((threat) => {
          if (threat.destroyed) {
            if (threat.y > height - 200) {
              const explosionGradient = ctx.createRadialGradient(threat.x, threat.y, 0, threat.x, threat.y, 30)
              explosionGradient.addColorStop(0, "rgba(255, 200, 50, 0.8)")
              explosionGradient.addColorStop(0.5, "rgba(255, 100, 50, 0.5)")
              explosionGradient.addColorStop(1, "transparent")
              ctx.fillStyle = explosionGradient
              ctx.beginPath()
              ctx.arc(threat.x, threat.y, 30, 0, Math.PI * 2)
              ctx.fill()
            }
            return
          }
          if (threat.type === "alien") {
            ctx.fillStyle = "#9D7AFF"
            ctx.beginPath()
            ctx.ellipse(threat.x, threat.y, 25, 15, 0, 0, Math.PI * 2)
            ctx.fill()
            ctx.fillStyle = "#C45EFF"
            ctx.beginPath()
            ctx.arc(threat.x, threat.y - 5, 8, 0, Math.PI * 2)
            ctx.fill()
            const lightColors = ["#FF5E5E", "#5EFF8F", "#5E9DFF"]
            for (let i = 0; i < 3; i++) {
              const angle = (i / 3) * Math.PI * 2
              ctx.fillStyle = lightColors[i]
              ctx.beginPath()
              ctx.arc(threat.x + Math.cos(angle) * 15, threat.y + Math.sin(angle) * 8, 3, 0, Math.PI * 2)
              ctx.fill()
            }
          } else {
            // Meteor
            const meteorGradient = ctx.createRadialGradient(threat.x, threat.y, 0, threat.x, threat.y, 20)
            meteorGradient.addColorStop(0, "#AAA")
            meteorGradient.addColorStop(1, "#666")
            ctx.fillStyle = meteorGradient
            ctx.beginPath()
            ctx.arc(threat.x, threat.y, 20, 0, Math.PI * 2)
            ctx.fill()
            ctx.fillStyle = "#555"
            for (let i = 0; i < 3; i++) {
              const angle = (i / 3) * Math.PI * 2
              const distance = 10 * Math.random()
              ctx.beginPath()
              ctx.arc(
                threat.x + Math.cos(angle) * distance,
                threat.y + Math.sin(angle) * distance,
                4 * Math.random() + 2,
                0,
                Math.PI * 2,
              )
              ctx.fill()
            }
          }
          if (threat.lockable) {
            const pulseSize = Math.sin(Date.now() / 100) * 3 + 30
            ctx.strokeStyle = "#5EFF8F"
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.arc(threat.x, threat.y, pulseSize, 0, Math.PI * 2)
            ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(threat.x - pulseSize - 5, threat.y)
            ctx.lineTo(threat.x - pulseSize + 10, threat.y)
            ctx.moveTo(threat.x + pulseSize - 10, threat.y)
            ctx.lineTo(threat.x + pulseSize + 5, threat.y)
            ctx.moveTo(threat.x, threat.y - pulseSize - 5)
            ctx.lineTo(threat.x, threat.y - pulseSize + 10)
            ctx.moveTo(threat.x, threat.y + pulseSize - 10)
            ctx.lineTo(threat.x, threat.y + pulseSize + 5)
            ctx.stroke()
          }
        })

        // Beam
        if (beamActive && beamTarget) {
          const beamGradient = ctx.createLinearGradient(width / 2, height - 50, beamTarget.x, beamTarget.y)
          beamGradient.addColorStop(0, "rgba(94, 157, 255, 0.8)")
          beamGradient.addColorStop(1, "rgba(94, 157, 255, 0.2)")
          ctx.strokeStyle = beamGradient
          ctx.lineWidth = 5
          ctx.beginPath()
          ctx.moveTo(width / 2, height - 50)
          ctx.lineTo(beamTarget.x, beamTarget.y)
          ctx.stroke()
          const impactGradient = ctx.createRadialGradient(beamTarget.x, beamTarget.y, 0, beamTarget.x, beamTarget.y, 20)
          impactGradient.addColorStop(0, "rgba(94, 157, 255, 0.8)")
          impactGradient.addColorStop(1, "transparent")
          ctx.fillStyle = impactGradient
          ctx.beginPath()
          ctx.arc(beamTarget.x, beamTarget.y, 20, 0, Math.PI * 2)
          ctx.fill()
        }

        // UI: Health bar (spaceship), Energy bar (shield), Score, Time
        // Health
        ctx.fillStyle = "rgba(0,0,0,0.5)"
        ctx.fillRect(20, 20, 200, 20)
        ctx.fillStyle = health > 50 ? "#5EFF8F" : health > 25 ? "#FFDD5E" : "#FF5E5E"
        ctx.fillRect(20, 20, health * 2, 20)
        ctx.strokeStyle = "white"
        ctx.lineWidth = 2
        ctx.strokeRect(20, 20, 200, 20)
        ctx.font = "bold 16px Arial"
        ctx.fillStyle = "#fff"
        ctx.fillText("🚀 Health", 25, 35)

        // Shield
        ctx.fillStyle = "rgba(0,0,0,0.5)"
        ctx.fillRect(20, 50, 200, 20)
        ctx.fillStyle = shieldEnergy === 100 ? "#5EFF8F" : "#5E9DFF"
        ctx.fillRect(20, 50, shieldEnergy * 2, 20)
        ctx.strokeStyle = "white"
        ctx.strokeRect(20, 50, 200, 20)
        ctx.font = "bold 16px Arial"
        ctx.fillStyle = "#fff"
        ctx.fillText("🛡️ Energy", 25, 65)

        // Score & Time
        ctx.font = "bold 24px Arial"
        ctx.textAlign = "right"
        ctx.fillStyle = "#FFD700"
        ctx.fillText(`Score: ${score}`, width - 20, 35)
        ctx.fillStyle = "#5EFF8F"
        const timeLeft = Math.max(0, Math.ceil((config.gameDuration - gameTime) / 1000))
        ctx.fillText(`Time: ${timeLeft}s`, width - 20, 65)

        // Show tip for first 5 seconds
        if (gameTime < 5000) {
          ctx.fillStyle = "rgba(255,255,255,0.9)"
          ctx.font = "bold 18px Arial"
          ctx.textAlign = "center"
          ctx.fillText(
            "Wait for the green circle and full energy, then click the threat!",
            width / 2,
            height - 100,
          )
        }
      }
      animationFrameId = requestAnimationFrame(render)
    }
    render()
    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [
    gameState,
    countdown,
    threats,
    health,
    shieldEnergy,
    score,
    beamActive,
    beamTarget,
    gameTime,
    config,
  ])

  // --- UI & Overlays ---
  return (
    <div style={{ position: "relative", width: 800, height: 600, margin: "auto" }}>
      {/* Instructions Overlay */}
      {showInstructions && (
        <div className="instructions-overlay">
          <div className="instructions-card">
            <img src="/astronaut.png" alt="Mascot" style={{ width: 80, marginBottom: 12 }} />
            <h2 style={{ color: "#FFD700" }}>How to Play</h2>
            <ol style={{ textAlign: "left", color: "#fff", fontSize: 18 }}>
              <li>
                <span role="img" aria-label="target">🎯</span> Wait for the <b>green circle</b> to appear on an alien or meteor.
              </li>
              <li>
                <span role="img" aria-label="shield">🛡️</span> Make sure your <b>energy bar</b> is full and glowing.
              </li>
              <li>
                <span role="img" aria-label="click">🖱️</span> <b>Click</b> the threat to blast it!
              </li>
              <li>
                <span role="img" aria-label="no early click">⏳</span> Don’t click early, or you’ll lose points.
              </li>
            </ol>
            <Button style={{ margin: "8px 8px 0 0" }} onClick={() => setShowDemo(true)}>Watch Demo</Button>
            <Button style={{ margin: 8 }} onClick={() => { setShowInstructions(false); setGameState("intro") }}>Start Game</Button>
          </div>
        </div>
      )}
      {/* Demo Video Overlay */}
      {showDemo && (
        <div className="instructions-overlay">
          <div className="instructions-card">
            <video src="/demo.mp4" autoPlay loop muted style={{ width: 320, borderRadius: 12 }} />
            <Button style={{ marginTop: 16 }} onClick={() => setShowDemo(false)}>
              Back
            </Button>
          </div>
        </div>
      )}
      {/* Main Game Canvas */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{
          borderRadius: 24,
          boxShadow: "0 4px 32px #0008",
          background: "#0b1026",
          display: "block",
        }}
        onClick={handleCanvasClick}
      />
      {/* Mascot Tip */}
      {!showInstructions && (
        <div className="mascot-tip">
          <img src="/astronaut.png" alt="Mascot" style={{ width: 48, marginRight: 10 }} />
          <span>
            {gameState === "playing"
              ? "Tip: Wait for the green circle and full energy before clicking!"
              : "Ready to defend the outpost?"}
          </span>
        </div>
      )}
      {/* Start Button on Intro */}
      {gameState === "intro" && !showInstructions && (
        <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}>
          <Button size="lg" onClick={initializeGame}>
            Start Galactic Defender!
          </Button>
        </div>
      )}
      {/* CSS for overlays */}
      <style jsx>{`
        .instructions-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(10, 20, 40, 0.92);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }
        .instructions-card {
          background: #222e50;
          border-radius: 24px;
          padding: 36px 32px 32px 32px;
          color: #fff;
          box-shadow: 0 8px 32px rgba(0,0,0,0.35);
          max-width: 400px;
          text-align: center;
        }
        .mascot-tip {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(34, 46, 80, 0.7);
          border-radius: 12px;
          padding: 8px 16px;
          position: absolute;
          left: 24px;
          bottom: 24px;
          color: #fff;
          font-size: 1.1rem;
          z-index: 2;
        }
      `}</style>
    </div>
  )
}
