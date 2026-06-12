import { parseCrosshairCode, exportCrosshairCode } from './rendering/crosshairParser';
import { calculateDisplacement } from './input/sensitivity';

function runTests() {
  console.log('--- STARTING AIMER ENGINE UNIT TESTS ---');

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, message: string) => {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  };

  // 1. Crosshair Parser Tests
  try {
    const originalCode = '0;p;0;c;1;s;1;P;c;8;u;6E92FFFF;b;1;o;0.6;t;2;d;1;s;4;z;0.9;0t;3;0l;5;0o;4;0a;0.8;0f;1;0s;1;1b;1;1t;3;1l;4;1o;12;1a;0.4;1f;1;1s;1';
    
    // Parse the code
    const settings = parseCrosshairCode(originalCode);
    
    assert(settings.colorPreset === 8, 'Parses custom color preset');
    assert(settings.customColor === '#6e92ff', `Parses hex custom color (expected #6e92ff, got ${settings.customColor})`);
    assert(settings.showCenterDot === true, 'Parses show center dot');
    assert(settings.centerDotSize === 4, 'Parses center dot size');
    assert(settings.centerDotOpacity === 0.9, 'Parses center dot opacity');
    assert(settings.outlineOpacity === 0.6, 'Parses outline opacity');
    assert(settings.outlineThickness === 2, 'Parses outline thickness');
    assert(settings.innerThickness === 3, 'Parses inner line thickness');
    assert(settings.innerLength === 5, 'Parses inner line length');
    assert(settings.innerGap === 4, 'Parses inner line gap');
    assert(settings.innerOpacity === 0.8, 'Parses inner line opacity');
    assert(settings.innerFiringError === true, 'Parses inner firing error');
    assert(settings.innerMovementError === true, 'Parses inner movement error');
    assert(settings.showOuterLines === true, 'Parses show outer lines');
    assert(settings.outerThickness === 3, 'Parses outer line thickness');
    assert(settings.outerLength === 4, 'Parses outer line length');
    assert(settings.outerGap === 12, 'Parses outer line gap');
    assert(settings.outerOpacity === 0.4, 'Parses outer line opacity');
    assert(settings.outerFiringError === true, 'Parses outer firing error');
    assert(settings.outerMovementError === true, 'Parses outer movement error');

    // Regenerate code
    const regeneratedCode = exportCrosshairCode(settings);
    // Double check that re-parsing regenerated code yields equivalent details
    const reparsedSettings = parseCrosshairCode(regeneratedCode);
    assert(reparsedSettings.customColor === '#6e92ff', 'Bi-directional parser custom color matches');
    assert(reparsedSettings.innerThickness === 3, 'Bi-directional parser thickness matches');
    assert(reparsedSettings.outerGap === 12, 'Bi-directional parser outer gap matches');
    assert(reparsedSettings.showCenterDot === true, 'Bi-directional parser center dot matches');

  } catch (err: any) {
    console.error('[CRITICAL] Crosshair parser test errored:', err);
    failed++;
  }

  // 2. Sensitivity Calculation Tests
  try {
    // Standard Valorant Sens (0.35), DPI (1600), movementX (100)
    const dispRaw = calculateDisplacement({
      movementX: 100,
      movementY: 0,
      sensitivity: 0.35,
      dpi: 1600,
      useAcceleration: false,
      accelerationExponent: 1.05,
    });

    // expected scale = 0.35 * 1600 * 0.003 = 1.68
    // expected displacement = 100 * 1.68 = 168
    assert(Math.abs(dispRaw.x - 168) < 0.001, `Displacement scales linearly by eDPI (expected 168, got ${dispRaw.x})`);

    // eDPI matching check: Sens 0.7, DPI 800 should result in exact same displacement as Sens 0.35, DPI 1600
    const dispDpiMatching = calculateDisplacement({
      movementX: 100,
      movementY: 0,
      sensitivity: 0.7,
      dpi: 800,
      useAcceleration: false,
      accelerationExponent: 1.05,
    });
    assert(Math.abs(dispDpiMatching.x - dispRaw.x) < 0.001, 'Sensitivity scales proportionally to eDPI (physical muscle memory matching)');

    // Mouse Acceleration check (speed makes it move further)
    const dispAccelSlow = calculateDisplacement({
      movementX: 10,
      movementY: 0,
      sensitivity: 0.35,
      dpi: 1600,
      useAcceleration: true,
      accelerationExponent: 1.1, // accel enabled
    });

    const dispAccelFast = calculateDisplacement({
      movementX: 100,
      movementY: 0,
      sensitivity: 0.35,
      dpi: 1600,
      useAcceleration: true,
      accelerationExponent: 1.1, // accel enabled
    });

    // With acceleration, moving 10 times faster should result in MORE than 10 times the displacement!
    const ratio = dispAccelFast.x / dispAccelSlow.x;
    assert(ratio > 10, `Mouse acceleration curve boosts fast movements (ratio expected > 10, got ${ratio.toFixed(2)})`);

  } catch (err: any) {
    console.error('[CRITICAL] Sensitivity calculator test errored:', err);
    failed++;
  }

  console.log(`\n--- TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ---`);
}

// Run unit tests if executed directly
if (require.main === module) {
  runTests();
}

export { runTests };
