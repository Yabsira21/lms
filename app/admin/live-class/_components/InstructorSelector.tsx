"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Search, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { searchInstructors } from "../create/action";
// import { searchInstructors } from "./action"; // adjust path as needed

interface Instructor {
  id: string;
  name: string;
  email?: string;
}

interface InstructorSelectorProps {
  selectedInstructor?: Instructor;
  onSelect: (instructor: Instructor) => void;
}

export const InstructorSelector = ({
  selectedInstructor,
  onSelect,
}: InstructorSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchInstructors(query);
        setResults(data);
      } catch (error) {
        console.error("Search failed:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  // Clear search when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Trigger */}
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between text-muted-foreground"
        >
          {selectedInstructor
            ? selectedInstructor.name
            : "Search instructors..."}
        </Button>
      </DialogTrigger>

      {/* Centered Modal */}
      <DialogContent className="max-w-md p-0 rounded-xl overflow-hidden bg-neutral-900 [&>button]:hidden">
        <div className="p-2">
          {/* Search Input */}
          <div className="flex items-center rounded-md border-white/15 border mx-2 my-1.5 px-3 py-0 bg-popover">
            <Search className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
            <Input
              placeholder="Search instructors..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent! border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-8"
              autoFocus
            />
            {loading && (
              <Loader2 className="w-4 h-4 ml-2 text-muted-foreground animate-spin shrink-0" />
            )}
          </div>

          {/* Results */}
          <div className="max-h-64 overflow-y-auto py-2">
            <div className="px-3 mb-2 text-xs text-muted-foreground">
              Instructors {results.length > 0 && `(${results.length})`}
            </div>

            {results.length > 0 ? (
              results.map((ins) => (
                <div
                  key={ins.id}
                  onClick={() => {
                    onSelect(ins);
                    // field.onChange(ins.id);
                    console.log("Selected instructor:", ins);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between px-3 py-2 cursor-pointer rounded-md mx-2 hover:bg-accent hover:text-accent-foreground transition"
                >
                  <div className="flex flex-col">
                    <span className="text-sm">{ins.name}</span>
                    {ins.email && (
                      <span className="text-xs text-muted-foreground">
                        {ins.email}
                      </span>
                    )}
                  </div>

                  {selectedInstructor?.id === ins.id && (
                    <Check className="w-4 h-4 opacity-80 shrink-0" />
                  )}
                </div>
              ))
            ) : (
              <div className="px-3 py-8 text-sm text-muted-foreground text-center">
                {query.length < 2
                  ? "Type at least 2 characters to search"
                  : loading
                    ? "Searching..."
                    : "No instructors found"}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-3 py-2 text-xs text-muted-foreground flex justify-between">
            <span>↵ Select</span>
            <span>Esc to close</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
