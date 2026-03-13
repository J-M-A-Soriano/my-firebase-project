"use client";

import { useState } from "react";
import { NavBar } from "@/components/nav-bar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Loader2, TrendingUp, Users, Clock, ShieldCheck } from "lucide-react";
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
      <main className="container mx-auto py-12 px-6 max-w-7xl space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-foreground font-headline uppercase italic">
              AI Pattern <span className="text-primary not-italic">Analysis</span>
            </h1>
            <p className="text-muted-foreground font-bold text-sm uppercase tracking-widest opacity-60">
              Generative Intelligence Hub
            </p>
          </div>
          <Button 
            onClick={generateInsights} 
            disabled={loading}
            className="h-14 px-8 rounded-2xl bg-primary text-white shadow-2xl hover:scale-105 transition-all font-black uppercase tracking-widest text-xs"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <BrainCircuit className="mr-2 h-5 w-5" />
                Initialize AI Scan
              </>
            )}
          </Button>
        </div>

        {!insights && !loading && (
          <div className="grid place-items-center py-32 rounded-[3rem] border-4 border-dashed border-border/50 bg-white/30">
            <div className="text-center max-w-md space-y-6">
              <div className="p-6 bg-primary/10 w-fit mx-auto rounded-[2rem] shadow-inner">
                <BrainCircuit className="h-16 w-16 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Diagnostic Ready</h3>
                <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide opacity-70">
                  Analyze library occupancy vectors and traffic timestamps for optimized staffing.
                </p>
              </div>
              <Button variant="outline" className="h-12 rounded-xl border-2 font-black px-6" onClick={generateInsights}>Run Global Analysis</Button>
            </div>
          </div>
        )}

        {loading && (
          <div className="space-y-8 animate-pulse">
            <div className="h-64 bg-muted/40 rounded-[2.5rem]" />
            <div className="h-64 bg-muted/40 rounded-[2.5rem]" />
          </div>
        )}

        {insights && (
          <div className="grid gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-4">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl font-black italic uppercase">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    Temporal Peak Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-6 bg-muted/20 rounded-2xl border border-border/50">
                    <p className="text-sm font-medium leading-relaxed text-foreground/80">
                      {insights.peakUsageTimes}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-4">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl font-black italic uppercase">
                    <Users className="h-6 w-6 text-primary" />
                    Traffic Flow Vectors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-6 bg-muted/20 rounded-2xl border border-border/50">
                    <p className="text-sm font-medium leading-relaxed text-foreground/80">
                      {insights.commonFlowPatterns}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-[3rem] border-none shadow-2xl bg-primary text-white overflow-hidden">
              <div className="h-2 bg-accent w-full" />
              <CardHeader className="p-10 pb-6 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 mx-auto">
                  <ShieldCheck className="h-3 w-3" /> System Recommendation
                </div>
                <CardTitle className="text-3xl font-black italic uppercase">Strategic Operational Directives</CardTitle>
              </CardHeader>
              <CardContent className="p-10 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    "Augment personnel deployment during identified peak windows.",
                    "Optimize study room allocation based on observed group entry trends.",
                    "Calibrate system maintenance windows to low-traffic vectors."
                  ].map((rec, i) => (
                    <div key={i} className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 text-sm font-bold flex gap-4 items-start">
                      <div className="h-8 w-8 shrink-0 rounded-xl bg-white/20 text-white flex items-center justify-center text-xs font-black">
                        0{i + 1}
                      </div>
                      <span className="opacity-90 leading-snug">{rec}</span>
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
