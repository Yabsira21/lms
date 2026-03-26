'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { BarChart3, Plus, Trash2, X } from 'lucide-react';

interface PollData {
  id: string;
  question: string;
  options: string[];
  counts: Record<string, number>;
  totalVotes: number;
  active: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  sessionId: string;
}

export default function LaunchPollDialog({ open, onClose, sessionId }: Props) {
  const [activePoll, setActivePoll] = useState<PollData | null>(null);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [loading, setLoading] = useState(false);

  const fetchPoll = async () => {
    const res = await fetch(`/api/session/${sessionId}/poll`);
    if (res.ok) {
      const data = await res.json();
      setActivePoll(data.poll);
    }
  };

  useEffect(() => {
    if (open) fetchPoll();
    if (!open) return;
    const interval = setInterval(fetchPoll, 3000); // refresh votes every 3s
    return () => clearInterval(interval);
  }, [open]);

  const handleLaunch = async () => {
    const validOptions = options.filter(o => o.trim());
    if (!question.trim() || validOptions.length < 2) {
      toast.error('Question and at least 2 options required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/session/${sessionId}/poll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), options: validOptions }),
      });
      if (!res.ok) throw new Error();
      toast.success('Poll launched! Students can now vote.');
      setQuestion('');
      setOptions(['', '']);
      fetchPoll();
    } catch {
      toast.error('Failed to launch poll');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    await fetch(`/api/session/${sessionId}/poll`, { method: 'DELETE' });
    setActivePoll(null);
    toast.info('Poll closed');
  };

  const maxVotes = activePoll ? Math.max(...Object.values(activePoll.counts), 1) : 1;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {activePoll ? 'Live Poll Results' : 'Launch Poll'}
          </DialogTitle>
        </DialogHeader>

        {activePoll ? (
          // Active poll — show live results
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="font-medium text-sm">{activePoll.question}</p>
              <p className="text-xs text-gray-500 mt-1">{activePoll.totalVotes} vote{activePoll.totalVotes !== 1 ? 's' : ''}</p>
            </div>

            <div className="space-y-2">
              {activePoll.options.map(option => {
                const count = activePoll.counts[option] ?? 0;
                const pct = activePoll.totalVotes > 0 ? Math.round((count / activePoll.totalVotes) * 100) : 0;
                const isLeading = count === maxVotes && count > 0;
                return (
                  <div key={option} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className={isLeading ? 'font-semibold' : ''}>{option}</span>
                      <span className="text-gray-500">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isLeading ? 'bg-orange-500' : 'bg-blue-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              variant="destructive"
              size="sm"
              className="w-full gap-2"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
              Close Poll
            </Button>
          </div>
        ) : (
          // Create new poll
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Question</Label>
              <Input
                placeholder="e.g. Which topic should we cover next?"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Options</Label>
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={e => {
                      const next = [...options];
                      next[i] = e.target.value;
                      setOptions(next);
                    }}
                    className="h-9 text-sm"
                  />
                  {options.length > 2 && (
                    <button onClick={() => setOptions(options.filter((_, j) => j !== i))}>
                      <Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" />
                    </button>
                  )}
                </div>
              ))}
              {options.length < 6 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 w-full"
                  onClick={() => setOptions([...options, ''])}
                >
                  <Plus className="h-4 w-4" />
                  Add Option
                </Button>
              )}
            </div>

            <Button
              size="sm"
              className="w-full gap-2 bg-orange-500 hover:bg-orange-600"
              onClick={handleLaunch}
              disabled={loading}
            >
              <BarChart3 className="h-4 w-4" />
              Launch Poll
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
