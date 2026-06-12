import { IMode, Target } from '@/types/game';

interface CellPosition {
  index: number;
  x: number;
  y: number;
}

export class Multishot3x3Mode implements IMode {
  id = 'MULTISHOT_3X3';
  name = 'Multishot 3x3';
  description = '3 medium-small targets placed randomly inside a 3x3 grid. Replaces immediately inside an empty grid cell.';
  targetRadius = 25; // 50px diameter
  maxTargets = 3;
  
  // Track grid cells occupied by active targets
  private occupiedCellIndices: Set<number> = new Set();

  private getGridCells(width: number, height: number): CellPosition[] {
    // Occupy the middle 60% of screen space
    const paddingX = width * 0.2;
    const paddingY = height * 0.2;
    const gridWidth = width * 0.6;
    const gridHeight = height * 0.6;

    const cellWidth = gridWidth / 3;
    const cellHeight = gridHeight / 3;

    const cells: CellPosition[] = [];
    let idx = 0;

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        cells.push({
          index: idx++,
          x: paddingX + col * cellWidth + cellWidth / 2,
          y: paddingY + row * cellHeight + cellHeight / 2,
        });
      }
    }

    return cells;
  }

  initTargets(width: number, height: number): Target[] {
    this.occupiedCellIndices.clear();
    const cells = this.getGridCells(width, height);
    const list: Target[] = [];
    const now = performance.now();

    // Select 3 random unique cells
    const availableIndices = Array.from({ length: 9 }, (_, i) => i);
    
    for (let i = 0; i < this.maxTargets; i++) {
      if (availableIndices.length === 0) break;
      const randIdx = Math.floor(Math.random() * availableIndices.length);
      const cellIdx = availableIndices.splice(randIdx, 1)[0];
      
      const cell = cells[cellIdx];
      this.occupiedCellIndices.add(cell.index);

      list.push({
        id: `3x3-${Date.now()}-${i}-${cellIdx}-${Math.random().toString(36).substr(2, 5)}`,
        x: cell.x,
        y: cell.y,
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
    const cells = this.getGridCells(width, height);

    // Recompute occupied cell indexes from active targets
    this.occupiedCellIndices.clear();
    currentTargets.forEach(t => {
      if (t.id !== hitTarget.id && t.alive) {
        // Find matching cell index by distance
        const cell = cells.find(c => Math.abs(c.x - t.x) < 5 && Math.abs(c.y - t.y) < 5);
        if (cell) this.occupiedCellIndices.add(cell.index);
      }
    });

    // Find unoccupied cells
    const emptyCells = cells.filter(c => !this.occupiedCellIndices.has(c.index));

    if (emptyCells.length === 0) {
      return []; // fallback if somehow full
    }

    // Select random empty cell
    const randCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    this.occupiedCellIndices.add(randCell.index);

    return [
      {
        id: `3x3-${Date.now()}-${randCell.index}-${Math.random().toString(36).substr(2, 5)}`,
        x: randCell.x,
        y: randCell.y,
        radius: this.targetRadius,
        spawnTime: now,
        alive: true,
      },
    ];
  }
}
