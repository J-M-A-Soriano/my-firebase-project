"use client";

import { useState } from "react";
import { NavBar } from "@/components/nav-bar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Loader2, TrendingUp, Users, Clock, Lightbulb } from "lucide-react";
import { aiLibraryFlowInsights, AiLibraryFlowInsightsOutput } from "@/ai/flows/ai-library-flow-insights";
import { MOCK_HISTORY } from "@/lib/mock-data";

export default function InsightsPage() {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<AiLibraryFlowInsightsOutput | null>(null);

  const generateInsights = async () => {
    setLoading(true);
    try {
      const result = await aiLibraryFlowInsights({ historicalData: MOCK_HISTORY });
      setInsights(result);
    } catch (error) {
      console.error("Failed to generate insights", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">AI Library Flow Insights</h1>
            <p className="text-muted-foreground">Intelligent analysis of occupancy and traffic patterns.</p>
          </div>
          <Button 
            onClick={generateInsights} 
            disabled={loading}
            className="bg-primary hover:bg-primary/90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing History...
              </>
            ) : (
              <>
                <BrainCircuit className="mr-2 h-4 w-4" />
                Generate Insights
              </>
            )}
          </Button>
        </div>

        {!insights && !loading && (
          <div className="grid place-items-center py-24 border-2 border-dashed rounded-3xl bg-white/50">
            <div className="text-center max-w-md space-y-6">
              <div className="p-4 bg-primary/10 w-fit mx-auto rounded-full">
                <BrainCircuit className="h-12 w-12 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Smart Analysis Available</h3>
                <p className="text-muted-foreground">
                  Our AI can process over 500+ recent data points to help you optimize staffing and space utilization.
                </p>
              </div>
              <Button variant="outline" onClick={generateInsights}>Run Analysis Now</Button>
            </div>
          </div>
        )}

        {loading && (
          <div className="space-y-6 animate-pulse">
            <div className="h-48 bg-muted rounded-xl" />
            <div className="h-48 bg-muted rounded-xl" />
          </div>
        )}

        {insights && (
          <div className="grid gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Peak Usage Times
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {insights.peakUsageTimes}
                  </p>
                  <div className="mt-6 p-4 bg-accent/10 rounded-lg flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-primary shrink-0" />
                    <p className="text-xs text-primary font-medium">
                      Pro-tip: Consider increasing staff levels during these identified windows.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Common Flow Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {insights.commonFlowPatterns}
                  </p>
                  <div className="mt-6 p-4 bg-secondary rounded-lg flex items-start gap-3">
                    <Clock className="h-5 w-5 text-secondary-foreground shrink-0" />
                    <p className="text-xs text-secondary-foreground font-medium">
                      Pattern observed: High correlation between study hall periods and library check-ins.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-center">Staff Recommendations</CardTitle>
                <CardDescription className="text-center">Based on current AI findings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    "Schedule library assistants for Tuesday afternoons",
                    "Limit group study room bookings to 45 mins",
                    "Open additional seating area at 12:00 PM daily"
                  ].map((rec, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border shadow-sm text-sm font-medium flex gap-3 items-center">
                      <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </div>
                      {rec}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}