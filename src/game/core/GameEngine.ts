import { Target, GameEvent, IMode, GameStats, PerformanceMetrics } from '@/types/game';
import { UserSettings } from '@/store/settingsStore';
import { calculateDisplacement } from '../input/sensitivity';
import { drawCrosshair, parseCrosshairCode } from '../rendering/crosshairParser';

interface GameEngineConfig {
  canvas: HTMLCanvasElement;
  mode: IMode;
  settings: UserSettings;
  onStateChange: (state: 'idle' | 'countdown' | 'playing' | 'ended') => void;
  onCountdownTick: (secondsLeft: number) => void;
  onTimeTick: (secondsLeft: number) => void;
  onScoreUpdate: (score: number) => void;
  onFinished: (stats: GameStats, metrics: PerformanceMetrics) => void;
}

interface HitEffect {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  color: string;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mode: IMode;
  private settings: UserSettings;
  
  // Game State
  private status: 'idle' | 'countdown' | 'playing' | 'ended' = 'idle';
  private countdownTime = 3;
  private gameTime = 30.0;
  private lastTime = 0;
  private targets: Target[] = [];
  private crosshair = { x: 0, y: 0 };
  private activeHitCount = 0;
  
  // Stats
  private score = 0;
  private hits = 0;
  private misses = 0;
  private clicks = 0;
  private reactionTimes: number[] = [];
  private events: GameEvent[] = [];
  private hitEffects: HitEffect[] = [];
  
  // Performance
  private frameTimes: number[] = [];
  private lastFpsUpdate = 0;
  private fpsHistory: number[] = [];
  private minFps = 1000;
  private droppedFrames = 0;
  
  // Animation Frame Handle
  private animationFrameId: number | null = null;
  private countdownIntervalId: ReturnType<typeof setInterval> | null = null;
  private destroyed = false;

  // Diagnostic counters (publicly readable for debug panel)
  public diagnostics = {
    mouseMoveCount: 0,
    mouseDownCount: 0,
    pointerLockElement: '' as string,
    crosshairX: 0,
    crosshairY: 0,
    activeTargets: 0,
    currentFps: 0,
    status: 'idle' as string,
  };

  // Listeners
  private onStateChange: (state: 'idle' | 'countdown' | 'playing' | 'ended') => void;
  private onCountdownTick: (secondsLeft: number) => void;
  private onTimeTick: (secondsLeft: number) => void;
  private onScoreUpdate: (score: number) => void;
  private onFinished: (stats: GameStats, metrics: PerformanceMetrics) => void;

  constructor(config: GameEngineConfig) {
    this.canvas = config.canvas;
    const context = this.canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D context from canvas');
    this.ctx = context;
    
    this.mode = config.mode;
    this.settings = config.settings;
    this.onStateChange = config.onStateChange;
    this.onCountdownTick = config.onCountdownTick;
    this.onTimeTick = config.onTimeTick;
    this.onScoreUpdate = config.onScoreUpdate;
    this.onFinished = config.onFinished;

    this.resizeCanvas();
    this.resetCrosshair();

    window.addEventListener('resize', this.handleResize);
    // Listen on document for both mousemove and mousedown.
    // When pointer lock is active, all mouse events fire on the lock target (the container div),
    // not on the canvas child. Listening on document captures them regardless of which element holds the lock.
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mousedown', this.handleMouseDown);

    console.log('[GameEngine] Constructor: listeners attached to document');
  }

  public destroy() {
    if (this.destroyed) return;
    this.destroyed = true;

    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mousedown', this.handleMouseDown);
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.countdownIntervalId) {
      clearInterval(this.countdownIntervalId);
      this.countdownIntervalId = null;
    }

