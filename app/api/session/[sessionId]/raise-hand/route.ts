import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// In-memory store: sessionId → Map<userId, { name, raisedAt }>
const raisedHands = new Map<string, Map<string, { name: string; raisedAt: string }>>();

type Params = Promise<{ sessionId: string }>;

/** GET — instructor polls for all raised hands */
export async function GET(request: NextRequest, { params }: { params: Params }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { sessionId } = await params;
  const hands = raisedHands.get(sessionId) ?? new Map();

  return NextResponse.json({
    hands: Array.from(hands.entries()).map(([userId, data]) => ({
      userId,
      name: data.name,
      raisedAt: data.raisedAt,
    })),
  });
}

/** POST — student raises or lowers hand */
export async function POST(request: NextRequest, { params }: { params: Params }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { sessionId } = await params;
  const { raised, name } = await request.json();

  if (!raisedHands.has(sessionId)) {
    raisedHands.set(sessionId, new Map());
  }
  const hands = raisedHands.get(sessionId)!;

  if (raised) {
    hands.set(session.user.id, {
      name: name ?? session.user.name ?? 'Student',
      raisedAt: new Date().toISOString(),
    });
  } else {
    hands.delete(session.user.id);
  }

  return NextResponse.json({ success: true, count: hands.size });
}

/** DELETE — instructor dismisses a specific hand (or all) */
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { sessionId } = await params;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  const hands = raisedHands.get(sessionId);
  if (hands) {
    if (userId) {
      hands.delete(userId);
    } else {
      hands.clear(); // dismiss all
    }
  }

  return NextResponse.json({ success: true });
}
