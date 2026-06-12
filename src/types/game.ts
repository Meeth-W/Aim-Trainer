export interface Target {
  id: string;
  x: number;
  y: number;
  radius: number;
  spawnTime: number;
  alive: boolean;
}

export interface GameEvent {
  type: 'spawn' | 'hit' | 'miss';
  timestamp: number;
  x: number;
  y: number;
  targetId?: string;
  reactionTime?: number;
}

export interface PerformanceMetrics {
  avgFps: number;
  minFps: number;
  droppedFrames: number;
  frameTimes: number[];
}

export interface GameStats {
  score: number;
  hits: number;
  misses: number;
  accuracy: number;
  clicks: number;
  avgReactionTime: number;
  medianReactionTime: number;
  bestReactionTime: number;
  worstReactionTime: number;
  reactionTimes: number[];
  events: GameEvent[];
}

export interface IMode {
  id: string;
  name: string;
  description: string;
  targetRadius: number;
  maxTargets: number;
  
  /**
   * Initialize targets for the scenario.
   */
  initTargets(width: number, height: number): Target[];
  
  /**
   * Handle target hit and generate replacement target(s).
   */
  onTargetHit(
    hitTarget: Target,
    currentTargets: Target[],
    width: number,
    height: number
  ): Target[];
  
  /**
   * Periodic tick hook for updating targets (e.g. for moving/tracking targets or cluster shifts).
   */
  onTick?(
    currentTargets: Target[],
    elapsedMs: number,
    width: number,
    height: number,
    hitCountInSession: number
  ): Target[];
}