    console.log('[GameEngine] Destroyed');
  }

  /**
   * Check if pointer lock is currently engaged on the canvas or any of its ancestor elements.
   * This is necessary because we request pointer lock on the container div (for fullscreen),
   * but the game engine holds a reference to the canvas child.
   */
  private isPointerLocked(): boolean {
    const lockEl = document.pointerLockElement;
    if (!lockEl) return false;

    // Direct match on canvas
    if (lockEl === this.canvas) return true;

    // Check if the locked element is an ancestor of the canvas (e.g. the container div)
    if (this.canvas.closest && lockEl instanceof Element) {
      let el: Element | null = this.canvas;
      while (el) {
        if (el === lockEl) return true;
        el = el.parentElement;
      }
    }

    return false;
  }

  private handleResize = () => {
    this.resizeCanvas();
  };

  private resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  private resetCrosshair() {
    this.crosshair.x = this.canvas.width / 2;
    this.crosshair.y = this.canvas.height / 2;
  }

  // Pointer Lock mouse listener — moves the crosshair
  private handleMouseMove = (e: MouseEvent) => {
    // Update diagnostic lock element name
    this.diagnostics.pointerLockElement = document.pointerLockElement
      ? document.pointerLockElement.tagName
      : 'NONE';

    if (this.status !== 'playing' && this.status !== 'countdown') return;
    if (!this.isPointerLocked()) return;

    this.diagnostics.mouseMoveCount++;

    const movementX = e.movementX;
    const movementY = e.movementY;

    const disp = calculateDisplacement({
      movementX,
      movementY,
      sensitivity: this.settings.valorantSensitivity,
      dpi: this.settings.dpi,
      useAcceleration: this.settings.mouseAcceleration,
      accelerationExponent: this.settings.mouseAccelExponent,
    });

    this.crosshair.x = Math.max(0, Math.min(this.canvas.width, this.crosshair.x + disp.x));
    this.crosshair.y = Math.max(0, Math.min(this.canvas.height, this.crosshair.y + disp.y));

    this.diagnostics.crosshairX = Math.round(this.crosshair.x);
    this.diagnostics.crosshairY = Math.round(this.crosshair.y);
  };

  // Click handler — processes hits and misses
  private handleMouseDown = (_e: MouseEvent) => {
    if (this.status !== 'playing') return;
    if (!this.isPointerLocked()) return;

    this.diagnostics.mouseDownCount++;
    this.clicks++;
    const clickTime = performance.now();
    const { x, y } = this.crosshair;

    let targetHit: Target | null = null;

    // Check hit collision (last target spawned drawn on top, check in reverse)
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const target = this.targets[i];
      if (!target.alive) continue;

      const dist = Math.sqrt((x - target.x) ** 2 + (y - target.y) ** 2);
      if (dist <= target.radius) {
        targetHit = target;
        break;
      }
    }

    if (targetHit) {
      this.hits++;
      this.activeHitCount++;
      targetHit.alive = false;

      const rt = clickTime - targetHit.spawnTime;
      this.reactionTimes.push(rt);

      // Reaction Bonus Formula:
      // Sub 150ms gets 150 points. Over 600ms gets 0 points. Linear decay in between.
      const reactionBonus = rt < 150 
        ? 150 
        : Math.max(0, Math.round(150 * (1 - (rt - 150) / 450)));
      
      const hitPoints = 100 + reactionBonus;
      this.score += hitPoints;

      this.events.push({
        type: 'hit',
        timestamp: clickTime,
        x,
        y,
        targetId: targetHit.id,
        reactionTime: rt,
      });

      this.hitEffects.push({
        x: targetHit.x,
        y: targetHit.y,
        radius: targetHit.radius,
        maxRadius: targetHit.radius * 1.5,
        opacity: 0.8,
        color: this.settings.themeHitColor,
      });

      const replacements = this.mode.onTargetHit(
        targetHit,
        this.targets.filter(t => t.alive),
        this.canvas.width,
        this.canvas.height
      );

      replacements.forEach(t => {
        this.events.push({
          type: 'spawn',
          timestamp: t.spawnTime,
          x: t.x,
          y: t.y,
          targetId: t.id,
        });
      });

      this.targets = [
        ...this.targets.filter(t => t.alive),
        ...replacements
      ];

      this.onScoreUpdate(this.score);
    } else {
      this.misses++;
      this.score = Math.max(0, this.score - 10);
      
      this.events.push({
        type: 'miss',
        timestamp: clickTime,
        x,
        y,
      });

      this.onScoreUpdate(this.score);
    }
  };

  public start() {
    if (this.status !== 'idle') return;
    
    this.status = 'countdown';
    this.diagnostics.status = 'countdown';
    this.onStateChange('countdown');
    this.countdownTime = 3;
    this.onCountdownTick(this.countdownTime);

    console.log('[GameEngine] State → countdown');

    this.countdownIntervalId = setInterval(() => {
      this.countdownTime--;
      if (this.countdownTime > 0) {
        this.onCountdownTick(this.countdownTime);
      } else {
        clearInterval(this.countdownIntervalId!);
        this.countdownIntervalId = null;
        this.startGameplay();
      }
    }, 1000);

    // Start rendering countdown frames
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  private startGameplay() {
    this.status = 'playing';
    this.diagnostics.status = 'playing';
    this.onStateChange('playing');
    this.gameTime = 30.0;
    this.score = 0;
    this.hits = 0;
    this.misses = 0;
    this.clicks = 0;
    this.reactionTimes = [];
    this.events = [];
    this.hitEffects = [];
    this.activeHitCount = 0;
    
    // Performance init
    this.frameTimes = [];
    this.fpsHistory = [];
    this.minFps = 1000;
    this.droppedFrames = 0;
    this.lastFpsUpdate = performance.now();

    this.resetCrosshair();

    // Spawn initial targets using IMode
    this.targets = this.mode.initTargets(this.canvas.width, this.canvas.height);
    const spawnTime = performance.now();
    this.targets.forEach(t => {
      t.spawnTime = spawnTime;
      this.events.push({
        type: 'spawn',
        timestamp: spawnTime,
        x: t.x,
        y: t.y,
        targetId: t.id,
      });
    });

    this.diagnostics.activeTargets = this.targets.filter(t => t.alive).length;
    this.onScoreUpdate(this.score);
    this.lastTime = performance.now();

    console.log(`[GameEngine] State → playing | Targets: ${this.targets.length} | PointerLock: ${this.isPointerLocked() ? 'YES on ' + document.pointerLockElement?.tagName : 'NO'}`);
  }

  private endGame() {
    this.status = 'ended';
    this.diagnostics.status = 'ended';
    this.onStateChange('ended');
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    console.log(`[GameEngine] State → ended | Score: ${this.score} | Hits: ${this.hits} | Misses: ${this.misses}`);

    const accuracy = this.clicks > 0 ? this.hits / this.clicks : 0;
    const finalScore = Math.max(0, Math.round(this.score * (0.5 + 0.5 * accuracy)));

    const avgReactionTime = this.reactionTimes.length > 0 
      ? this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length 
      : 0;
    const bestReactionTime = this.reactionTimes.length > 0 
      ? Math.min(...this.reactionTimes) 
      : 0;
    const worstReactionTime = this.reactionTimes.length > 0 
      ? Math.max(...this.reactionTimes) 
      : 0;

    let medianReactionTime = 0;
    if (this.reactionTimes.length > 0) {
      const sorted = [...this.reactionTimes].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      medianReactionTime = sorted.length % 2 !== 0 
        ? sorted[mid] 
        : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    const avgFps = this.fpsHistory.length > 0
      ? this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length
      : 60;

    const stats: GameStats = {
      score: finalScore,
      hits: this.hits,
      misses: this.misses,
      accuracy,
      clicks: this.clicks,
      avgReactionTime,
      medianReactionTime,
      bestReactionTime,
      worstReactionTime,
      reactionTimes: this.reactionTimes,
      events: this.events,
    };

    const metrics: PerformanceMetrics = {
      avgFps,
      minFps: this.minFps === 1000 ? 60 : this.minFps,
      droppedFrames: this.droppedFrames,
      frameTimes: this.frameTimes,
    };

    this.onFinished(stats, metrics);
  }

  // Primary requestAnimationFrame loop
  private loop = (timestamp: number) => {
    if (this.status === 'ended' || this.destroyed) return;

    const elapsed = timestamp - this.lastTime;
    this.lastTime = timestamp;

    if (this.status === 'playing') {
      this.gameTime = Math.max(0, this.gameTime - elapsed / 1000);
      this.onTimeTick(Math.ceil(this.gameTime));

      this.frameTimes.push(elapsed);
      if (elapsed > 22) {
        this.droppedFrames++;
      }

      if (timestamp - this.lastFpsUpdate > 500) {
        const fps = elapsed > 0 ? Math.round(1000 / elapsed) : 0;
        this.fpsHistory.push(fps);
        this.diagnostics.currentFps = fps;
        if (fps < this.minFps && fps > 10) {
          this.minFps = fps;
        }
        this.lastFpsUpdate = timestamp;
      }

      if (this.gameTime <= 0) {
        this.endGame();
        return;
      }

      if (this.mode.onTick) {
        const tickReplacements = this.mode.onTick(
          this.targets,
          elapsed,
          this.canvas.width,
          this.canvas.height,
          this.activeHitCount
        );
        if (tickReplacements !== this.targets) {
          this.targets = tickReplacements;
        }
      }

      this.diagnostics.activeTargets = this.targets.filter(t => t.alive).length;
    }

    this.render();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private render() {
    const { width, height } = this.canvas;
    const theme = this.settings;

    // 1. Draw Background
    this.ctx.fillStyle = theme.themeBgColor;
    this.ctx.fillRect(0, 0, width, height);

    // 2. Draw Subtle Grid Lines
    this.ctx.strokeStyle = theme.themeAccentColor;
    this.ctx.lineWidth = 0.5;
    this.ctx.globalAlpha = 0.05;
    const gridSpacing = 80;
    for (let x = 0; x < width; x += gridSpacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSpacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }
    this.ctx.globalAlpha = 1.0;

    // 3. Draw Targets
    if (this.status === 'playing') {
      this.targets.forEach((target) => {
        if (!target.alive) return;
        
        this.ctx.save();
        
        const gradient = this.ctx.createRadialGradient(
          target.x, target.y, target.radius * 0.5,
          target.x, target.y, target.radius
        );
        gradient.addColorStop(0, theme.themeTargetColor);
        gradient.addColorStop(0.8, theme.themeTargetColor);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = theme.themeUiColor;
        this.ctx.beginPath();
        this.ctx.arc(target.x, target.y, target.radius * 0.25, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = theme.themeAccentColor;
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.restore();
      });
    }

    // 4. Draw Hit Effects
    for (let i = this.hitEffects.length - 1; i >= 0; i--) {
      const effect = this.hitEffects[i];
      effect.radius += (effect.maxRadius - effect.radius) * 0.15;
      effect.opacity -= 0.05;

      if (effect.opacity <= 0) {
        this.hitEffects.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = effect.opacity;
      this.ctx.strokeStyle = effect.color;
      this.ctx.lineWidth = 2.5;
      this.ctx.beginPath();
      this.ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
    }

    // 5. Draw Countdown Overlay
    if (this.status === 'countdown') {
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      this.ctx.fillRect(0, 0, width, height);

      this.ctx.fillStyle = theme.themeUiColor;
      this.ctx.font = 'bold 84px Outfit, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(this.countdownTime.toString(), width / 2, height / 2);

      this.ctx.font = '18px Outfit, sans-serif';
      this.ctx.fillStyle = theme.themeAccentColor;
      this.ctx.fillText('GET READY', width / 2, height / 2 - 80);
      this.ctx.restore();
    }

    // 6. Draw Crosshair
    if (this.status === 'playing' || this.status === 'countdown') {
      const parsedCrosshair = parseCrosshairCode(this.settings.crosshairCode);
      drawCrosshair(
        this.ctx,
        this.crosshair.x,
        this.crosshair.y,
        parsedCrosshair,
        this.status === 'playing' && this.clicks > 0,
        false
      );
    }
  }
}
