import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_SETTINGS } from '@/store/settingsStore';

export async function GET() {
  try {
    let settings = await prisma.userSettings.findUnique({
      where: { id: 'default-user' },
    });

    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          id: 'default-user',
          ...DEFAULT_SETTINGS,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('API Settings GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const updatedSettings = await prisma.userSettings.upsert({
      where: { id: 'default-user' },
      update: {
        valorantSensitivity: Number(body.valorantSensitivity),
        dpi: Number(body.dpi),
        pollingRate: Number(body.pollingRate),
        mouseAcceleration: Boolean(body.mouseAcceleration),
        mouseAccelExponent: Number(body.mouseAccelExponent ?? 1.05),
        rawInput: Boolean(body.rawInput),
        themeBgColor: String(body.themeBgColor),
        themeAccentColor: String(body.themeAccentColor),
        themeTargetColor: String(body.themeTargetColor),
        themeHitColor: String(body.themeHitColor),
        themeUiColor: String(body.themeUiColor),
        themeCrosshairColor: String(body.themeCrosshairColor),
        crosshairCode: String(body.crosshairCode),
      },
      create: {
        id: 'default-user',
        valorantSensitivity: Number(body.valorantSensitivity ?? 0.35),
        dpi: Number(body.dpi ?? 1600),
        pollingRate: Number(body.pollingRate ?? 1000),
        mouseAcceleration: Boolean(body.mouseAcceleration ?? false),
        mouseAccelExponent: Number(body.mouseAccelExponent ?? 1.05),
        rawInput: Boolean(body.rawInput ?? true),
        themeBgColor: String(body.themeBgColor ?? '#09090b'),
        themeAccentColor: String(body.themeAccentColor ?? '#06b6d4'),
        themeTargetColor: String(body.themeTargetColor ?? '#f43f5e'),
        themeHitColor: String(body.themeHitColor ?? '#10b981'),
        themeUiColor: String(body.themeUiColor ?? '#f4f4f5'),
        themeCrosshairColor: String(body.themeCrosshairColor ?? '#00ff00'),
        crosshairCode: String(body.crosshairCode ?? ''),
      },
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('API Settings POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
