'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Pen, Eraser, Trash2, X, Minus, Plus } from 'lucide-react';

interface Stroke {
  id: string;
  points: Array<{ x: number; y: number }>;
  color: string;
  width: number;
  tool: 'pen' | 'eraser';
}

interface Props {
  sessionId: string;
  isInstructor: boolean;
  onClose: () => void;
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ffffff', '#000000'];

export default function Whiteboard({ sessionId, isInstructor, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#ef4444');
  const [width, setWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [version, setVersion] = useState(0);

  const currentStrokeRef = useRef<Stroke | null>(null);
  const allStrokesRef = useRef<Stroke[]>([]);

  // ── Render all strokes onto canvas ──────────────────────────────────────────
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const stroke of allStrokesRef.current) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.strokeStyle = stroke.tool === 'eraser' ? 'rgba(0,0,0,1)' : stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
  }, []);

  // ── Fetch strokes from server (students poll, instructor also syncs) ─────────
  const fetchStrokes = useCallback(async () => {
    try {
      const res = await fetch(`/api/session/${sessionId}/whiteboard?since=${version}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.hasUpdate || data.version !== version) {
        allStrokesRef.current = data.strokes;
        setVersion(data.version);
        redraw();
      }
    } catch {}
  }, [sessionId, version, redraw]);

  // Students poll every 1s; instructor polls every 2s (they push immediately)
  useEffect(() => {
    fetchStrokes();
    const interval = setInterval(fetchStrokes, isInstructor ? 2000 : 1000);
    return () => clearInterval(interval);
  }, [fetchStrokes, isInstructor]);

  // ── Canvas resize ────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      canvas.width = rect.width;
      canvas.height = rect.height;
      redraw();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [redraw]);

  // ── Pointer helpers ──────────────────────────────────────────────────────────
  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const pushStroke = async (stroke: Stroke) => {
    try {
      await fetch(`/api/session/${sessionId}/whiteboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stroke }),
      });
    } catch {}
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isInstructor) return;
    setIsDrawing(true);
    const pos = getPos(e);
    const stroke: Stroke = {
      id: `stroke-${Date.now()}-${Math.random()}`,
      points: [pos],
      color,
      width: tool === 'eraser' ? width * 4 : width,
      tool,
    };
    currentStrokeRef.current = stroke;
    allStrokesRef.current = [...allStrokesRef.current, stroke];
    redraw();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStrokeRef.current || !isInstructor) return;
    const pos = getPos(e);
    currentStrokeRef.current.points.push(pos);
    // Update in allStrokes
    const idx = allStrokesRef.current.findIndex(s => s.id === currentStrokeRef.current!.id);
    if (idx >= 0) allStrokesRef.current[idx] = { ...currentStrokeRef.current };
    redraw();
    // Push live update every ~5 points for smooth streaming
    if (currentStrokeRef.current.points.length % 5 === 0) {
      pushStroke(currentStrokeRef.current);
    }
  };

  const handlePointerUp = () => {
    if (!isDrawing || !currentStrokeRef.current || !isInstructor) return;
    setIsDrawing(false);
    pushStroke(currentStrokeRef.current); // final push
    currentStrokeRef.current = null;
  };

  const handleClear = async () => {
    allStrokesRef.current = [];
    redraw();
    await fetch(`/api/session/${sessionId}/whiteboard`, { method: 'DELETE' });
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-gray-900/95">
      {/* Toolbar */}
      {isInstructor && (
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 border-b border-gray-700 flex-shrink-0">
          {/* Tool */}
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={tool === 'pen' ? 'default' : 'ghost'}
              className={`h-8 w-8 p-0 ${tool === 'pen' ? 'bg-orange-500 hover:bg-orange-600' : 'text-white hover:bg-gray-700'}`}
              onClick={() => setTool('pen')}
              title="Pen"
            >
              <Pen className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={tool === 'eraser' ? 'default' : 'ghost'}
              className={`h-8 w-8 p-0 ${tool === 'eraser' ? 'bg-orange-500 hover:bg-orange-600' : 'text-white hover:bg-gray-700'}`}
              onClick={() => setTool('eraser')}
              title="Eraser"
            >
              <Eraser className="h-4 w-4" />
            </Button>
          </div>

          <div className="w-px h-6 bg-gray-600" />

          {/* Colors */}
          <div className="flex gap-1">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => { setColor(c); setTool('pen'); }}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c && tool === 'pen' ? 'border-white scale-125' : 'border-gray-600 hover:scale-110'}`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>

          <div className="w-px h-6 bg-gray-600" />

          {/* Stroke width */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setWidth(w => Math.max(1, w - 1))}
              className="text-white hover:text-gray-300 p-1"
            >
              <Minus className="h-3 w-3" />
            </button>
            <div
              className="rounded-full bg-white"
              style={{ width: Math.min(width * 3, 20), height: Math.min(width * 3, 20) }}
            />
            <button
              onClick={() => setWidth(w => Math.min(20, w + 1))}
              className="text-white hover:text-gray-300 p-1"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          <div className="w-px h-6 bg-gray-600" />

          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1 text-red-400 hover:text-red-300 hover:bg-gray-700"
            onClick={handleClear}
            title="Clear whiteboard"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </Button>

          <div className="ml-auto">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 gap-1 text-white hover:bg-gray-700"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Student close button */}
      {!isInstructor && (
        <div className="absolute top-3 right-3 z-50">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1 text-white bg-gray-800/80 hover:bg-gray-700"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            Close
          </Button>
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full ${isInstructor ? (tool === 'eraser' ? 'cursor-cell' : 'cursor-crosshair') : 'cursor-default'}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
        {!isInstructor && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-800/80 text-white text-xs px-3 py-1 rounded-full">
            Instructor is presenting
          </div>
        )}
      </div>
    </div>
  );
}
