'use client';

import { useEffect, useState } from 'react';
import { Target, Trophy, TrendingUp, Calendar, Zap, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface Session {
  id: string;
  mode: string;
  score: number;
  accuracy: number;
  hits: number;
  misses: number;
  avgReactionTime: number;
  bestReactionTime: number;
  worstReactionTime: number;
  avgFps: number;
  minFps: number;
  droppedFrames: number;
  date: string;
  events: string; // JSON
}

interface AnalyticsData {
  sessions: Session[];
  personalBests: Record<string, { score: number; accuracy: number; date: string } | null>;
  top10: Session[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'SIX_SHOT' | 'MULTISHOT' | 'MULTISHOT_3X3'>('SIX_SHOT');

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch('/api/sessions?limit=100');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to fetch sessions history:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  const getModeDisplayName = (mode: string) => {
    switch (mode) {
      case 'SIX_SHOT': return 'Six Shot';
      case 'MULTISHOT': return 'Multishot';
      case 'MULTISHOT_3X3': return 'Multishot 3x3';
      default: return mode;
    }
  };

  // Filter sessions for the active tab, sorted oldest to newest for graphing
  const filteredSessions = data
    ? [...data.sessions].filter(s => s.mode === selectedTab).reverse()
    : [];

  const recentSessionsTable = data
    ? [...data.sessions].filter(s => s.mode === selectedTab)
    : [];

  // 1. Dynamic SVG Line Chart Component
  const drawLineChart = (
    values: number[], 
    color: string, 
    labelFormatter: (val: number) => string
  ) => {
    if (values.length < 2) {
      return (
        <div className="h-48 flex items-center justify-center border border-white/5 bg-white/5 rounded-xl text-xs text-game-ui/40">
          Play at least 2 sessions to see trend line
        </div>
      );
    }

    const width = 500;
    const height = 180;
    const padding = 20;

    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min === 0 ? 1 : max - min;

    const points = values.map((val, index) => {
      const x = padding + (index / (values.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((val - min) / range) * (height - 2 * padding);
      return { x, y, val };
    });

    const pathData = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');

    return (
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = padding + ratio * (height - 2 * padding);
            const gridVal = max - ratio * (max - min);
            return (
              <g key={idx}>
                <line
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="0.75"
                />
                <text
                  x={padding + 5}
                  y={y - 4}
                  fill="rgba(255,255,255,0.3)"
                  fontSize="8"
                  className="font-mono select-none"
                >
                  {labelFormatter(gridVal)}
                </text>
              </g>
            );
          })}

          {/* Trend Line Path */}
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Value circles */}
          {points.map((p, i) => (
            <g key={i} className="group cursor-pointer">
              <circle
                cx={p.x}
                cy={p.y}
                r="4"
                fill="#09090b"
                stroke={color}
                strokeWidth="1.5"
                className="transition duration-150 group-hover:r-6 hover:fill-game-accent"
              />
              <title>{labelFormatter(p.val)}</title>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  // Pie chart calculation
  const totalHits = filteredSessions.reduce((sum, s) => sum + s.hits, 0);
  const totalMisses = filteredSessions.reduce((sum, s) => sum + s.misses, 0);
  const totalClicks = totalHits + totalMisses;

  // Derive coordinates for heatmap checks (Spawns, Hits, Misses)
  const heatmapData: Array<{ x: number; y: number; type: 'hit' | 'miss' }> = [];
  let hitCoordinatesCount = 0;
  let missCoordinatesCount = 0;

  filteredSessions.slice(-10).forEach(sess => {
    try {
      if (sess.events) {
        const eventsObj = JSON.parse(sess.events);
        if (Array.isArray(eventsObj)) {
          eventsObj.forEach((e: any) => {
            if (e.type === 'hit' || e.type === 'miss') {
              heatmapData.push({ x: e.x, y: e.y, type: e.type });
              if (e.type === 'hit') hitCoordinatesCount++;
              if (e.type === 'miss') missCoordinatesCount++;
            }
          });
        }
      }
    } catch (err) {
      // Ignored parsing error
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ANALYTICS</h1>
          <p className="text-sm text-game-ui/60 font-light">Monitor your targeting accuracy, reaction speeds, and scoring trends.</p>
        </div>

        {/* Scenario Tabs */}
        <div className="flex p-1 bg-white/5 border border-white/10 rounded-xl">
          {(['SIX_SHOT', 'MULTISHOT', 'MULTISHOT_3X3'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase transition cursor-pointer ${
                selectedTab === tab
                  ? 'bg-game-accent text-game-bg'
                  : 'text-game-ui/60 hover:text-game-ui'
              }`}
            >
              {getModeDisplayName(tab)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-game-accent"></div>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Top Cards: Personal Best overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Score Card */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden">
              <span className="block text-[10px] uppercase font-bold text-game-ui/40 tracking-wider">
                Personal Best Score
              </span>
              <span className="text-4xl font-extrabold text-game-accent mt-2 block">
                {data?.personalBests[selectedTab] ? data.personalBests[selectedTab]!.score : '—'}
              </span>
              <span className="text-[10px] text-game-ui/50 mt-1 block">
                {data?.personalBests[selectedTab]
                  ? `Achieved on ${new Date(data.personalBests[selectedTab]!.date).toLocaleDateString()}`
                  : 'Play a session to set record'}
              </span>
            </div>

            {/* Accuracy Card */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <span className="block text-[10px] uppercase font-bold text-game-ui/40 tracking-wider">
                Personal Best Accuracy
              </span>
              <span className="text-4xl font-extrabold text-game-ui mt-2 block">
                {data?.personalBests[selectedTab]
                  ? `${Math.round(data.personalBests[selectedTab]!.accuracy * 100)}%`
                  : '—'}
              </span>
              <span className="text-[10px] text-game-ui/50 mt-1 block">
                Average across sessions: {filteredSessions.length > 0
                  ? `${Math.round((filteredSessions.reduce((s, a) => s + a.accuracy, 0) / filteredSessions.length) * 100)}%`
                  : 'N/A'}
              </span>
            </div>

            {/* Reaction speed Card */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <span className="block text-[10px] uppercase font-bold text-game-ui/40 tracking-wider">
                Average Reaction Time
              </span>
              <span className="text-4xl font-extrabold text-emerald-400 mt-2 block">
                {filteredSessions.length > 0
                  ? `${Math.round(filteredSessions.reduce((s, a) => s + a.avgReactionTime, 0) / filteredSessions.length)}ms`
                  : '—'}
              </span>
              <span className="text-[10px] text-game-ui/50 mt-1 block">
                Best reaction: {filteredSessions.length > 0
                  ? `${Math.round(Math.min(...filteredSessions.map(s => s.bestReactionTime)))}ms`
                  : 'N/A'}
              </span>
            </div>
          </div>

          {/* Trend Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Score Trend */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold tracking-wide uppercase text-game-ui/70 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-game-accent" />
                Score Improvement Over Time
              </h3>
              {drawLineChart(
                filteredSessions.map((s) => s.score),
                '#06b6d4', // game accent
                (val) => `${Math.round(val)} pts`
              )}
            </div>

            {/* Reaction Speed Trend */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold tracking-wide uppercase text-game-ui/70 flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-400" />
                Reaction Speed Trend
              </h3>
              {drawLineChart(
                filteredSessions.map((s) => s.avgReactionTime),
                '#10b981', // hit green
                (val) => `${Math.round(val)}ms`
              )}
            </div>
          </div>

          {/* Hit Miss Ratio & Heatmap visual validation */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Click breakdown */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between shadow-xl">
              <h3 className="text-sm font-bold tracking-wide uppercase text-game-ui/70 mb-4">
                Click Distribution
              </h3>
              {totalClicks === 0 ? (
                <div className="h-40 flex items-center justify-center text-xs text-game-ui/40">
                  No click data recorded yet
                </div>
              ) : (
                <div className="space-y-6 flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-center text-xs text-game-ui/50">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded bg-game-hit"></div>
                      <span>Hits: {totalHits}</span>
                    </div>
                    <span>{Math.round((totalHits / totalClicks) * 100)}%</span>
                  </div>

                  <div className="flex justify-between items-center text-xs text-game-ui/50">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded bg-rose-500"></div>
                      <span>Misses: {totalMisses}</span>
                    </div>
                    <span>{Math.round((totalMisses / totalClicks) * 100)}%</span>
                  </div>

                  <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${(totalHits / totalClicks) * 100}%` }}
                      className="bg-game-hit"
                    ></div>
                    <div
                      style={{ width: `${(totalMisses / totalClicks) * 100}%` }}
                      className="bg-rose-500"
                    ></div>
                  </div>
                  
                  <span className="text-[10px] text-center text-game-ui/40 block mt-2">
                    Aggregated across {filteredSessions.length} total games.
                  </span>
                </div>
              )}
            </div>

            {/* Heatmap Readiness visual grid */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold tracking-wide uppercase text-game-ui/70 flex justify-between items-center">
                <span>Precision Dispersion Map</span>
                <span className="text-[10px] text-game-accent uppercase font-bold tracking-widest bg-game-accent/10 px-2 py-0.5 rounded border border-game-accent/10">
                  Dataset Active
                </span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Visual grid box mimicking target screen */}
                <div className="md:col-span-2 relative aspect-[16/10] bg-zinc-950 border border-white/5 rounded-xl overflow-hidden shadow-inner">
                  {heatmapData.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-game-ui/40 font-light p-4 text-center">
                      No coordinates recorded yet. Play a game to map your hits and misses.
                    </div>
                  ) : (
                    <div className="absolute inset-0">
                      {/* Render coordinates points scaling them down to fit the smaller display */}
                      {heatmapData.slice(-100).map((pt, i) => (
                        <div
                          key={i}
                          style={{
                            left: `${(pt.x / 1000) * 100}%`, // approximate canvas percentage
                            top: `${(pt.y / 600) * 100}%`,
                          }}
                          className={`absolute w-1.5 h-1.5 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-75 ${
                            pt.type === 'hit' ? 'bg-game-hit shadow-lg shadow-game-hit/50' : 'bg-rose-500 shadow-lg shadow-rose-500/50'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                  {/* Visual overlay grids */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-5">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="border border-white"></div>
                    ))}
                  </div>
                </div>

                {/* Heatmap metrics detail */}
                <div className="space-y-4 text-xs text-game-ui/60">
                  <div className="flex items-center gap-1.5 text-game-accent font-semibold">
                    <AlertCircle className="h-4 w-4" />
                    <span>Map Metrics:</span>
                  </div>
                  <p className="font-light leading-relaxed">
                    This dispersion map shows the last 100 click coordinates. It visualizes whether your shots tend to overshoot, undershoot, or cluster.
                  </p>
                  <div className="space-y-2 border-t border-white/5 pt-3 text-[11px]">
                    <div className="flex justify-between">
                      <span>Logged Hit Events:</span>
                      <span className="font-bold text-game-hit">{hitCoordinatesCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Logged Miss Events:</span>
                      <span className="font-bold text-rose-500">{missCoordinatesCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Database Status:</span>
                      <span className="font-bold text-game-accent">Heatmap-Ready</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Historical sessions table list */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold tracking-wide uppercase text-game-ui/70 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-game-accent" />
              Game Activity History
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-game-ui/40 uppercase font-bold text-[10px]">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Scenario</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Accuracy</th>
                    <th className="py-3 px-4">Hits / Misses</th>
                    <th className="py-3 px-4">Avg RT</th>
                    <th className="py-3 px-4">FPS / Drops</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentSessionsTable.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-game-ui/40 font-light">
                        No activity found. Select "Train" from the navbar to log your first session!
                      </td>
                    </tr>
                  ) : (
                    recentSessionsTable.map((sess) => (
                      <tr key={sess.id} className="hover:bg-white/5 transition duration-150">
                        <td className="py-3.5 px-4 text-game-ui/70">
                          {new Date(sess.date).toLocaleDateString()} {new Date(sess.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-game-ui/80">
                          {getModeDisplayName(sess.mode)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-game-accent">
                          {sess.score}
                        </td>
                        <td className="py-3.5 px-4 font-bold">
                          {Math.round(sess.accuracy * 100)}%
                        </td>
                        <td className="py-3.5 px-4 text-game-ui/60">
                          {sess.hits} <span className="text-[10px] text-game-ui/40">/ {sess.misses}</span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-emerald-400">
                          {Math.round(sess.avgReactionTime)}ms
                        </td>
                        <td className="py-3.5 px-4 text-game-ui/50">
                          {Math.round(sess.avgFps)} / <span className={sess.droppedFrames > 0 ? 'text-rose-400' : ''}>{sess.droppedFrames}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
