"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface CopyExamIdButtonProps {
  examId: string;
}

export function CopyExamIdButton({ examId }: CopyExamIdButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(examId);
      setCopied(true);
      toast.success("Exam ID copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy exam ID");
    }
  };

  return (
    <Button variant="outline" size="sm" className="gap-1" onClick={handleCopy}>
      {copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
      {copied ? "Copied!" : "Copy ID"}
    </Button>
  );
}
