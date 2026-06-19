import { NextRequest, NextResponse } from 'next/server';
import { RoomServiceClient } from 'livekit-server-sdk';
import { auth } from '@/lib/auth';

/**
 * POST /api/livekit/mute-all
 * Mutes all participants in a room except the instructor.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomName } = await request.json();
    if (!roomName) {
      return NextResponse.json({ error: 'roomName is required' }, { status: 400 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const serverUrl = process.env.LIVEKIT_URL ?? process.env.NEXT_PUBLIC_LIVEKIT_URL ?? '';

    if (!apiKey || !apiSecret || !serverUrl) {
      return NextResponse.json({ error: 'LiveKit credentials not configured' }, { status: 500 });
    }

    const svc = new RoomServiceClient(serverUrl, apiKey, apiSecret);

    // List all participants in the room
    const participants = await svc.listParticipants(roomName);

    // Mute microphone track for everyone except the caller (instructor)
    const mutePromises = participants
      .filter(p => p.identity !== session.user.id)
      .map(p =>
        svc.mutePublishedTrack(roomName, p.identity, p.tracks.find(t => t.source === 1 /* MICROPHONE */)?.sid ?? '', true)
          .catch(() => {}) // ignore if participant has no mic track
      );

    await Promise.all(mutePromises);

    return NextResponse.json({ success: true, mutedCount: mutePromises.length });
  } catch (error) {
    console.error('[mute-all]', error);
    return NextResponse.json({ error: 'Failed to mute participants' }, { status: 500 });
  }
}
