"use client"

import { useEffect, useRef } from "react"

export function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas to full screen
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener("resize", resizeCanvas)
    resizeCanvas()

    // Calculate the center area to avoid (50% of screen, more breathing room)
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const avoidCenterRadiusX = canvas.width * 0.25
    const avoidCenterRadiusY = canvas.height * 0.25

    // Function to check if a position is in the center area
    const isInCenter = (x: number, y: number) => {
      return Math.abs(x - centerX) < avoidCenterRadiusX && Math.abs(y - centerY) < avoidCenterRadiusY
    }

    // Helper to check if a position is far enough from others
    function isFarFromOthers(x: number, y: number, arr: { x: number; y: number }[], minDist: number) {
      return arr.every((obj) => {
        const dx = obj.x - x
        const dy = obj.y - y
        return dx * dx + dy * dy > minDist * minDist
      })
    }

    // Function to get a random position avoiding the center and other objects
    const getRandomPositionAvoidingCenterAndOthers = (others: { x: number; y: number }[], minDist: number) => {
      let x,
        y,
        tries = 0
      do {
        x = Math.random() * canvas.width
        y = Math.random() * canvas.height
        tries++
        if (tries > 100) break // fallback
      } while (isInCenter(x, y) || !isFarFromOthers(x, y, others, minDist))
      return { x, y }
    }

    // Create stars with different directions and twinkling (reduce count)
    const stars: {
      x: number
      y: number
      radius: number
      speedX: number
      speedY: number
      twinkleSpeed: number
      twinkleVal: number
    }[] = []
    for (let i = 0; i < 130; i++) {
      const pos = getRandomPositionAvoidingCenterAndOthers(stars, 12)
      stars.push({
        x: pos.x,
        y: pos.y,
        radius: 0.7 + Math.random() * 2.1,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        twinkleSpeed: 0.02 + Math.random() * 0.05,
        twinkleVal: Math.random() * Math.PI * 2,
      })
    }

    // Create planets with rings, floating around the edges (reduce count, space out)
    const planets: {
      x: number
      y: number
      radius: number
      color: string
      speedX: number
      speedY: number
      hasRings: boolean
      ringColor: string
      ringRotation: number
      rotationSpeed: number
      moons: { radius: number; distance: number; angle: number; speed: number; color: string }[]
      surfaceType: "bands" | "spots"
      surfaceFeatures: { offsetX: number; offsetY: number; radius: number; color: string }[]
    }[] = []

    const planetColors = [
      "#FF9D7A", // Orange-red
      "#7AFFAF", // Green
      "#7AA8FF", // Blue
      "#F67AFF", // Purple
      "#FFEA7A", // Yellow
      "#9D7AFF", // Purple
    ]

    for (let i = 0; i < 5; i++) {
      // fewer planets
      const pos = getRandomPositionAvoidingCenterAndOthers(planets, 220)
      const hasRings = Math.random() > 0.3
      // Generate 0-2 moons
      const moonCount = Math.floor(Math.random() * 3)
      const moons = []
      for (let j = 0; j < moonCount; j++) {
        moons.push({
          radius: 3 + Math.random() * 6,
          distance: 40 + Math.random() * 50,
          angle: Math.random() * Math.PI * 2,
          speed: 0.02 + Math.random() * 0.04,
          color: "#FFFFFF",
        })
      }
      // Precompute surface features for stability
      const surfaceType = Math.random() > 0.5 ? "bands" : "spots"
      const surfaceFeatures: { offsetX: number; offsetY: number; radius: number; color: string }[] = []
      const baseColor = planetColors[i]
      if (surfaceType === "bands") {
        for (let b = 0; b < 3; b++) {
          surfaceFeatures.push({
            offsetX: 0,
            offsetY: 0,
            radius: 1,
            color: shadeColor(baseColor, b % 2 === 0 ? 20 : -20) + "55",
          })
        }
      } else {
        for (let s = 0; s < 3; s++) {
          surfaceFeatures.push({
            offsetX: (Math.random() - 0.5) * 0.8,
            offsetY: (Math.random() - 0.5) * 0.8,
            radius: 0.2 * Math.random(),
            color: shadeColor(baseColor, s % 2 === 0 ? 30 : -30) + "55",
          })
        }
      }
      planets.push({
        x: pos.x,
        y: pos.y,
        radius: 20 + Math.random() * 28,
        color: baseColor,
        speedX: (Math.random() - 0.5) * 0.13,
        speedY: (Math.random() - 0.5) * 0.13,
        hasRings,
        ringColor: hasRings ? planetColors[(i + 2) % planetColors.length] + "88" : "",
        ringRotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.003,
        moons,
        surfaceType,
        surfaceFeatures,
      })
    }

    // Create enhanced and BIGGER spaceships (reduce count, space out)
    const spaceships: {
      x: number
      y: number
      speedX: number
      speedY: number
      size: number
      rotation: number
      rotationSpeed: number
      thrusterSize: number
      thrusterFlicker: number
      type: number
    }[] = []

    for (let i = 0; i < 2; i++) {
      const pos = getRandomPositionAvoidingCenterAndOthers(spaceships, 300)
      spaceships.push({
        x: pos.x,
        y: pos.y,
        speedX: (Math.random() - 0.5) * 1.1,
        speedY: (Math.random() - 0.5) * 1.5,
        size: 40 + Math.random() * 35,
        rotation: Math.random() * Math.PI * 1.5,
        rotationSpeed: (Math.random() - 0.5) * 0.015,
        thrusterSize: 0.5 + Math.random() * 0.5,
        thrusterFlicker: 0,
        type: Math.floor(Math.random() * 3),
      })
    }

    // Create comets with tails (reduce count, space out)
    const comets: {
      x: number
      y: number
      radius: number
      speedX: number
      speedY: number
      tailLength: number
      color: string
    }[] = []

    for (let i = 0; i < 2; i++) {
      const pos = getRandomPositionAvoidingCenterAndOthers(comets, 350)
      const speedX = (Math.random() - 0.5) * 4
      const speedY = (Math.random() - 0.5) * 4
      comets.push({
        x: pos.x,
        y: pos.y,
        radius: 3 + Math.random() * 4,
        speedX,
        speedY,
        tailLength: 90 + Math.random() * 100,
        color: planetColors[Math.floor(Math.random() * planetColors.length)],
      })
    }

    // Create nebulas (gradient clouds) around the edges (reduce count, space out)
    const nebulas: {
      x: number
      y: number
      radius: number
      colors: string[]
    }[] = []

    const nebulaColorSets = [
      ["#4B0082AA", "#9370DBAA", "transparent"], // Purple nebula
      ["#191970AA", "#4169E1AA", "transparent"], // Deep blue nebula
      ["#800080AA", "#FF69B4AA", "transparent"], // Purple-pink nebula
      ["#483D8BAA", "#6A5ACDAA", "transparent"], // Slate blue nebula
    ]

    for (let i = 0; i < 2; i++) {
      const pos = getRandomPositionAvoidingCenterAndOthers(nebulas, 400)
      nebulas.push({
        x: pos.x,
        y: pos.y,
        radius: 150 + Math.random() * 220,
        colors: nebulaColorSets[i % nebulaColorSets.length],
      })
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw background with enhanced gradient
      const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, canvas.height)
      bgGradient.addColorStop(0, "#0A0E29")
      bgGradient.addColorStop(0.3, "#1A1040") // Deep purple
      bgGradient.addColorStop(0.6, "#0F0A29")
      bgGradient.addColorStop(0.8, "#050520") // Near black
      bgGradient.addColorStop(1, "#000814") // Very dark blue
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw nebulas
      nebulas.forEach((nebula) => {
        const gradient = ctx.createRadialGradient(nebula.x, nebula.y, 0, nebula.x, nebula.y, nebula.radius)

        nebula.colors.forEach((color, index) => {
          gradient.addColorStop(index / (nebula.colors.length - 1), color)
        })

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(nebula.x, nebula.y, nebula.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw stars with twinkling effect
      stars.forEach((star) => {
        // Update twinkle value
        star.twinkleVal += star.twinkleSpeed
        const twinkleFactor = 0.5 + Math.sin(star.twinkleVal) * 0.5

        // Draw star with variable brightness
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + twinkleFactor * 0.5})`
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius * twinkleFactor, 0, Math.PI * 2)
        ctx.fill()

        // Add glow to larger stars
        if (star.radius > 1.5) {
          const glowGradient = ctx.createRadialGradient(
            star.x,
            star.y,
            star.radius * 0.5,
            star.x,
            star.y,
            star.radius * 4,
          )
          glowGradient.addColorStop(0, `rgba(255, 255, 255, ${0.3 * twinkleFactor})`)
          glowGradient.addColorStop(1, "transparent")

          ctx.fillStyle = glowGradient
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.radius * 4, 0, Math.PI * 2)
          ctx.fill()
        }

        // Move stars
        star.x += star.speedX
        star.y += star.speedY

        // Wrap stars around screen edges
        if (star.x < -star.radius * 2) star.x = canvas.width + star.radius
        if (star.x > canvas.width + star.radius * 2) star.x = -star.radius
        if (star.y < -star.radius * 2) star.y = canvas.height + star.radius
        if (star.y > canvas.height + star.radius * 2) star.y = -star.radius
      })

      // Draw planets with rings and moons
      planets.forEach((planet) => {
        // Update planet rotation and position
        planet.ringRotation += planet.rotationSpeed

        planet.x += planet.speedX
        planet.y += planet.speedY

        // Bounce planets off edges
        if (planet.x < planet.radius || planet.x > canvas.width - planet.radius) {
          planet.speedX *= -1
          // Adjust position to avoid getting stuck
          planet.x = planet.x < planet.radius ? planet.radius : canvas.width - planet.radius
        }
        if (planet.y < planet.radius || planet.y > canvas.height - planet.radius) {
          planet.speedY *= -1
          // Adjust position to avoid getting stuck
          planet.y = planet.y < planet.radius ? planet.radius : canvas.height - planet.radius
        }

        // Avoid center region by checking and adjusting course if needed
        if (isInCenter(planet.x, planet.y)) {
          // Find direction away from center
          const dirX = planet.x - centerX
          const dirY = planet.y - centerY
          const mag = Math.sqrt(dirX * dirX + dirY * dirY)

          // Adjust velocity to move away from center
          if (mag > 0) {
            planet.speedX = (0.5 * dirX) / mag
            planet.speedY = (0.5 * dirY) / mag
          }
        }

        // Draw rings if the planet has them
        if (planet.hasRings) {
          ctx.save()
          ctx.translate(planet.x, planet.y)
          ctx.rotate(planet.ringRotation) // Rotate the rings

          // Draw the rings with gradient
          const ringGradient = ctx.createLinearGradient(-planet.radius * 2, 0, planet.radius * 2, 0)
          ringGradient.addColorStop(0, planet.ringColor)
          ringGradient.addColorStop(0.5, shadeColor(planet.ringColor, 30))
          ringGradient.addColorStop(1, planet.ringColor)

          ctx.strokeStyle = ringGradient
          ctx.lineWidth = 6
          ctx.beginPath()
          ctx.ellipse(0, 0, planet.radius * 2, planet.radius * 0.6, 0, 0, Math.PI * 2)
          ctx.stroke()

          // Add a second, thinner ring
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.ellipse(0, 0, planet.radius * 1.7, planet.radius * 0.5, 0, 0, Math.PI * 2)
          ctx.stroke()

          ctx.restore()
        }

        // Draw planet
        ctx.beginPath()
        ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2)

        // Create gradient fill for planet with more vibrant colors
        const gradient = ctx.createRadialGradient(
          planet.x - planet.radius * 0.3,
          planet.y - planet.radius * 0.3,
          0,
          planet.x,
          planet.y,
          planet.radius,
        )
        gradient.addColorStop(0, planet.color)
        gradient.addColorStop(0.7, shadeColor(planet.color, -20))
        gradient.addColorStop(1, shadeColor(planet.color, -40))
        ctx.fillStyle = gradient
        ctx.fill()

        // Add a glow effect
        const glowGradient = ctx.createRadialGradient(
          planet.x,
          planet.y,
          planet.radius * 0.8,
          planet.x,
          planet.y,
          planet.radius * 2.5,
        )
        glowGradient.addColorStop(0, planet.color + "44")
        glowGradient.addColorStop(1, "transparent")

        ctx.beginPath()
        ctx.arc(planet.x, planet.y, planet.radius * 2.5, 0, Math.PI * 2)
        ctx.fillStyle = glowGradient
        ctx.fill()

        // Draw surface details for larger planets (use precomputed features)
        if (planet.radius > 25) {
          ctx.save()
          ctx.translate(planet.x, planet.y)
          if (planet.surfaceType === "bands") {
            for (let b = 0; b < planet.surfaceFeatures.length; b++) {
              const f = planet.surfaceFeatures[b]
              ctx.fillStyle = f.color
              ctx.beginPath()
              ctx.arc(0, 0, planet.radius, 0, Math.PI * 2)
              ctx.arc(0, f.offsetY * planet.radius, planet.radius, 0, Math.PI * 2, true)
              ctx.fill()
            }
          } else {
            for (let s = 0; s < planet.surfaceFeatures.length; s++) {
              const f = planet.surfaceFeatures[s]
              ctx.fillStyle = f.color
              ctx.beginPath()
              ctx.arc(f.offsetX * planet.radius, f.offsetY * planet.radius, planet.radius * f.radius, 0, Math.PI * 2)
              ctx.fill()
            }
          }
          ctx.restore()
        }

        // Draw moons
        planet.moons.forEach((moon) => {
          moon.angle += moon.speed
          const moonX = planet.x + Math.cos(moon.angle) * moon.distance
          const moonY = planet.y + Math.sin(moon.angle) * moon.distance

          // Draw moon with gradient
          const moonGradient = ctx.createRadialGradient(
            moonX - moon.radius * 0.3,
            moonY - moon.radius * 0.3,
            0,
            moonX,
            moonY,
            moon.radius,
          )
          moonGradient.addColorStop(0, "#FFFFFF")
          moonGradient.addColorStop(1, "#AAAAAA")

          ctx.beginPath()
          ctx.arc(moonX, moonY, moon.radius, 0, Math.PI * 2)
          ctx.fillStyle = moonGradient
          ctx.fill()

          // Add moon glow
          const moonGlow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, moon.radius * 3)
          moonGlow.addColorStop(0, "rgba(255, 255, 255, 0.3)")
          moonGlow.addColorStop(1, "transparent")

          ctx.beginPath()
          ctx.arc(moonX, moonY, moon.radius * 3, 0, Math.PI * 2)
          ctx.fillStyle = moonGlow
          ctx.fill()
        })
      })

      // Draw comets with glowing tails
      comets.forEach((comet) => {
        // Draw tail as gradient
        const tailGradient = ctx.createLinearGradient(
          comet.x,
          comet.y,
          comet.x - comet.speedX * comet.tailLength,
          comet.y - comet.speedY * comet.tailLength,
        )
        tailGradient.addColorStop(0, comet.color + "FF")
        tailGradient.addColorStop(0.4, comet.color + "99")
        tailGradient.addColorStop(1, "transparent")

        ctx.beginPath()
        ctx.moveTo(comet.x, comet.y)

        // Calculate perpendicular direction for tail width
        const perpX = -comet.speedY
        const perpY = comet.speedX
        const perpLength = Math.sqrt(perpX * perpX + perpY * perpY)
        const normPerpX = (perpX / perpLength) * comet.radius * 1.5
        const normPerpY = (perpY / perpLength) * comet.radius * 1.5

        // Create tail path
        ctx.lineTo(comet.x + normPerpX, comet.y + normPerpY)
        ctx.lineTo(
          comet.x - comet.speedX * comet.tailLength + normPerpX,
          comet.y - comet.speedY * comet.tailLength + normPerpY,
        )
        ctx.lineTo(
          comet.x - comet.speedX * comet.tailLength - normPerpX,
          comet.y - comet.speedY * comet.tailLength - normPerpY,
        )
        ctx.lineTo(comet.x - normPerpX, comet.y - normPerpY)
        ctx.closePath()

        ctx.fillStyle = tailGradient
        ctx.fill()

        // Draw comet head with glow
        const headGradient = ctx.createRadialGradient(comet.x, comet.y, 0, comet.x, comet.y, comet.radius * 2)
        headGradient.addColorStop(0, "#FFFFFF")
        headGradient.addColorStop(0.5, comet.color + "DD")
        headGradient.addColorStop(1, "transparent")

        ctx.beginPath()
        ctx.arc(comet.x, comet.y, comet.radius * 2, 0, Math.PI * 2)
        ctx.fillStyle = headGradient
        ctx.fill()

        // Update comet position
        comet.x += comet.speedX
        comet.y += comet.speedY

        // Wrap comets around screen edges
        if (comet.x < -comet.radius * 2) comet.x = canvas.width + comet.radius
        if (comet.x > canvas.width + comet.radius * 2) comet.x = -comet.radius
        if (comet.y < -comet.radius * 2) comet.y = canvas.height + comet.radius
        if (comet.y > canvas.height + comet.radius * 2) comet.y = -comet.radius

        // Avoid center region by checking and adjusting course if needed
        if (isInCenter(comet.x, comet.y)) {
          // Adjust velocity to avoid center
          comet.speedX *= -1
          comet.speedY *= -1
        }
      })

      // Draw enhanced and bigger spaceships
      spaceships.forEach((ship) => {
        ctx.save()
        ctx.translate(ship.x, ship.y)
        ctx.rotate(ship.rotation)

        // Update ship rotation
        ship.rotation += ship.rotationSpeed

        // Thruster animation
        ship.thrusterFlicker = Math.random()

        // Draw different ship types
        if (ship.type === 0) {
          // Sleek modern spaceship

          // Main body
          const bodyGradient = ctx.createLinearGradient(-ship.size * 0.4, 0, ship.size * 0.6, 0)
          bodyGradient.addColorStop(0, "#AAAAAA")
          bodyGradient.addColorStop(0.5, "#FFFFFF")
          bodyGradient.addColorStop(1, "#DDDDDD")

          ctx.fillStyle = bodyGradient
          ctx.beginPath()
          ctx.moveTo(ship.size * 0.6, 0)
          ctx.lineTo(-ship.size * 0.4, ship.size * 0.3)
          ctx.lineTo(-ship.size * 0.4, -ship.size * 0.3)
          ctx.closePath()
          ctx.fill()

          // Wing accents
          const wingGradient = ctx.createLinearGradient(-ship.size * 0.4, 0, -ship.size * 0.2, 0)
          wingGradient.addColorStop(0, "#5D7DF5")
          wingGradient.addColorStop(1, "#7AA8FF")

          ctx.fillStyle = wingGradient
          ctx.beginPath()
          ctx.moveTo(-ship.size * 0.2, ship.size * 0.3)
          ctx.lineTo(-ship.size * 0.4, ship.size * 0.3)
          ctx.lineTo(-ship.size * 0.4, ship.size * 0.1)
          ctx.closePath()
          ctx.fill()

          ctx.beginPath()
          ctx.moveTo(-ship.size * 0.2, -ship.size * 0.3)
          ctx.lineTo(-ship.size * 0.4, -ship.size * 0.3)
          ctx.lineTo(-ship.size * 0.4, -ship.size * 0.1)
          ctx.closePath()
          ctx.fill()

          // Cockpit with glow
          const cockpitGradient = ctx.createRadialGradient(ship.size * 0.1, 0, 0, ship.size * 0.1, 0, ship.size * 0.25)
          cockpitGradient.addColorStop(0, "#A0D8FF")
          cockpitGradient.addColorStop(1, "#59ADFF")

          ctx.fillStyle = cockpitGradient
          ctx.beginPath()
          ctx.ellipse(ship.size * 0.1, 0, ship.size * 0.3, ship.size * 0.15, 0, 0, Math.PI * 2)
          ctx.fill()

          // Cockpit glow
          const cockpitGlow = ctx.createRadialGradient(ship.size * 0.1, 0, 0, ship.size * 0.1, 0, ship.size * 0.5)
          cockpitGlow.addColorStop(0, "rgba(160, 216, 255, 0.4)")
          cockpitGlow.addColorStop(1, "transparent")

          ctx.fillStyle = cockpitGlow
          ctx.beginPath()
          ctx.ellipse(ship.size * 0.1, 0, ship.size * 0.5, ship.size * 0.3, 0, 0, Math.PI * 2)
          ctx.fill()

          // Thruster
          const thrusterGradient = ctx.createLinearGradient(
            -ship.size * 0.4,
            0,
            -ship.size * (0.9 + ship.thrusterFlicker * 0.6),
            0,
          )
          thrusterGradient.addColorStop(0, "#FF9D7A")
          thrusterGradient.addColorStop(0.4, "#FF5E5E")
          thrusterGradient.addColorStop(1, "transparent")

          ctx.fillStyle = thrusterGradient
          ctx.beginPath()
          ctx.moveTo(-ship.size * 0.4, ship.size * 0.15)
          ctx.lineTo(-ship.size * (0.9 + ship.thrusterFlicker * 0.6), 0)
          ctx.lineTo(-ship.size * 0.4, -ship.size * 0.15)
          ctx.closePath()
          ctx.fill()
        } else if (ship.type === 1) {
          // Flying saucer style (UFO)

          // Main body
          const shipGradient = ctx.createLinearGradient(0, -ship.size * 0.3, 0, ship.size * 0.3)
          shipGradient.addColorStop(0, "#DDDDDD")
          shipGradient.addColorStop(0.5, "#FFFFFF")
          shipGradient.addColorStop(1, "#AAAAAA")

          ctx.fillStyle = shipGradient
          ctx.beginPath()
          ctx.ellipse(0, 0, ship.size * 0.7, ship.size * 0.25, 0, 0, Math.PI * 2)
          ctx.fill()

          // Dome with glow
          const domeGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, ship.size * 0.3)
          domeGradient.addColorStop(0, "#A0D8FF")
          domeGradient.addColorStop(1, "#59ADFF")

          ctx.fillStyle = domeGradient
          ctx.beginPath()
          ctx.arc(0, 0, ship.size * 0.3, 0, Math.PI, true)
          ctx.fill()

          // Dome glow
          const domeGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, ship.size * 0.5)
          domeGlow.addColorStop(0, "rgba(160, 216, 255, 0.4)")
          domeGlow.addColorStop(1, "transparent")

          ctx.fillStyle = domeGlow
          ctx.beginPath()
          ctx.arc(0, 0, ship.size * 0.5, 0, Math.PI, true)
          ctx.fill()

          // Bottom lights with bright glows
          const lightColors = ["#FF9D7A", "#7AFFAF", "#F67AFF", "#7AA8FF"]
          for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2
            const colorIndex = i % lightColors.length

            // Light
            ctx.fillStyle = lightColors[colorIndex]
            ctx.beginPath()
            ctx.arc(
              Math.cos(angle) * ship.size * 0.5,
              Math.sin(angle) * ship.size * 0.18,
              ship.size * 0.06,
              0,
              Math.PI * 2,
            )
            ctx.fill()

            // Animate light intensity
            const pulseIntensity = 0.5 + (Math.sin(Date.now() / 300 + i) + 1) * 0.25

            // Light beam
            const beamGradient = ctx.createRadialGradient(
              Math.cos(angle) * ship.size * 0.5,
              Math.sin(angle) * ship.size * 0.18,
              0,
              Math.cos(angle) * ship.size * 0.5,
              Math.sin(angle) * ship.size * 0.18,
              ship.size * 0.4,
            )
            beamGradient.addColorStop(0, lightColors[colorIndex] + "CC")
            beamGradient.addColorStop(0.5, lightColors[colorIndex] + "44")
            beamGradient.addColorStop(1, "transparent")

            ctx.fillStyle = beamGradient
            ctx.beginPath()
            ctx.arc(
              Math.cos(angle) * ship.size * 0.5,
              Math.sin(angle) * ship.size * 0.18,
              ship.size * (0.3 + 0.1 * pulseIntensity),
              0,
              Math.PI * 2,
            )
            ctx.fill()
          }

          // Optional tractor beam
          if (Math.random() > 0.97) {
            const tractorGradient = ctx.createRadialGradient(0, 0, 0, 0, ship.size * 2, ship.size * 2)
            tractorGradient.addColorStop(0, "#FF9D7A88")
            tractorGradient.addColorStop(1, "transparent")
            ctx.fillStyle = tractorGradient
            ctx.beginPath()
            ctx.arc(0, ship.size * 0.3, ship.size * 2, 0, Math.PI * 2)
            ctx.fill()
          }
        } else if (ship.type === 2) {
          // Classic rocket style

          // Main body
          const rocketGradient = ctx.createLinearGradient(0, -ship.size * 0.5, 0, ship.size * 0.5)
          rocketGradient.addColorStop(0, "#FFFFFF")
          rocketGradient.addColorStop(1, "#AAAAAA")
          ctx.fillStyle = rocketGradient
          ctx.beginPath()
          ctx.moveTo(0, -ship.size * 0.5)
          ctx.lineTo(ship.size * 0.18, ship.size * 0.3)
          ctx.lineTo(-ship.size * 0.18, ship.size * 0.3)
          ctx.closePath()
          ctx.fill()

          // Fins
          ctx.fillStyle = "#FF9D7A"
          ctx.beginPath()
          ctx.moveTo(-ship.size * 0.18, ship.size * 0.3)
          ctx.lineTo(-ship.size * 0.32, ship.size * 0.5)
          ctx.lineTo(-ship.size * 0.08, ship.size * 0.3)
          ctx.closePath()
          ctx.fill()

          ctx.beginPath()
          ctx.moveTo(ship.size * 0.18, ship.size * 0.3)
          ctx.lineTo(ship.size * 0.32, ship.size * 0.5)
          ctx.lineTo(ship.size * 0.08, ship.size * 0.3)
          ctx.closePath()
          ctx.fill()

          // Window
          ctx.fillStyle = "#7AA8FF"
          ctx.beginPath()
          ctx.arc(0, -ship.size * 0.18, ship.size * 0.09, 0, Math.PI * 2)
          ctx.fill()

          // Thruster flame
          const flameGradient = ctx.createLinearGradient(
            0,
            ship.size * 0.3,
            0,
            ship.size * (0.7 + ship.thrusterFlicker * 0.4),
          )
          flameGradient.addColorStop(0, "#FFFACD")
          flameGradient.addColorStop(0.5, "#FF9D7A")
          flameGradient.addColorStop(1, "transparent")
          ctx.fillStyle = flameGradient
          ctx.beginPath()
          ctx.moveTo(-ship.size * 0.08, ship.size * 0.3)
          ctx.lineTo(0, ship.size * (0.7 + ship.thrusterFlicker * 0.4))
          ctx.lineTo(ship.size * 0.08, ship.size * 0.3)
          ctx.closePath()
          ctx.fill()
        }

        ctx.restore()

        // Move ship
        ship.x += ship.speedX
        ship.y += ship.speedY

        // Wrap ships around screen edges
        if (ship.x < -ship.size) ship.x = canvas.width + ship.size
        if (ship.x > canvas.width + ship.size) ship.x = -ship.size
        if (ship.y < -ship.size) ship.y = canvas.height + ship.size
        if (ship.y > canvas.height + ship.size) ship.y = -ship.size

        // Avoid center region by adjusting course if needed
        if (isInCenter(ship.x, ship.y)) {
          const dirX = ship.x - centerX
          const dirY = ship.y - centerY
          const mag = Math.sqrt(dirX * dirX + dirY * dirY)
          if (mag > 0) {
            ship.speedX = (1.2 * dirX) / mag
            ship.speedY = (1.2 * dirY) / mag
          }
        }
      })

      requestAnimationFrame(animate)
    }

    // Helper to shade color (lighten/darken hex color)
    function shadeColor(color: string, percent: number) {
      // Remove alpha if present
      const hex = color.replace("#", "").substring(0, 6)
      const num = Number.parseInt(hex, 16)
      let r = (num >> 16) + percent
      let g = ((num >> 8) & 0x00ff) + percent
      let b = (num & 0x0000ff) + percent
      r = Math.max(Math.min(255, r), 0)
      g = Math.max(Math.min(255, g), 0)
      b = Math.max(Math.min(255, b), 0)
      return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -1,
        pointerEvents: "none",
      }}
    />
  )
}
