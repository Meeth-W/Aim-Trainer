interface CalculateDisplacementParams {
  movementX: number;
  movementY: number;
  sensitivity: number;
  dpi: number;
  useAcceleration: boolean;
  accelerationExponent: number;
}

// baseMultiplier is calibrated so that default Valorant sens (0.35) and DPI (1600) 
// yield a comfortable crosshair movement rate on screen.
const BASE_MULTIPLIER = 0.003;

export function calculateDisplacement({
  movementX,
  movementY,
  sensitivity,
  dpi,
  useAcceleration,
  accelerationExponent,
}: CalculateDisplacementParams) {
  let dx = movementX;
  let dy = movementY;

  // 1. Apply custom in-app mouse acceleration curve if enabled
  if (useAcceleration && accelerationExponent !== 1) {
    const magnitude = Math.sqrt(dx * dx + dy * dy);
    if (magnitude > 0) {
      // Scale factor grows larger with speed, using the exponent
      const accelFactor = Math.pow(magnitude, accelerationExponent - 1);
      dx *= accelFactor;
      dy *= accelFactor;
    }
  }

  // 2. Scale by effective DPI (sensitivity * dpi) to preserve physical muscle memory
  // physical displacement maps: displacement = counts * sensitivity * dpi * baseMultiplier
  const scale = sensitivity * dpi * BASE_MULTIPLIER;

  return {
    x: dx * scale,
    y: dy * scale,
  };
}
