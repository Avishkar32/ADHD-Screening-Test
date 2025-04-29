"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { GameMetrics } from "@/lib/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface MetricsDisplayProps {
  metrics: GameMetrics[];
  onBackToSelection: () => void;
}

export default function MetricsDisplay({ metrics, onBackToSelection }: MetricsDisplayProps) {
  const [adhd_status, setAdhd_status] = useState<number>(
    metrics.length > 0 ? metrics[metrics.length - 1].adhd_status : 0,
  );

  const totalPlayTime = metrics.reduce((sum, metric) => sum + (metric.playtime_min || 0), 0);

  // Aggregate metrics for CSV and display
  const aggregateMetrics = () => {
    const aggregated: Partial<GameMetrics> = {
      age: metrics.length > 0 ? metrics[0].age : undefined,
      adhd_status: adhd_status,
      playtime_min: 0,
      session_incomplete: 0,
    };

    // Sum playtime and collect metrics for each game
    metrics.forEach((metric) => {
      if (metric.playtime_min !== undefined) {
        aggregated.playtime_min = (aggregated.playtime_min || 0) + metric.playtime_min;
      }

      // Star Catcher metrics
      if (metric.sc_er !== undefined) aggregated.sc_er = metric.sc_er;
      if (metric.sc_de !== undefined) aggregated.sc_de = metric.sc_de;
      if (metric.sc_tct !== undefined) aggregated.sc_tct = metric.sc_tct;
      if (metric.sc_rtv !== undefined) aggregated.sc_rtv = metric.sc_rtv;

      // Wait for Signal metrics
      if (metric.wfs_fpr !== undefined) aggregated.wfs_fpr = metric.wfs_fpr;
      if (metric.wfs_prc !== undefined) aggregated.wfs_prc = metric.wfs_prc;
      if (metric.wfs_rt !== undefined) aggregated.wfs_rt = metric.wfs_rt;
      if (metric.wfs_gs !== undefined) aggregated.wfs_gs = metric.wfs_gs;

      // Galactic Defender metrics (renamed fields in the CSV headers)
      if (metric.score !== undefined) aggregated.ft_cf = metric.score; // Cognitive Flexibility
      if (metric.movementVariance !== undefined) aggregated.ft_mmv = metric.movementVariance; // Movement Variability
      if (metric.impulseErrors !== undefined) aggregated.ft_eii = metric.impulseErrors; // External Interference
      if (metric.sustainedFailures !== undefined) aggregated.ft_tp = metric.sustainedFailures; // Task Persistence

      // Session incomplete
      if (metric.session_incomplete !== undefined) {
        aggregated.session_incomplete = Math.max(
          aggregated.session_incomplete || 0,
          metric.session_incomplete
        );
      }
    });

    return aggregated;
  };

  // Function to send metrics to backend for prediction
  const getPrediction = async () => {
    const aggregatedMetrics = aggregateMetrics();
    const headers = [
      "age",
      "adhd_status",
      "playtime_min",
      "session_incomplete",
      "sc_er",
      "sc_de",
      "sc_tct",
      "sc_rtv",
      "wfs_fpr",
      "wfs_prc",
      "wfs_rt",
      "wfs_gs",
      "ft_cf",
      "ft_mmv",
      "ft_eii",
      "ft_tp",
    ];
    const row = headers.map((header) => {
      // @ts-ignore
      const value = aggregatedMetrics[header];
      return value !== undefined ? value : "NaN";
    });
    const csvContent = headers.join(",") + "\n" + row.join(",");
    console.log("Sending CSV Content:", csvContent); // Debug log

    try {
      const response = await fetch("http://localhost:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "text/plain" }, // Changed to text/plain
        body: csvContent,
      });

      // Log the raw response if JSON parsing fails
      if (!response.ok) {
        const text = await response.text();
        console.error("Response Status:", response.status, "Response Text:", text);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Prediction Result:", result); // Debug log
      window.location.href = `/result?prediction=${result.prediction}&probability=${result.probability}`;
    } catch (error) {
      console.error("Error getting prediction:", error);
    }
  };

  // Function to download metrics as CSV
  const downloadCSV = () => {
    const aggregatedMetrics = aggregateMetrics();
    const processedMetrics = { ...aggregatedMetrics };

    Object.keys(processedMetrics).forEach((key) => {
      if (Math.random() < 0.05 && key !== "age" && key !== "adhd_status") {
        // @ts-ignore
        processedMetrics[key] = "NaN";
      }
    });

    const headers = [
      "age",
      "adhd_status",
      "playtime_min",
      "session_incomplete",
      "sc_er",
      "sc_de",
      "sc_tct",
      "sc_rtv",
      "wfs_fpr",
      "wfs_prc",
      "wfs_rt",
      "wfs_gs",
      "ft_cf",
      "ft_mmv",
      "ft_eii",
      "ft_tp",
    ];

    let csvContent = headers.join(",") + "\n";

    const row = headers.map((header) => {
      // @ts-ignore
      const value = processedMetrics[header];
      return value !== undefined ? value : "NaN";
    });

    csvContent += row.join(",") + "\n";

    console.log("CSV Content:", csvContent); // Debug log

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "adhd_screening_metrics.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Prepare chart data (unchanged, assuming it exists)
  const getChartData = () => {
    const aggregatedMetrics = aggregateMetrics();

    const starCatcherData = [
      { name: "Error Rate (%)", value: aggregatedMetrics.sc_er || 0 },
      { name: "Distraction Events (/min)", value: aggregatedMetrics.sc_de || 0 },
      { name: "Task Completion Time (s)", value: aggregatedMetrics.sc_tct ? aggregatedMetrics.sc_tct / 10 : 0 },
      { name: "Reaction Time Var (ms)", value: aggregatedMetrics.sc_rtv ? aggregatedMetrics.sc_rtv / 10 : 0 },
    ];

    const waitForSignalData = [
      { name: "False Positive Rate (%)", value: aggregatedMetrics.wfs_fpr || 0 },
      { name: "Premature Responses (/min)", value: aggregatedMetrics.wfs_prc || 0 },
      { name: "Reaction Time (ms)", value: aggregatedMetrics.wfs_rt ? aggregatedMetrics.wfs_rt / 10 : 0 },
      { name: "Gaze Shifts (/min)", value: aggregatedMetrics.wfs_gs || 0 },
    ];

    const galacticDefenderData = [
      { name: "Cognitive Flexibility", value: aggregatedMetrics.ft_cf || 0 },
      { name: "Movement Variability", value: aggregatedMetrics.ft_mmv || 0 },
      { name: "External Interference", value: aggregatedMetrics.ft_eii || 0 },
      { name: "Task Persistence", value: aggregatedMetrics.ft_tp || 0 },
    ];

    return {
      starCatcher: starCatcherData,
      waitForSignal: waitForSignalData,
      galacticDefender: galacticDefenderData,
    };
  };

  const chartData = getChartData();

  return (
    <Card className="w-full max-w-4xl bg-black/50 backdrop-blur-md border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-2xl text-white">Assessment Results</CardTitle>
        <CardDescription className="text-gray-300">
          Your performance metrics from the ADHD screening games
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="star-catcher">Star Catcher</TabsTrigger>
            <TabsTrigger value="wait-for-signal">Wait for Signal</TabsTrigger>
            <TabsTrigger value="galactic-defender">Galactic Defender</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="text-white">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-black/30">
                <h3 className="text-xl font-bold mb-2">Assessment Overview</h3>
                <p className="text-gray-300 mb-4">
                  You've completed {metrics.length} game(s) in this assessment session.
                </p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-black/20">
                    <p className="text-sm text-gray-400">Age</p>
                    <p className="text-xl">{metrics.length > 0 ? metrics[0].age : "N/A"}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-black/20">
                    <p className="text-sm text-gray-400">Total Play Time</p>
                    <p className="text-xl">{totalPlayTime} min</p>
                  </div>
                </div>
                <div className="text-sm text-gray-400 italic">
                  <p>Note: This is a simulation for testing purposes only.</p>
                  <p>Please consult a healthcare professional for proper diagnosis.</p>
                </div>
              </div>
              <div className="flex justify-center space-x-4">
                <Button onClick={getPrediction} className="bg-purple-600 hover:bg-purple-700 text-white">
                  Get Prediction
                </Button>
                <Button onClick={downloadCSV} className="bg-purple-600 hover:bg-purple-700 text-white">
                  Download Metrics as CSV
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="star-catcher" className="text-white">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-black/30">
                <h3 className="text-xl font-bold mb-2">Star Catcher Metrics</h3>
                <p className="text-gray-300 mb-4">
                  This game measures attention and focus by tracking your ability to follow sequences.
                </p>
                {metrics.some((m) => m.sc_er !== undefined) ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.starCatcher} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis dataKey="name" tick={{ fill: "#ccc" }} />
                        <YAxis tick={{ fill: "#ccc" }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#222", borderColor: "#555" }}
                          labelStyle={{ color: "#fff" }}
                        />
                        <Bar dataKey="value" fill="#9D7AFF" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-gray-400 italic">No Star Catcher data available</p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="wait-for-signal" className="text-white">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-black/30">
                <h3 className="text-xl font-bold mb-2">Wait for Signal Metrics</h3>
                <p className="text-gray-300 mb-4">
                  This game measures impulse control by tracking your ability to wait for the right signal.
                </p>
                {metrics.some((m) => m.wfs_fpr !== undefined) ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.waitForSignal} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis dataKey="name" tick={{ fill: "#ccc" }} />
                        <YAxis tick={{ fill: "#ccc" }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#222", borderColor: "#555" }}
                          labelStyle={{ color: "#fff" }}
                        />
                        <Bar dataKey="value" fill="#5EFF8F" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-gray-400 italic">No Wait for Signal data available</p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="galactic-defender" className="text-white">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-black/30">
                <h3 className="text-xl font-bold mb-2">Galactic Defender Metrics</h3>
                <p className="text-gray-300 mb-4">This game measures cognitive flexibility and task persistence.</p>
                {metrics.some((m) => m.score !== undefined) ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.galacticDefender} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis dataKey="name" tick={{ fill: "#ccc" }} />
                        <YAxis tick={{ fill: "#ccc" }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#222", borderColor: "#555" }}
                          labelStyle={{ color: "#fff" }}
                        />
                        <Bar dataKey="value" fill="#5E9DFF" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-gray-400 italic">No Galactic Defender data available</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={onBackToSelection}
          className="border-purple-500/50 text-white hover:bg-purple-500/20"
        >
          Back to Games
        </Button>
        <Button onClick={downloadCSV} className="bg-purple-600 hover:bg-purple-700 text-white">
          Download Metrics as CSV
        </Button>
      </CardFooter>
    </Card>
  );
}