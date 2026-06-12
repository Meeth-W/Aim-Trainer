export interface CrosshairSettings {
  showCenterDot: boolean;
  centerDotSize: number;
  centerDotOpacity: number;
  showOutlines: boolean;
  outlineOpacity: number;
  outlineThickness: number;
  colorPreset: number; // 1-8 (8 = custom)
  customColor: string; // Hex string e.g. '#6E92FF'
  showInnerLines: boolean;
  innerOpacity: number;
  innerLength: number;
  innerThickness: number;
  innerGap: number;
  innerMovementError: boolean;
  innerFiringError: boolean;
  showOuterLines: boolean;
  outerOpacity: number;
  outerLength: number;
  outerThickness: number;
  outerGap: number;
  outerMovementError: boolean;
  outerFiringError: boolean;
}

export const DEFAULT_CROSSHAIR: CrosshairSettings = {
  showCenterDot: false,
  centerDotSize: 2,
  centerDotOpacity: 1.0,
  showOutlines: true,
  outlineOpacity: 0.5,
  outlineThickness: 1,
  colorPreset: 2, // Green
  customColor: '#00ff00',
  showInnerLines: true,
  innerOpacity: 1.0,
  innerLength: 6,
  innerThickness: 2,
  innerGap: 3,
  innerMovementError: false,
  innerFiringError: false,
  showOuterLines: false,
  outerOpacity: 0.35,
  outerLength: 2,
  outerThickness: 2,
  outerGap: 10,
  outerMovementError: false,
  outerFiringError: false,
};

// Preset colors mapped from Valorant
export function getColorFromPreset(preset: number): string {
  switch (preset) {
    case 1: return '#ffffff'; // White
    case 2: return '#00ff00'; // Green
    case 3: return '#7fff00'; // Yellow Green
    case 4: return '#dfff00'; // Green Yellow
    case 5: return '#00ffff'; // Cyan
    case 6: return '#ff0000'; // Red
    case 7: return '#ff00ff'; // Pink
    case 8: return '#00ff00'; // Custom default to Green
    default: return '#00ff00';
  }
}

export function parseCrosshairCode(code: string): CrosshairSettings {
  const settings = { ...DEFAULT_CROSSHAIR };
  if (!code) return settings;

  const tokens = code.split(';');
  let currentSection = 'Global';

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token === 'P') {
      currentSection = 'Primary';
      continue;
    } else if (token === 'A') {
      currentSection = 'ADS';
      continue;
    } else if (token === 'S') {
      currentSection = 'Sniper';
      continue;
    }

    // Since token value pairs are sequential
    const valueStr = tokens[i + 1];
    if (valueStr === undefined) break;

    if (currentSection === 'Primary' || currentSection === 'Global') {
      switch (token) {
        case 'c':
          settings.colorPreset = parseInt(valueStr, 10);
          if (settings.colorPreset !== 8) {
            settings.customColor = getColorFromPreset(settings.colorPreset);
          }
          break;
        case 'u':
          // Extract first 6 characters and hex format
          settings.customColor = '#' + valueStr.substring(0, 6).toLowerCase();
          settings.colorPreset = 8;
          break;
        case 'b':
          settings.showOutlines = valueStr === '1';
          break;
        case 'o':
          settings.outlineOpacity = parseFloat(valueStr);
          break;
        case 't':
          settings.outlineThickness = parseInt(valueStr, 10);
          break;
        case 'd':
          settings.showCenterDot = valueStr === '1';
          break;
        case 's':
          settings.centerDotSize = parseInt(valueStr, 10);
          break;
        case 'z':
          settings.centerDotOpacity = parseFloat(valueStr);
          break;
        case '0b':
          settings.showInnerLines = valueStr === '1';
          break;
        case '0t':
          settings.innerThickness = parseInt(valueStr, 10);
          break;
        case '0l':
          settings.innerLength = parseInt(valueStr, 10);
          break;
        case '0o':
          settings.innerGap = parseInt(valueStr, 10);
          break;
        case '0a':
          settings.innerOpacity = parseFloat(valueStr);
          break;
        case '0f':
          settings.innerFiringError = valueStr === '1';
          break;
        case '0s':
          settings.innerMovementError = valueStr === '1';
          break;
        case '1b':
          settings.showOuterLines = valueStr === '1';
          break;
        case '1t':
          settings.outerThickness = parseInt(valueStr, 10);
          break;
        case '1l':
          settings.outerLength = parseInt(valueStr, 10);
          break;
        case '1o':
          settings.outerGap = parseInt(valueStr, 10);
          break;
        case '1a':
          settings.outerOpacity = parseFloat(valueStr);
          break;
        case '1f':
          settings.outerFiringError = valueStr === '1';
          break;
        case '1s':
          settings.outerMovementError = valueStr === '1';
          break;
      }
    }

    i++; // Skip value token
  }

  return settings;
}

