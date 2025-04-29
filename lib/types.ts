export interface GameMetrics {
  movementVariance: undefined
  score: undefined
  sustainedFailures: number
  impulseErrors: number
  age: number
  adhd_status: number // 0 or 1
  playtime_min: number
  session_incomplete: number // 0 or 1

  // Star Catcher metrics
  sc_er?: number // Error Rate (%)
  sc_de?: number // Distraction Events (/min)
  sc_tct?: number // Task Completion Time (seconds)
  sc_rtv?: number // Reaction Time Variability (ms)

  // Wait for the Signal metrics
  wfs_fpr?: number // False Positive Rate (%)
  wfs_prc?: number // Premature Response Count (/min)
  wfs_rt?: number // Reaction Time (ms)
  wfs_gs?: number // Gaze Shifts (/min, simulated)

  // Focus Tower metrics
  ft_cf?: number // Cognitive Flexibility
  ft_mmv?: number // Motor Movement Variability
  ft_eii?: number // External Interference Index
  ft_tp?: number // Task Persistence
}

export interface Star {
  id: number
  x: number
  y: number
  color: string
  size: number
  collected: boolean
  order: number
}

export interface Asteroid {
  id: number
  x: number
  y: number
  size: number
  speed: number
  rotation: number
  rotationSpeed: number
}

export interface Spaceship {
  x: number
  y: number
  rotation: number
  thrusterActive: boolean
}

export interface Signal {
  type: "green" | "red"
  active: boolean
  timeRemaining: number
}

export interface Rocket {
  launched: boolean
  y: number
  speed: number
}

export interface Threat {
  id: number
  x: number
  y: number
  type: "alien" | "meteor"
  speed: number
  lockable: boolean
  locked: boolean
  destroyed: boolean
}
