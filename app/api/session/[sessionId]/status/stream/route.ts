import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

type Params = Promise<{ sessionId: string }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { sessionId } = await params;

  const encoder = new TextEncoder();
  let isClosed = false;
  let timer: NodeJS.Timeout | null = null;
  let lastPayload = '';

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      const sendHeartbeat = () => {
        controller.enqueue(encoder.encode(': ping\n\n'));
      };

      const fetchAndEmit = async () => {
        try {
          const classSession = await prisma.class.findUnique({
            where: { id: sessionId },
            select: { id: true, status: true, startTime: true, endTime: true, actualStartTime: true },
          });

          if (!classSession) {
            send('error', { message: 'Session not found' });
            return;
          }

          const payload = {
            status: classSession.status,
            startTime: classSession.startTime,
            endTime: classSession.endTime,
            actualStartTime: classSession.actualStartTime,
          };

          const serialized = JSON.stringify(payload);
          if (serialized !== lastPayload) {
            lastPayload = serialized;
            send('status', payload);
          } else {
            sendHeartbeat();
          }
        } catch (error) {
          send('error', {
            message: error instanceof Error ? error.message : 'Failed to stream status',
          });
        }
      };

      fetchAndEmit();
      timer = setInterval(fetchAndEmit, 1000);

      request.signal.addEventListener('abort', () => {
        isClosed = true;
        if (timer) clearInterval(timer);
        controller.close();
      });
    },
    cancel() {
      isClosed = true;
      if (timer) clearInterval(timer);
    },
  });

  if (isClosed) {
    return new Response(null, { status: 204 });
  }

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
