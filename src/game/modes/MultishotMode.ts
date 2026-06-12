import { IMode, Target } from '@/types/game';

export class MultishotMode implements IMode {
  id = 'MULTISHOT';
  name = 'Multishot';
  description = '4 medium targets grouped in a local cluster. The cluster shifts position over time or after clearing targets.';
  targetRadius = 30; // 60px diameter
  maxTargets = 4;
  
  private clusterRadius = 250;
  private clusterCenter = { x: 400, y: 300 };
  
  // Tracking for cluster shifts
  private timeSinceLastShift = 0;
  private hitsAtLastShift = 0;
  private shiftIntervalMs = 5000;
  private hitsBeforeShift = 3;

  private shiftCluster(width: number, height: number) {
    const margin = 100;
    const r = this.clusterRadius;
    
    // Choose a center that ensures the cluster fits within screen boundaries as much as possible
    const minX = Math.min(width / 2, r + margin);
    const maxX = Math.max(width / 2, width - (r + margin));
    const minY = Math.min(height / 2, r + margin);
    const maxY = Math.max(height / 2, height - (r + margin));

    this.clusterCenter.x = minX + Math.random() * (maxX - minX);
    this.clusterCenter.y = minY + Math.random() * (maxY - minY);
    this.timeSinceLastShift = 0;
  }

  private getRandomClusteredPosition(
    width: number,
    height: number,
    existingTargets: Target[]
  ): { x: number; y: number } {
    let attempts = 0;
    const maxAttempts = 500;
    const padding = 20; // safe padding from screen edge

    while (attempts < maxAttempts) {
      // Polar coordinates distribution within cluster radius
      const r = Math.random() * this.clusterRadius;
      const theta = Math.random() * Math.PI * 2;
      
      let x = this.clusterCenter.x + r * Math.cos(theta);
      let y = this.clusterCenter.y + r * Math.sin(theta);
      
      // Clamp to screen boundaries (accounting for target radius + border padding)
      x = Math.max(this.targetRadius + padding, Math.min(width - this.targetRadius - padding, x));
      y = Math.max(this.targetRadius + padding, Math.min(height - this.targetRadius - padding, y));

      // Check overlap
      let overlap = false;
      for (const target of existingTargets) {
        if (!target.alive) continue;
        const dist = Math.sqrt((x - target.x) ** 2 + (y - target.y) ** 2);
        // Minimum distance is targetRadius * 2 + 10px buffer
        if (dist < this.targetRadius * 2 + 12) {
          overlap = true;
          break;
        }
      }

      if (!overlap) {
        return { x, y };
      }
      attempts++;
    }

    // Fallback if space is highly constrained
    return {
      x: this.targetRadius + padding + Math.random() * (width - 2 * (this.targetRadius + padding)),
      y: this.targetRadius + padding + Math.random() * (height - 2 * (this.targetRadius + padding)),
    };
  }

  initTargets(width: number, height: number): Target[] {
    const list: Target[] = [];
    const now = performance.now();
    
    // Choose initial cluster center
    this.shiftCluster(width, height);
    this.hitsAtLastShift = 0;
    this.timeSinceLastShift = 0;

    for (let i = 0; i < this.maxTargets; i++) {
      const pos = this.getRandomClusteredPosition(width, height, list);
      list.push({
        id: `multishot-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
        x: pos.x,
        y: pos.y,
        radius: this.targetRadius,
        spawnTime: now,
        alive: true,
      });
    }
    return list;
  }

  onTargetHit(
    hitTarget: Target,
    currentTargets: Target[],
    width: number,
    height: number
  ): Target[] {
    const now = performance.now();
    const active = currentTargets.filter(t => t.id !== hitTarget.id && t.alive);
    const pos = this.getRandomClusteredPosition(width, height, active);
    
    return [
      {
        id: `multishot-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        x: pos.x,
        y: pos.y,
        radius: this.targetRadius,
        spawnTime: now,
        alive: true,
      },
    ];
  }

  // Periodic tick checks for event-driven / time-driven shifts
  onTick(
    currentTargets: Target[],
    elapsedMs: number,
    width: number,
    height: number,
    hitCountInSession: number
  ): Target[] {
    this.timeSinceLastShift += elapsedMs;
    
    const hitsSinceLastShift = hitCountInSession - this.hitsAtLastShift;

    // Shift criteria: 3 hits or 5 seconds elapsed
    if (hitsSinceLastShift >= this.hitsBeforeShift || this.timeSinceLastShift >= this.shiftIntervalMs) {
      this.shiftCluster(width, height);
      this.hitsAtLastShift = hitCountInSession;
      
      // We regenerate active targets inside the new cluster region to transition smoothly
      const now = performance.now();
      const newTargets: Target[] = [];
      
      for (let i = 0; i < this.maxTargets; i++) {
        const pos = this.getRandomClusteredPosition(width, height, newTargets);
        newTargets.push({
          id: `multishot-shift-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
          x: pos.x,
          y: pos.y,
          radius: this.targetRadius,
          spawnTime: now,
          alive: true,
        });
      }
      return newTargets;
    }

    return currentTargets;
  }
}
