import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// In-memory stroke store per session (for production use Redis/Pusher)
const whiteboards = new Map<string, {
  strokes: Array<{
    id: string;
    points: Array<{ x: number; y: number }>;
    color: string;
    width: number;
    tool: 'pen' | 'eraser';
  }>;
  version: number;
}>();

type Params = Promise<{ sessionId: string }>;

/** GET — students poll for the current whiteboard state */
export async function GET(request: NextRequest, { params }: { params: Params }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { sessionId } = await params;
  const { searchParams } = new URL(request.url);
  const since = parseInt(searchParams.get('since') ?? '0');

  const board = whiteboards.get(sessionId) ?? { strokes: [], version: 0 };

  return NextResponse.json({
    strokes: board.strokes,
    version: board.version,
    hasUpdate: board.version > since,
  });
}

/** POST — instructor adds a stroke */
export async function POST(request: NextRequest, { params }: { params: Params }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { sessionId } = await params;
  const body = await request.json();
  const { stroke } = body; // { id, points, color, width, tool }

  if (!stroke || !stroke.id || !Array.isArray(stroke.points)) {
    return NextResponse.json({ error: 'Invalid stroke' }, { status: 400 });
  }

  const board = whiteboards.get(sessionId) ?? { strokes: [], version: 0 };

  // Replace existing stroke with same id (for live drawing updates) or add new
  const idx = board.strokes.findIndex(s => s.id === stroke.id);
  if (idx >= 0) {
    board.strokes[idx] = stroke;
  } else {
    board.strokes.push(stroke);
  }
  board.version++;
  whiteboards.set(sessionId, board);

  return NextResponse.json({ success: true, version: board.version });
}

/** DELETE — clear the whiteboard */
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { sessionId } = await params;
  whiteboards.set(sessionId, { strokes: [], version: (whiteboards.get(sessionId)?.version ?? 0) + 1 });

  return NextResponse.json({ success: true });
}
