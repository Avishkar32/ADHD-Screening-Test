"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [prediction, setPrediction] = useState<string>("Loading...");
  const [probability, setProbability] = useState<number>(0);

  useEffect(() => {
    const pred = searchParams.get("prediction");
    const prob = searchParams.get("probability");
    if (pred && prob) {
      setPrediction(pred === "1" ? "ADHD" : "No ADHD");
      setProbability(parseFloat(prob));
    }
  }, [searchParams]);

  return (
    <Card className="w-full max-w-md bg-black/50 backdrop-blur-md border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-2xl text-white">Prediction Result</CardTitle>
      </CardHeader>
      <CardContent className="text-white">
        <p className="text-xl mb-4">Predicted: {prediction}</p>
        <p className="text-xl mb-4">Probability: {(probability * 100).toFixed(2)}%</p>
        <p className="text-sm text-gray-400 italic">
          Note: This is for simulation purposes. Consult a healthcare professional for diagnosis.
        </p>
      </CardContent>
      <CardFooter>
        <Button
          onClick={() => router.push("/")}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          Back to Home
        </Button>
      </CardFooter>
    </Card>
  );
}