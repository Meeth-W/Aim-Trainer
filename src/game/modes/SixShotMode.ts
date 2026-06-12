import { IMode, Target } from '@/types/game';

function getRandomPosition(
  width: number,
  height: number,
  radius: number,
  existingTargets: Target[],
  margin: number = 50
): { x: number; y: number } {
  let attempts = 0;
  const maxAttempts = 1000;
  const bufferSpacing = 15; // Minimum pixels between target borders

  while (attempts < maxAttempts) {
    // Keep targets inside safe margins
    const minX = margin + radius;
    const maxX = width - margin - radius;
    const minY = margin + radius;
    const maxY = height - margin - radius;

    const x = minX + Math.random() * (maxX - minX);
    const y = minY + Math.random() * (maxY - minY);

    // Overlap check
    let overlap = false;
    for (const target of existingTargets) {
      if (!target.alive) continue;
      const dist = Math.sqrt((x - target.x) ** 2 + (y - target.y) ** 2);
      if (dist < radius + target.radius + bufferSpacing) {
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
    x: margin + radius + Math.random() * (width - 2 * (margin + radius)),
    y: margin + radius + Math.random() * (height - 2 * (margin + radius)),
  };
}

export class SixShotMode implements IMode {
  id = 'SIX_SHOT';
  name = 'Six Shot';
  description = '6 small targets, randomly distributed across the screen. Replaces immediately on hit.';
  targetRadius = 20; // 40px diameter
  maxTargets = 6;

  initTargets(width: number, height: number): Target[] {
    const list: Target[] = [];
    const now = performance.now();
    for (let i = 0; i < this.maxTargets; i++) {
      const pos = getRandomPosition(width, height, this.targetRadius, list);
      list.push({
        id: `sixshot-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
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
    // Filter out the hit target and generate a replacement
    const active = currentTargets.filter(t => t.id !== hitTarget.id && t.alive);
    const pos = getRandomPosition(width, height, this.targetRadius, active);
    
    return [
      {
        id: `sixshot-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        x: pos.x,
        y: pos.y,
        radius: this.targetRadius,
        spawnTime: now,
        alive: true,
      },
    ];
  }
}
