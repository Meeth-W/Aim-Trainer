'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Target, Award, Trophy, Play, TrendingUp, Zap, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface PersonalBest {
  score: number;
  accuracy: number;
  date: string;
}

interface DashboardData {
  personalBests: Record<string, PersonalBest | null>;
  sessions: Array<{
    id: string;
    mode: string;
    score: number;
    accuracy: number;
    avgReactionTime: number;
    date: string;
  }>;
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/sessions?limit=5');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getModeDisplayName = (mode: string) => {
    switch (mode) {
      case 'SIX_SHOT': return 'Six Shot';
      case 'MULTISHOT': return 'Multishot';
      case 'MULTISHOT_3X3': return 'Multishot 3x3';
      default: return mode;
    }
  };

  const getModeDescription = (mode: string) => {
    switch (mode) {
      case 'SIX_SHOT': return 'Micro-precision targeting with 6 small targets.';
      case 'MULTISHOT': return 'Flick acquisition with target clusters that shift.';
      case 'MULTISHOT_3X3': return 'Speed & grid control inside a 3x3 coordinate plane.';
      default: return '';
    }
  };

  const scenarios = [
    {
      id: 'SIX_SHOT',
      name: 'Six Shot',
      icon: Target,
      difficulty: 'Hard',
      focus: 'Precision & Micro-adjustments',
      color: 'from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-400',
      btnColor: 'bg-rose-500 hover:bg-rose-600',
    },
    {
      id: 'MULTISHOT',
      name: 'Multishot',
      icon: Zap,
      difficulty: 'Medium',
      focus: 'Flick Control & Spacing',
      color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400',
      btnColor: 'bg-cyan-500 hover:bg-cyan-600',
    },
    {
      id: 'MULTISHOT_3X3',
      name: 'Multishot 3x3',
      icon: Trophy,
      difficulty: 'Easy-Medium',
      focus: 'Speed & Grid Control',
      color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
      btnColor: 'bg-emerald-500 hover:bg-emerald-600',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex-1 flex flex-col justify-between">
      {/* Hero Section */}
      <div className="text-center md:text-left mb-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-game-accent/10 border border-game-accent/20 text-game-accent mb-4">
            <Zap className="h-3.5 w-3.5 fill-game-accent" />
            V1.0 - VALORANT FOCUS
          </span>
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4"
        >
          MASTER YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-game-accent to-emerald-400">MUSCLE MEMORY</span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base md:text-lg text-game-ui/70 max-w-2xl font-light leading-relaxed"
        >
          A high-performance aim trainer designed specifically for Valorant players. 
          Configure your exact mouse parameters, choose your scenario, and see your accuracy soar.
        </motion.p>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Scenarios Selection */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold tracking-wide text-game-ui/80 uppercase">
            Select Scenario
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {scenarios.map((sc, index) => {
              const pb = data?.personalBests[sc.id];
              return (
                <motion.div
                  key={sc.id}
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  className={`flex flex-col justify-between p-6 rounded-2xl bg-gradient-to-br ${sc.color} border backdrop-blur-sm shadow-xl transition-all duration-300 hover:scale-[1.03] hover:shadow-game-accent/5`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                        <sc.icon className="h-6 w-6" />
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/5">
                        {sc.difficulty}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold mb-1">{sc.name}</h3>
                    <p className="text-xs text-game-ui/60 mb-4 h-12 leading-relaxed">
                      {getModeDescription(sc.id)}
                    </p>

                    <div className="border-t border-white/5 pt-3 mb-6 space-y-1.5 text-xs text-game-ui/50">
                      <div className="flex justify-between">
                        <span>Focus:</span>
                        <span className="text-game-ui/70 font-medium">{sc.focus}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Personal Best:</span>
                        <span className="text-game-ui/80 font-bold">
                          {pb ? pb.score : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link href={`/play?mode=${sc.id}`}>
                    <button className={`w-full py-2.5 rounded-xl text-game-bg font-bold flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 ${sc.btnColor} shadow-lg shadow-black/20 hover:scale-[0.98]`}>
                      <Play className="h-4 w-4 fill-game-bg text-game-bg" />
                      Start Scenario
                    </button>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Panel: High scores & Recent Activity */}
        <div className="space-y-6">
          {/* Personal Bests */}
          <div>
            <h2 className="text-xl font-bold tracking-wide text-game-ui/80 uppercase mb-4">
              Personal Bests
            </h2>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
              {loading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-10 bg-white/5 rounded-xl"></div>
                  <div className="h-10 bg-white/5 rounded-xl"></div>
                  <div className="h-10 bg-white/5 rounded-xl"></div>
                </div>
              ) : (
                ['SIX_SHOT', 'MULTISHOT', 'MULTISHOT_3X3'].map((modeKey) => {
                  const pb = data?.personalBests[modeKey];
                  return (
                    <div key={modeKey} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded bg-game-accent/10 border border-game-accent/20">
                          <Award className="h-4 w-4 text-game-accent" />
                        </div>
                        <div>
                          <p className="text-xs font-bold">{getModeDisplayName(modeKey)}</p>
                          <p className="text-[10px] text-game-ui/40">
                            {pb ? new Date(pb.date).toLocaleDateString() : 'No games played'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-game-accent">{pb ? pb.score : '—'}</p>
                        <p className="text-[10px] text-game-ui/50">
                          {pb ? `${Math.round(pb.accuracy * 100)}% Acc` : ''}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold tracking-wide text-game-ui/80 uppercase">
                Recent Scores
              </h2>
              <Link href="/analytics" className="text-xs text-game-accent hover:underline flex items-center gap-0.5">
                Full History
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              {loading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-16 bg-white/5 rounded-xl"></div>
                  <div className="h-16 bg-white/5 rounded-xl"></div>
                </div>
              ) : !data || data.sessions.length === 0 ? (
                <p className="text-xs text-game-ui/40 text-center py-6">
                  No sessions recorded yet. Play a game to see stats!
                </p>
              ) : (
                <div className="space-y-3">
                  {data.sessions.map((sess) => (
                    <div key={sess.id} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 transition duration-300">
                      <div>
                        <p className="text-xs font-bold">{getModeDisplayName(sess.mode)}</p>
                        <p className="text-[9px] text-game-ui/40">
                          {new Date(sess.date).toLocaleDateString()} {new Date(sess.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-game-ui">{sess.score} pts</p>
                        <p className="text-[9px] text-game-ui/50">
                          {Math.round(sess.accuracy * 100)}% Acc • {Math.round(sess.avgReactionTime)}ms RT
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
