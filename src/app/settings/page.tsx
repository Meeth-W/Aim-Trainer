'use client';

import { useEffect, useRef, useState } from 'react';
import { useSettingsStore, DEFAULT_SETTINGS } from '@/store/settingsStore';
import { parseCrosshairCode, exportCrosshairCode, drawCrosshair } from '@/game/rendering/crosshairParser';
import { Save, RefreshCw, Clipboard, Check, Import } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const { settings, setSetting, setSettings, saveSettings, resetToDefault } = useSettingsStore();
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Local state for import and copy indicators
  const [importCode, setImportCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [imported, setImported] = useState(false);
  const [currentCode, setCurrentCode] = useState('');

  // Update exported crosshair code reactively when settings change
  useEffect(() => {
    const parsed = parseCrosshairCode(settings.crosshairCode);
    // Sync the crosshair settings to our general state if needed, or generate code from details.
    // For simplicity, we regenerate the code from the parsed settings to keep them synced.
    const code = settings.crosshairCode;
    setCurrentCode(code);
  }, [settings.crosshairCode]);

  // Render crosshair live preview on adjustments
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear preview canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw crosshair center
    const x = canvas.width / 2;
    const y = canvas.height / 2;
    
    // Draw background (dark gray for visibility contrast)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Subtle crosshair guides
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();

    const parsedCrosshair = parseCrosshairCode(settings.crosshairCode);
    drawCrosshair(ctx, x, y, parsedCrosshair, false, false);
  }, [settings.crosshairCode, settings.themeCrosshairColor]);

  // Handle crosshair preset imports
  const handleImport = () => {
    if (!importCode.trim()) return;
    try {
      // Parse the code to check if it's valid
      const parsed = parseCrosshairCode(importCode);
      if (parsed) {
        setSetting('crosshairCode', importCode);
        setImported(true);
        setImportCode('');
        setTimeout(() => setImported(false), 2000);
      }
    } catch (err) {
      console.error('Invalid crosshair code:', err);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Modify individual crosshair settings by parsing the current code, editing, and exporting back.
  const updateCrosshairDetail = (updater: (c: ReturnType<typeof parseCrosshairCode>) => void) => {
    const currentParsed = parseCrosshairCode(settings.crosshairCode);
    updater(currentParsed);
    const newCode = exportCrosshairCode(currentParsed);
    setSetting('crosshairCode', newCode);
  };

  const currentCrosshairDetails = parseCrosshairCode(settings.crosshairCode);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SETTINGS</h1>
          <p className="text-sm text-game-ui/60 font-light">Calibrate your aiming engine and customize your visual UI presets.</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => resetToDefault()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 font-medium transition cursor-pointer text-xs md:text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Reset Defaults
          </button>
          
          <button
            onClick={() => saveSettings(settings)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-game-accent hover:bg-game-accent/90 text-game-bg font-bold shadow-lg shadow-game-accent/15 cursor-pointer text-xs md:text-sm"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Mouse Sensitivity & Theme customizers */}
        <div className="space-y-6 lg:col-span-2">
          {/* Sensitivity Section */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-white/5 border border-white/10"
          >
            <h2 className="text-lg font-bold tracking-wide border-b border-white/5 pb-3 mb-4 text-game-accent uppercase">
              Sensitivity Settings
            </h2>
            
            <div className="space-y-6">
              {/* Sens Slider */}
              <div>
                <div className="flex justify-between text-sm mb-2 font-medium">
                  <span>Valorant Sensitivity</span>
                  <span className="text-game-accent font-bold">{settings.valorantSensitivity}</span>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0.05"
                    max="2.5"
                    step="0.01"
                    value={settings.valorantSensitivity}
                    onChange={(e) => setSetting('valorantSensitivity', parseFloat(e.target.value))}
                    className="flex-1 accent-game-accent cursor-pointer bg-white/10 h-1 rounded"
                  />
                  <input
                    type="number"
                    min="0.05"
                    max="2.5"
                    step="0.01"
                    value={settings.valorantSensitivity}
                    onChange={(e) => setSetting('valorantSensitivity', parseFloat(e.target.value) || 0.35)}
                    className="w-20 px-2 py-1 bg-white/5 border border-white/15 rounded text-center text-sm"
                  />
                </div>
              </div>

              {/* DPI Input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Mouse DPI</label>
                  <input
                    type="number"
                    min="100"
                    max="16000"
                    step="50"
                    value={settings.dpi}
                    onChange={(e) => setSetting('dpi', parseInt(e.target.value, 10) || 1600)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-sm"
                  />
                  <p className="text-[10px] text-game-ui/40 mt-1">Calibrates actual hand movement in DPI counts.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Polling Rate (Hz)</label>
                  <select
                    value={settings.pollingRate}
                    onChange={(e) => setSetting('pollingRate', parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-sm"
                  >
                    <option value="125">125 Hz</option>
                    <option value="250">250 Hz</option>
                    <option value="500">500 Hz</option>
                    <option value="1000">1000 Hz</option>
                    <option value="4000">4000 Hz</option>
                    <option value="8000">8000 Hz</option>
                  </select>
                  <p className="text-[10px] text-game-ui/40 mt-1">User input frequency preset.</p>
                </div>
              </div>

              {/* Mouse Accel & Raw input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div>
                    <span className="block text-sm font-medium">In-Game Mouse Acceleration</span>
                    <span className="text-[10px] text-game-ui/40">Smooth exponential acceleration curve.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.mouseAcceleration}
                    onChange={(e) => setSetting('mouseAcceleration', e.target.checked)}
                    className="h-4 w-4 accent-game-accent cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div>
                    <span className="block text-sm font-medium">Raw Input Emulation</span>
                    <span className="text-[10px] text-game-ui/40">Bypasses browser OS acceleration scaling.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.rawInput}
                    onChange={(e) => setSetting('rawInput', e.target.checked)}
                    className="h-4 w-4 accent-game-accent cursor-pointer"
                  />
                </div>
              </div>

              {/* Acceleration Exponent Curve Slider */}
              {settings.mouseAcceleration && (
                <div>
                  <div className="flex justify-between text-sm mb-2 font-medium">
                    <span>Acceleration Intensity (Exponent)</span>
                    <span className="text-game-accent font-bold">{settings.mouseAccelExponent}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1.01"
                      max="1.25"
                      step="0.01"
                      value={settings.mouseAccelExponent}
                      onChange={(e) => setSetting('mouseAccelExponent', parseFloat(e.target.value))}
                      className="flex-1 accent-game-accent cursor-pointer bg-white/10 h-1"
                    />
                    <span className="text-xs text-game-ui/50">Custom Curve</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Theme Settings Section */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl bg-white/5 border border-white/10"
          >
            <h2 className="text-lg font-bold tracking-wide border-b border-white/5 pb-3 mb-4 text-game-accent uppercase">
              Theme Settings
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { label: 'Background Color', key: 'themeBgColor' },
                { label: 'Accent Theme', key: 'themeAccentColor' },
                { label: 'Targets Glow', key: 'themeTargetColor' },
                { label: 'Target Hit Flashes', key: 'themeHitColor' },
                { label: 'HUD & UI Text', key: 'themeUiColor' },
                { label: 'Crosshair Visuals', key: 'themeCrosshairColor' },
              ].map((themeCol) => (
                <div key={themeCol.key}>
                  <label className="block text-xs font-medium text-game-ui/60 mb-2">{themeCol.label}</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={(settings as any)[themeCol.key] || ''}
                      onChange={(e) => setSetting(themeCol.key as any, e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-white/10 overflow-hidden bg-transparent"
                    />
                    <input
                      type="text"
                      maxLength={7}
                      value={(settings as any)[themeCol.key] || ''}
                      onChange={(e) => setSetting(themeCol.key as any, e.target.value)}
                      className="w-20 px-1 py-1 bg-white/5 border border-white/15 rounded text-center text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right column - GUI Crosshair Editor & Preview */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center"
          >
            <h2 className="text-lg font-bold tracking-wide border-b border-white/5 pb-3 mb-4 text-game-accent uppercase w-full">
              Crosshair System
            </h2>

            {/* Preview Canvas */}
            <div className="relative w-48 h-48 rounded-2xl overflow-hidden border border-white/15 shadow-inner mb-6 glow-accent">
              <canvas
                ref={previewCanvasRef}
                width={192}
                height={192}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Import / Export Controls */}
            <div className="w-full space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold uppercase text-game-ui/60 mb-2">
                  Share Crosshair Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={currentCode}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs overflow-ellipsis font-mono select-all"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 font-bold transition flex items-center gap-1 cursor-pointer text-xs"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Clipboard className="h-3.5 w-3.5" />}
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-game-ui/60 mb-2">
                  Import Valorant Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="0;p;0;c;1;s;1;P;..."
                    value={importCode}
                    onChange={(e) => setImportCode(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-mono"
                  />
                  <button
                    onClick={handleImport}
                    className="px-3 py-1.5 rounded-xl bg-game-accent hover:bg-game-accent/90 text-game-bg font-bold transition flex items-center gap-1 cursor-pointer text-xs"
                  >
                    {imported ? <Check className="h-3.5 w-3.5 text-game-bg" /> : <Import className="h-3.5 w-3.5" />}
                    Import
                  </button>
                </div>
              </div>
            </div>

            {/* GUI Sliders */}
            <div className="w-full space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {/* Color Preset select */}
              <div>
                <label className="block text-xs font-medium text-game-ui/60 mb-1.5">Color Preset</label>
                <select
                  value={currentCrosshairDetails.colorPreset}
                  onChange={(e) => updateCrosshairDetail((c) => {
                    c.colorPreset = parseInt(e.target.value, 10);
                  })}
                  className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs"
                >
                  <option value="1">White</option>
                  <option value="2">Green</option>
                  <option value="3">Yellow-Green</option>
                  <option value="4">Green-Yellow</option>
                  <option value="5">Cyan</option>
                  <option value="6">Red</option>
                  <option value="7">Pink</option>
                  <option value="8">Custom Color</option>
                </select>
              </div>

              {/* Custom hex if preset = 8 */}
              {currentCrosshairDetails.colorPreset === 8 && (
                <div>
                  <label className="block text-xs font-medium text-game-ui/60 mb-1">Custom Crosshair Color</label>
                  <input
                    type="color"
                    value={currentCrosshairDetails.customColor}
                    onChange={(e) => updateCrosshairDetail((c) => {
                      c.customColor = e.target.value;
                    })}
                    className="w-full h-8 rounded border border-white/10 overflow-hidden bg-transparent cursor-pointer"
                  />
                </div>
              )}

              {/* Center Dot */}
              <div className="border-t border-white/5 pt-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-game-accent">Center Dot</span>
                  <input
                    type="checkbox"
                    checked={currentCrosshairDetails.showCenterDot}
                    onChange={(e) => updateCrosshairDetail((c) => {
                      c.showCenterDot = e.target.checked;
                    })}
                    className="h-3.5 w-3.5 accent-game-accent"
                  />
                </div>
                
                {currentCrosshairDetails.showCenterDot && (
                  <div className="space-y-3 pl-2">
                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span>Dot Size</span>
                        <span>{currentCrosshairDetails.centerDotSize}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="6"
                        step="1"
                        value={currentCrosshairDetails.centerDotSize}
                        onChange={(e) => updateCrosshairDetail((c) => {
                          c.centerDotSize = parseInt(e.target.value, 10);
                        })}
                        className="w-full accent-game-accent h-1"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span>Dot Opacity</span>
                        <span>{currentCrosshairDetails.centerDotOpacity}</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={currentCrosshairDetails.centerDotOpacity}
                        onChange={(e) => updateCrosshairDetail((c) => {
                          c.centerDotOpacity = parseFloat(e.target.value);
                        })}
                        className="w-full accent-game-accent h-1"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Outlines */}
              <div className="border-t border-white/5 pt-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-game-accent">Outlines</span>
                  <input
                    type="checkbox"
                    checked={currentCrosshairDetails.showOutlines}
                    onChange={(e) => updateCrosshairDetail((c) => {
                      c.showOutlines = e.target.checked;
                    })}
                    className="h-3.5 w-3.5 accent-game-accent"
                  />
                </div>

                {currentCrosshairDetails.showOutlines && (
                  <div className="space-y-3 pl-2">
                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span>Outline Thickness</span>
                        <span>{currentCrosshairDetails.outlineThickness}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="3"
                        step="1"
                        value={currentCrosshairDetails.outlineThickness}
                        onChange={(e) => updateCrosshairDetail((c) => {
                          c.outlineThickness = parseInt(e.target.value, 10);
                        })}
                        className="w-full accent-game-accent h-1"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span>Outline Opacity</span>
                        <span>{currentCrosshairDetails.outlineOpacity}</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={currentCrosshairDetails.outlineOpacity}
                        onChange={(e) => updateCrosshairDetail((c) => {
                          c.outlineOpacity = parseFloat(e.target.value);
                        })}
                        className="w-full accent-game-accent h-1"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Inner Lines */}
              <div className="border-t border-white/5 pt-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-game-accent">Inner Lines</span>
                  <input
                    type="checkbox"
                    checked={currentCrosshairDetails.showInnerLines}
                    onChange={(e) => updateCrosshairDetail((c) => {
                      c.showInnerLines = e.target.checked;
                    })}
                    className="h-3.5 w-3.5 accent-game-accent"
                  />
                </div>

                {currentCrosshairDetails.showInnerLines && (
                  <div className="space-y-3 pl-2">
                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span>Opacity</span>
                        <span>{currentCrosshairDetails.innerOpacity}</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={currentCrosshairDetails.innerOpacity}
                        onChange={(e) => updateCrosshairDetail((c) => {
                          c.innerOpacity = parseFloat(e.target.value);
                        })}
                        className="w-full accent-game-accent h-1"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span>Length</span>
                        <span>{currentCrosshairDetails.innerLength}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        step="1"
                        value={currentCrosshairDetails.innerLength}
                        onChange={(e) => updateCrosshairDetail((c) => {
                          c.innerLength = parseInt(e.target.value, 10);
                        })}
                        className="w-full accent-game-accent h-1"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span>Thickness</span>
                        <span>{currentCrosshairDetails.innerThickness}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={currentCrosshairDetails.innerThickness}
                        onChange={(e) => updateCrosshairDetail((c) => {
                          c.innerThickness = parseInt(e.target.value, 10);
                        })}
                        className="w-full accent-game-accent h-1"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span>Offset (Gap)</span>
                        <span>{currentCrosshairDetails.innerGap}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        step="1"
                        value={currentCrosshairDetails.innerGap}
                        onChange={(e) => updateCrosshairDetail((c) => {
                          c.innerGap = parseInt(e.target.value, 10);
                        })}
                        className="w-full accent-game-accent h-1"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] py-1 bg-white/5 px-2 rounded">
                      <span>Movement Error</span>
                      <input
                        type="checkbox"
                        checked={currentCrosshairDetails.innerMovementError}
                        onChange={(e) => updateCrosshairDetail((c) => {
                          c.innerMovementError = e.target.checked;
                        })}
                        className="h-3 w-3 accent-game-accent cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] py-1 bg-white/5 px-2 rounded">
                      <span>Firing Error</span>
                      <input
                        type="checkbox"
                        checked={currentCrosshairDetails.innerFiringError}
                        onChange={(e) => updateCrosshairDetail((c) => {
                          c.innerFiringError = e.target.checked;
                        })}
                        className="h-3 w-3 accent-game-accent cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Outer Lines */}
              <div className="border-t border-white/5 pt-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-game-accent">Outer Lines</span>
                  <input
                    type="checkbox"
                    checked={currentCrosshairDetails.showOuterLines}
                    onChange={(e) => updateCrosshairDetail((c) => {
                      c.showOuterLines = e.target.checked;
                    })}
                    className="h-3.5 w-3.5 accent-game-accent"
                  />
                </div>

                {currentCrosshairDetails.showOuterLines && (
                  <div className="space-y-3 pl-2">
                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span>Opacity</span>
                        <span>{currentCrosshairDetails.outerOpacity}</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={currentCrosshairDetails.outerOpacity}
                        onChange={(e) => updateCrosshairDetail((c) => {
                          c.outerOpacity = parseFloat(e.target.value);
                        })}
                        className="w-full accent-game-accent h-1"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span>Length</span>
                        <span>{currentCrosshairDetails.outerLength}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        step="1"
                        value={currentCrosshairDetails.outerLength}
                        onChange={(e) => updateCrosshairDetail((c) => {
                          c.outerLength = parseInt(e.target.value, 10);
                        })}
                        className="w-full accent-game-accent h-1"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span>Thickness</span>
                        <span>{currentCrosshairDetails.outerThickness}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={currentCrosshairDetails.outerThickness}
                        onChange={(e) => updateCrosshairDetail((c) => {
                          c.outerThickness = parseInt(e.target.value, 10);
                        })}
                        className="w-full accent-game-accent h-1"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span>Offset (Gap)</span>
                        <span>{currentCrosshairDetails.outerGap}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        step="1"
                        value={currentCrosshairDetails.outerGap}
                        onChange={(e) => updateCrosshairDetail((c) => {
                          c.outerGap = parseInt(e.target.value, 10);
                        })}
                        className="w-full accent-game-accent h-1"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] py-1 bg-white/5 px-2 rounded">
                      <span>Movement Error</span>
                      <input
                        type="checkbox"
                        checked={currentCrosshairDetails.outerMovementError}
                        onChange={(e) => updateCrosshairDetail((c) => {
                          c.outerMovementError = e.target.checked;
                        })}
                        className="h-3 w-3 accent-game-accent cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] py-1 bg-white/5 px-2 rounded">
                      <span>Firing Error</span>
                      <input
                        type="checkbox"
                        checked={currentCrosshairDetails.outerFiringError}
                        onChange={(e) => updateCrosshairDetail((c) => {
                          c.outerFiringError = e.target.checked;
                        })}
                        className="h-3 w-3 accent-game-accent cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