export function exportCrosshairCode(settings: CrosshairSettings): string {
  const parts: string[] = ['0', 'p', '0', 'P']; // Version, profile, and Primary section

  if (settings.colorPreset !== 2) {
    parts.push('c', settings.colorPreset.toString());
  }
  if (settings.colorPreset === 8 && settings.customColor) {
    const hex = settings.customColor.replace('#', '').toUpperCase() + 'FF';
    parts.push('u', hex);
  }

  if (!settings.showOutlines) parts.push('b', '0');
  if (settings.outlineOpacity !== 0.5) parts.push('o', settings.outlineOpacity.toString());
  if (settings.outlineThickness !== 1) parts.push('t', settings.outlineThickness.toString());

  if (settings.showCenterDot) parts.push('d', '1');
  if (settings.centerDotSize !== 2) parts.push('s', settings.centerDotSize.toString());
  if (settings.centerDotOpacity !== 1.0) parts.push('z', settings.centerDotOpacity.toString());

  // Inner lines
  if (!settings.showInnerLines) parts.push('0b', '0');
  if (settings.innerThickness !== 2) parts.push('0t', settings.innerThickness.toString());
  if (settings.innerLength !== 6) parts.push('0l', settings.innerLength.toString());
  if (settings.innerGap !== 3) parts.push('0o', settings.innerGap.toString());
  if (settings.innerOpacity !== 1.0) parts.push('0a', settings.innerOpacity.toString());
  if (settings.innerFiringError) parts.push('0f', '1');
  if (settings.innerMovementError) parts.push('0s', '1');

  // Outer lines
  if (settings.showOuterLines) parts.push('1b', '1');
  if (settings.outerThickness !== 2) parts.push('1t', settings.outerThickness.toString());
  if (settings.outerLength !== 2) parts.push('1l', settings.outerLength.toString());
  if (settings.outerGap !== 10) parts.push('1o', settings.outerGap.toString());
  if (settings.outerOpacity !== 0.35) parts.push('1a', settings.outerOpacity.toString());
  if (settings.outerFiringError) parts.push('1f', '1');
  if (settings.outerMovementError) parts.push('1s', '1');

  return parts.join(';');
}

export function drawCrosshair(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  settings: CrosshairSettings,
  isFiring: boolean = false,
  isMoving: boolean = false
) {
  const color = settings.colorPreset === 8 ? settings.customColor : getColorFromPreset(settings.colorPreset);

  // Dynamic gap sizing based on firing/moving errors
  let innerGap = settings.innerGap;
  let outerGap = settings.outerGap;

  if (isFiring) {
    if (settings.innerFiringError) innerGap += 4;
    if (settings.outerFiringError) outerGap += 8;
  }
  if (isMoving) {
    if (settings.innerMovementError) innerGap += 2;
    if (settings.outerMovementError) outerGap += 4;
  }

  // Draw Center Dot
  if (settings.showCenterDot) {
    const r = settings.centerDotSize / 2;
    ctx.save();
    ctx.globalAlpha = settings.centerDotOpacity;
    
    // Center Dot Outlines
    if (settings.showOutlines) {
      ctx.fillStyle = '#000000';
      const outSize = settings.centerDotSize + settings.outlineThickness * 2;
      ctx.fillRect(x - outSize / 2, y - outSize / 2, outSize, outSize);
    }
    
    ctx.fillStyle = color;
    ctx.fillRect(x - r, y - r, settings.centerDotSize, settings.centerDotSize);
    ctx.restore();
  }

  // Helper to draw a line with outline
  const drawLine = (
    ctx: CanvasRenderingContext2D,
    xStart: number,
    yStart: number,
    w: number,
    h: number,
    opacity: number
  ) => {
    ctx.save();
    ctx.globalAlpha = opacity;

    // Draw outline
    if (settings.showOutlines) {
      ctx.fillStyle = '#000000';
      const ot = settings.outlineThickness;
      ctx.fillRect(xStart - ot, yStart - ot, w + ot * 2, h + ot * 2);
    }

    ctx.fillStyle = color;
    ctx.fillRect(xStart, yStart, w, h);
    ctx.restore();
  };

  // Draw Inner Lines
  if (settings.showInnerLines) {
    const len = settings.innerLength;
    const thick = settings.innerThickness;
    const gap = innerGap;
    const opacity = settings.innerOpacity;

    // Left line
    drawLine(ctx, x - gap - len, y - thick / 2, len, thick, opacity);
    // Right line
    drawLine(ctx, x + gap, y - thick / 2, len, thick, opacity);
    // Top line
    drawLine(ctx, x - thick / 2, y - gap - len, thick, len, opacity);
    // Bottom line
    drawLine(ctx, x - thick / 2, y + gap, thick, len, opacity);
  }

  // Draw Outer Lines
  if (settings.showOuterLines) {
    const len = settings.outerLength;
    const thick = settings.outerThickness;
    const gap = outerGap;
    const opacity = settings.outerOpacity;

    // Left line
    drawLine(ctx, x - gap - len, y - thick / 2, len, thick, opacity);
    // Right line
    drawLine(ctx, x + gap, y - thick / 2, len, thick, opacity);
    // Top line
    drawLine(ctx, x - thick / 2, y - gap - len, thick, len, opacity);
    // Bottom line
    drawLine(ctx, x - thick / 2, y + gap, thick, len, opacity);
  }
}
