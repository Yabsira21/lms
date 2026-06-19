import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// In-memory poll store (per-process). For production, use Redis or DB.
// Key: sessionId, Value: poll object
const polls = new Map<string, {
  id: string;
  question: string;
  options: string[];
  votes: Record<string, string>; // userId -> option
  createdAt: string;
  active: boolean;
}>();

type Params = Promise<{ sessionId: string }>;

/** GET — students poll for the active poll */
export async function GET(request: NextRequest, { params }: { params: Params }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { sessionId } = await params;
  const poll = polls.get(sessionId);

  if (!poll || !poll.active) {
    return NextResponse.json({ poll: null });
  }

  // Return vote counts without exposing who voted what
  const counts: Record<string, number> = {};
  poll.options.forEach(o => { counts[o] = 0; });
  Object.values(poll.votes).forEach(v => { counts[v] = (counts[v] ?? 0) + 1; });

  return NextResponse.json({
    poll: {
      id: poll.id,
      question: poll.question,
      options: poll.options,
      counts,
      totalVotes: Object.keys(poll.votes).length,
      myVote: poll.votes[session.user.id] ?? null,
      active: poll.active,
    }
  });
}

/** POST — instructor creates a poll OR student submits a vote */
export async function POST(request: NextRequest, { params }: { params: Params }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { sessionId } = await params;
  const body = await request.json();

  // Student voting
  if (body.vote !== undefined) {
    const poll = polls.get(sessionId);
    if (!poll || !poll.active) {
      return NextResponse.json({ error: 'No active poll' }, { status: 400 });
    }
    if (!poll.options.includes(body.vote)) {
      return NextResponse.json({ error: 'Invalid option' }, { status: 400 });
    }
    poll.votes[session.user.id] = body.vote;
    return NextResponse.json({ success: true });
  }

  // Instructor creating a poll
  const { question, options } = body;
  if (!question || !Array.isArray(options) || options.length < 2) {
    return NextResponse.json({ error: 'question and at least 2 options required' }, { status: 400 });
  }

  const poll = {
    id: `poll-${Date.now()}`,
    question,
    options,
    votes: {} as Record<string, string>,
    createdAt: new Date().toISOString(),
    active: true,
  };
  polls.set(sessionId, poll);

  return NextResponse.json({ success: true, poll });
}

/** DELETE — instructor closes the poll */
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { sessionId } = await params;
  const poll = polls.get(sessionId);
  if (poll) poll.active = false;

  return NextResponse.json({ success: true });
}
