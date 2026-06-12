import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || undefined;
    const limit = Number(searchParams.get('limit') || '50');

    // Fetch sessions
    const sessions = await prisma.session.findMany({
      where: mode ? { mode } : undefined,
      orderBy: { date: 'desc' },
      take: limit,
    });

    // Compute Personal Bests dynamically from Session table
    const allModes = ['SIX_SHOT', 'MULTISHOT', 'MULTISHOT_3X3'];
    const personalBests: Record<string, { score: number; accuracy: number; date: Date } | null> = {};

    for (const m of allModes) {
      const bestSession = await prisma.session.findFirst({
        where: { mode: m },
        orderBy: { score: 'desc' },
      });
      personalBests[m] = bestSession 
        ? { score: bestSession.score, accuracy: bestSession.accuracy, date: bestSession.date }
        : null;
    }

    // Top 10 scores overall (or per mode if specified)
    const top10 = await prisma.session.findMany({
      where: mode ? { mode } : undefined,
      orderBy: { score: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      sessions,
      personalBests,
      top10,
    });
  } catch (error) {
    console.error('API Sessions GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const session = await prisma.session.create({
      data: {
        mode: String(body.mode),
        duration: Number(body.duration ?? 30),
        hits: Number(body.hits),
        misses: Number(body.misses),
        accuracy: Number(body.accuracy),
        score: Number(body.score),
        events: typeof body.events === 'string' ? body.events : JSON.stringify(body.events),
        reactionTimes: Array.isArray(body.reactionTimes) 
          ? body.reactionTimes.join(',') 
          : String(body.reactionTimes),
        avgReactionTime: Number(body.avgReactionTime),
        bestReactionTime: Number(body.bestReactionTime),
        worstReactionTime: Number(body.worstReactionTime),
        avgFps: Number(body.avgFps ?? 0),
        minFps: Number(body.minFps ?? 0),
        droppedFrames: Number(body.droppedFrames ?? 0),
      },
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error('API Sessions POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
