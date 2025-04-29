"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface AgeFormProps {
  onAgeSubmit: (age: number) => void
}

export default function AgeForm({ onAgeSubmit }: AgeFormProps) {
  const [age, setAge] = useState<string>("")
  const [error, setError] = useState<string>("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const ageNum = Number.parseInt(age)
    if (isNaN(ageNum) || ageNum < 4 || ageNum > 17) {
      setError("Please enter a valid age between 4 and 17")
      return
    }

    onAgeSubmit(ageNum)
  }

  return (
    <Card className="w-full max-w-md bg-black/50 backdrop-blur-md border-purple-500/30">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-white">Welcome to the ADHD Screening Platform</CardTitle>
        <CardDescription className="text-gray-300">Please enter your age to begin the assessment</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="age" className="text-white">
                Age (4-17)
              </Label>
              <Input
                id="age"
                type="number"
                min={4}
                max={17}
                value={age}
                onChange={(e) => {
                  setAge(e.target.value)
                  setError("")
                }}
                className="bg-black/30 border-purple-500/50 text-white"
                placeholder="Enter your age"
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white">
            Start Assessment
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
