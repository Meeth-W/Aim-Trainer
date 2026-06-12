'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSettingsStore } from '@/store/settingsStore';
import { usePointerLock } from '@/hooks/usePointerLock';
import { GameEngine } from '@/game/core/GameEngine';
import { SixShotMode } from '@/game/modes/SixShotMode';
import { MultishotMode } from '@/game/modes/MultishotMode';
import { Multishot3x3Mode } from '@/game/modes/Multishot3x3Mode';
import { GameStats, PerformanceMetrics } from '@/types/game';
import { Target, Play, RotateCcw, Home, Award, TrendingUp, Zap, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

function PlayPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { settings } = useSettingsStore();

  const modeParam = searchParams.get('mode') || 'SIX_SHOT';
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { isLocked, isFullscreen, lockPointer, unlockPointer } = usePointerLock(containerRef);

  // States
  const [gameState, setGameState] = useState<'idle' | 'countdown' | 'playing' | 'ended' | 'paused'>('idle');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [countdownVal, setCountdownVal] = useState(3);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [perf, setPerf] = useState<PerformanceMetrics | null>(null);
  
  // Historical context states
  const [isPb, setIsPb] = useState(false);
  const [recentTrend, setRecentTrend] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const engineRef = useRef<GameEngine | null>(null);

  // Map mode parameters to mode classes
  const getModeInstance = (modeKey: string) => {
    switch (modeKey) {
      case 'SIX_SHOT': return new SixShotMode();
      case 'MULTISHOT': return new MultishotMode();
      case 'MULTISHOT_3X3': return new Multishot3x3Mode();
      default: return new SixShotMode();
    }
  };

  const getModeDisplayName = (modeKey: string) => {
    switch (modeKey) {
      case 'SIX_SHOT': return 'Six Shot';
      case 'MULTISHOT': return 'Multishot';
      case 'MULTISHOT_3X3': return 'Multishot 3x3';
      default: return 'Six Shot';
    }
  };

  // Instantiate and run game loop when pointer lock is engaged
  useEffect(() => {
    if (isLocked) {
      if (gameState === 'idle' || gameState === 'ended') {
        startSession();
      } else if (gameState === 'paused' && engineRef.current) {
        // Resume engine loop
        setGameState('playing');
        engineRef.current.start(); // re-runs loop
      }
    } else {
      // If we lose pointer lock during active gameplay, transition to PAUSED
      if (gameState === 'playing' || gameState === 'countdown') {
        setGameState('paused');
        if (engineRef.current) {
          engineRef.current.destroy();
          engineRef.current = null;
        }
      }
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, [isLocked]);

  const startSession = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setScore(0);
    setTimeLeft(30);
    setGameState('countdown');

    const mode = getModeInstance(modeParam);

    // Instantiate engine
    const engine = new GameEngine({
      canvas,
      mode,
      settings,
      onStateChange: (state) => {
        setGameState(state);
      },
      onCountdownTick: (secs) => {
        setCountdownVal(secs);
      },
      onTimeTick: (secs) => {
        setTimeLeft(secs);
      },
      onScoreUpdate: (s) => {
        setScore(s);
      },
      onFinished: async (finalStats, metrics) => {
        // Exit lock & fullscreen
        unlockPointer();
        setStats(finalStats);
        setPerf(metrics);
        setGameState('ended');
        
        // Save session data to DB
        setSaving(true);
        try {
          const saveRes = await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mode: modeParam,
              duration: 30,
              hits: finalStats.hits,
              misses: finalStats.misses,
              accuracy: finalStats.accuracy,
              score: finalStats.score,
              events: finalStats.events,
              reactionTimes: finalStats.reactionTimes,
              avgReactionTime: finalStats.avgReactionTime,
              bestReactionTime: finalStats.bestReactionTime,
              worstReactionTime: finalStats.worstReactionTime,
              avgFps: metrics.avgFps,
              minFps: metrics.minFps,
              droppedFrames: metrics.droppedFrames,
            }),
          });

          if (saveRes.ok) {
            // Load history to compute PB and trend
            const historyRes = await fetch(`/api/sessions?mode=${modeParam}&limit=11`);
            if (historyRes.ok) {
              const historyData = await historyRes.json();
              
              // Recent Trend scores
              const scores = historyData.sessions
                .slice(0, 10)
                .map((s: any) => s.score)
                .reverse();
              setRecentTrend(scores);

              // Check if personal best (compare with top highscore)
              const pbScore = historyData.personalBests[modeParam]?.score || 0;
              // If the new score matches or exceeds the PB we retrieved
              if (finalStats.score >= pbScore) {
                setIsPb(true);
              } else {
                setIsPb(false);
              }
            }
          }
        } catch (err) {
          console.error('Failed to save session:', err);
        } finally {
          setSaving(false);
        }
      },
    });

    engineRef.current = engine;
    engine.start();
  };

  const handleStartClick = () => {
    lockPointer();
  };

  const getAccuracyColor = (acc: number) => {
    if (acc >= 0.85) return 'text-emerald-400';
    if (acc >= 0.70) return 'text-cyan-400';
    return 'text-game-ui';
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center p-4">
      {/* Canvas Game Wrapper */}
      <div
        ref={containerRef}
        className="relative w-full max-w-5xl aspect-[16/9] bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl glow-accent"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
        />

        {/* Start Overlay */}
        {gameState === 'idle' && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center select-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-md space-y-6"
            >
              <div className="mx-auto w-16 h-16 rounded-2xl bg-game-accent/15 border border-game-accent/30 flex items-center justify-center">
                <Target className="h-8 w-8 text-game-accent animate-pulse" />
              </div>
              
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-wide uppercase text-game-ui">
                  {getModeDisplayName(modeParam)}
                </h1>
                <p className="text-xs text-game-ui/50 mt-1 uppercase tracking-widest font-semibold">
                  30 Second Scenario
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2.5 text-xs text-left">
                <div className="flex items-center gap-2 text-game-accent font-semibold">
                  <HelpCircle className="h-4 w-4" />
                  <span>How to Play:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-game-ui/60 font-light">
                  <li>Clicking start enters Fullscreen & locks pointer.</li>
                  <li>Destroy targets as quickly and accurately as possible.</li>
                  <li>Flick back to center and avoid spam clicking (accuracy bonus applies!).</li>
                  <li>Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px]">ESC</kbd> at any time to pause or exit lock.</li>
                </ul>
              </div>

              <button
                onClick={handleStartClick}
                className="w-full py-3.5 rounded-xl bg-game-accent hover:bg-game-accent/90 text-game-bg font-bold cursor-pointer transition flex items-center justify-center gap-2 hover:scale-[0.98] shadow-lg shadow-game-accent/15"
              >
                <Play className="h-5 w-5 fill-game-bg text-game-bg" />
                Start Training
              </button>
            </motion.div>
          </div>
        )}

        {/* Countdown Overlay (Driven by canvas renderer, but we sync state for optional sounds) */}
        {gameState === 'countdown' && (
          <div className="absolute top-4 left-4 flex gap-4 text-xs font-bold text-game-ui/50 uppercase select-none">
            <span>Mode: {getModeDisplayName(modeParam)}</span>
          </div>
        )}

        {/* Active Gameplay HUD */}
        {gameState === 'playing' && (
          <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start pointer-events-none select-none">
            {/* Top Left: HUD stats */}
            <div className="flex gap-4">
              <div className="bg-black/40 border border-white/5 px-4 py-2 rounded-xl backdrop-blur-sm">
                <span className="block text-[10px] uppercase font-bold text-game-ui/40">Score</span>
                <span className="text-xl font-bold text-game-accent">{score}</span>
              </div>
              <div className="bg-black/40 border border-white/5 px-4 py-2 rounded-xl backdrop-blur-sm">
                <span className="block text-[10px] uppercase font-bold text-game-ui/40">Time</span>
                <span className="text-xl font-bold text-game-ui">{timeLeft}s</span>
              </div>
            </div>
            
            {/* Top Right: sensitivity details */}
            <div className="bg-black/40 border border-white/5 px-4 py-2 rounded-xl backdrop-blur-sm text-right">
              <span className="block text-[9px] uppercase font-bold text-game-ui/40">Sensitivity</span>
              <span className="text-xs font-bold text-game-ui/80">Sens: {settings.valorantSensitivity} • DPI: {settings.dpi}</span>
            </div>
          </div>
        )}

        {/* Paused Overlay */}
        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center select-none">
            <div className="max-w-sm space-y-4">
              <div className="mx-auto w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <RotateCcw className="h-6 w-6 text-game-accent animate-spin" />
              </div>
              <h2 className="text-xl font-bold uppercase text-game-ui">Game Paused</h2>
              <p className="text-xs text-game-ui/60 font-light">
                Pointer lock was lost. Click resume to return to your session.
              </p>
              <button
                onClick={handleStartClick}
                className="w-full py-3 rounded-xl bg-game-accent hover:bg-game-accent/90 text-game-bg font-bold cursor-pointer transition"
              >
                Resume Session
              </button>
            </div>
          </div>
        )}

        {/* Results Overlay */}
        {gameState === 'ended' && stats && (
          <div className="absolute inset-0 bg-black/95 flex flex-col justify-between p-8 overflow-y-auto select-none">
            <div className="max-w-4xl mx-auto w-full space-y-6">
              
              {/* Header PB alert */}
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-white/5 pb-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold uppercase tracking-wide">
                    Scenario Complete
                  </h1>
                  <p className="text-xs text-game-ui/50">
                    {getModeDisplayName(modeParam)} • 30s session
                  </p>
                </div>
                
                {isPb && (
                  <motion.div
                    initial={{ scale: 0.9, rotate: -2 }}
                    animate={{ scale: 1.05, rotate: 0 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/20 border border-amber-500/40 text-amber-400"
                  >
                    <Award className="h-4 w-4 text-amber-400 animate-bounce" />
                    <span>NEW PERSONAL BEST!</span>
                  </motion.div>
                )}
              </div>

              {/* Stats Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <span className="block text-[10px] uppercase font-bold text-game-ui/40">Final Score</span>
                  <span className="text-2xl font-bold text-game-accent">{stats.score}</span>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <span className="block text-[10px] uppercase font-bold text-game-ui/40">Accuracy</span>
                  <span className={`text-2xl font-bold ${getAccuracyColor(stats.accuracy)}`}>
                    {Math.round(stats.accuracy * 100)}%
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <span className="block text-[10px] uppercase font-bold text-game-ui/40">Hits / Misses</span>
                  <span className="text-lg font-bold text-game-ui">
                    {stats.hits} <span className="text-xs text-game-ui/50 font-normal">/ {stats.misses}</span>
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <span className="block text-[10px] uppercase font-bold text-game-ui/40">Avg Reaction Time</span>
                  <span className="text-2xl font-bold text-game-ui">{Math.round(stats.avgReactionTime)}ms</span>
                </div>
              </div>

              {/* Advanced stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Reaction speed details */}
                <div className="p-5 rounded-xl bg-white/5 border border-white/5 space-y-3">
                  <h3 className="text-xs font-bold tracking-wide uppercase text-game-ui/60 flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-game-accent" />
                    Reaction Time Statistics
                  </h3>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-black/20 p-2 rounded">
                      <span className="block text-[9px] text-game-ui/40 font-bold uppercase">Best</span>
                      <span className="text-sm font-bold text-emerald-400">{Math.round(stats.bestReactionTime)}ms</span>
                    </div>
                    <div className="bg-black/20 p-2 rounded">
                      <span className="block text-[9px] text-game-ui/40 font-bold uppercase">Median</span>
                      <span className="text-sm font-bold text-game-ui">{Math.round(stats.medianReactionTime)}ms</span>
                    </div>
                    <div className="bg-black/20 p-2 rounded">
                      <span className="block text-[9px] text-game-ui/40 font-bold uppercase">Worst</span>
                      <span className="text-sm font-bold text-rose-400">{Math.round(stats.worstReactionTime)}ms</span>
                    </div>
                  </div>
                </div>

                {/* Performance stats */}
                <div className="p-5 rounded-xl bg-white/5 border border-white/5 space-y-3">
                  <h3 className="text-xs font-bold tracking-wide uppercase text-game-ui/60 flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-game-accent" />
                    Engine Performance
                  </h3>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-black/20 p-2 rounded">
                      <span className="block text-[9px] text-game-ui/40 font-bold uppercase">Avg FPS</span>
                      <span className="text-sm font-bold text-game-ui">{perf ? Math.round(perf.avgFps) : 0}</span>
                    </div>
                    <div className="bg-black/20 p-2 rounded">
                      <span className="block text-[9px] text-game-ui/40 font-bold uppercase">Min FPS</span>
                      <span className="text-sm font-bold text-game-ui">{perf ? Math.round(perf.minFps) : 0}</span>
                    </div>
                    <div className="bg-black/20 p-2 rounded">
                      <span className="block text-[9px] text-game-ui/40 font-bold uppercase">Dropped Frames</span>
                      <span className="text-sm font-bold text-rose-400">{perf ? perf.droppedFrames : 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Simple Trend Chart */}
              {recentTrend.length > 1 && (
                <div className="p-5 rounded-xl bg-white/5 border border-white/5 space-y-3">
                  <h3 className="text-xs font-bold tracking-wide uppercase text-game-ui/60">
                    Recent Performance Trend (Last 10 Games)
                  </h3>
                  <div className="h-16 flex items-end gap-1.5 w-full">
                    {recentTrend.map((tScore, i) => {
                      const max = Math.max(...recentTrend);
                      const min = Math.min(...recentTrend);
                      const heightPercent = max === min ? 50 : 15 + ((tScore - min) / (max - min)) * 80;
                      return (
                        <div
                          key={i}
                          style={{ height: `${heightPercent}%` }}
                          className={`flex-1 rounded-sm ${i === recentTrend.length - 1 ? 'bg-game-accent' : 'bg-white/10'} hover:bg-game-accent/50 transition duration-300 relative group cursor-pointer`}
                        >
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-black text-[9px] font-bold text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition duration-150 select-none z-10 whitespace-nowrap pointer-events-none mb-1 shadow">
                            {tScore}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="max-w-4xl mx-auto w-full flex flex-col sm:flex-row gap-4 border-t border-white/5 pt-4">
              <button
                onClick={handleStartClick}
                className="flex-1 py-3 rounded-xl bg-game-accent hover:bg-game-accent/90 text-game-bg font-bold cursor-pointer transition flex items-center justify-center gap-2 hover:scale-[0.98] text-sm"
              >
                <Play className="h-4 w-4 fill-game-bg text-game-bg" />
                Play Again
              </button>
              
              <button
                onClick={() => router.push('/')}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-game-ui font-medium cursor-pointer transition flex items-center justify-center gap-2 hover:scale-[0.98] text-sm"
              >
                <Home className="h-4 w-4" />
                Exit to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex justify-center items-center py-20 bg-game-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-game-accent"></div>
      </div>
    }>
      <PlayPageContent />
    </Suspense>
  );
}
