'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { FileText, Link2, Trash2, Plus, ExternalLink } from 'lucide-react';

interface Resource { id: string; title: string; fileUrl: string; }

interface Props {
  open: boolean;
  onClose: () => void;
  sessionId: string;
}

export default function ShareMaterialsDialog({ open, onClose, sessionId }: Props) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [title, setTitle] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchResources = async () => {
    const res = await fetch(`/api/session/${sessionId}/materials`);
    if (res.ok) {
      const data = await res.json();
      setResources(data.resources);
    }
  };

  useEffect(() => {
    if (open) fetchResources();
  }, [open]);

  const handleShare = async () => {
    if (!title.trim() || !fileUrl.trim()) {
      toast.error('Title and URL are required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/session/${sessionId}/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), fileUrl: fileUrl.trim() }),
      });
      if (!res.ok) throw new Error();
      toast.success('Material shared with students!');
      setTitle('');
      setFileUrl('');
      fetchResources();
    } catch {
      toast.error('Failed to share material');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/session/${sessionId}/materials?resourceId=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setResources(prev => prev.filter(r => r.id !== id));
      toast.success('Material removed');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Share Materials
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new material */}
          <div className="space-y-3 p-4 bg-muted/40 rounded-lg border border-border">
            <h4 className="text-sm font-medium">Add New Material</h4>
            <div className="space-y-2">
              <div>
                <Label className="text-xs">Title</Label>
                <Input
                  placeholder="e.g. Lecture Slides Week 6"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">URL or Link</Label>
                <Input
                  placeholder="https://..."
                  value={fileUrl}
                  onChange={e => setFileUrl(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
            <Button
              size="sm"
              className="w-full gap-2 bg-orange-500 hover:bg-orange-600"
              onClick={handleShare}
              disabled={loading}
            >
              <Plus className="h-4 w-4" />
              Share with Students
            </Button>
          </div>

          {/* Shared materials list */}
          {resources.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Shared ({resources.length})</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {resources.map(r => (
                  <div key={r.id} className="flex items-center gap-2 p-2 bg-card border border-border rounded-lg">
                    <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.fileUrl}</p>
                    </div>
                    <a href={r.fileUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </a>
                    <button onClick={() => handleDelete(r.id)}>
                      <Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resources.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              No materials shared yet. Add one above.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
