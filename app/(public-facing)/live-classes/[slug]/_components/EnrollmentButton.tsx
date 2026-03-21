"use client";

import { Button } from "@/components/ui/button";
import { tryCatch } from "@/hooks/try-catch";
import { useTransition } from "react";
// import { enrollInLiveClassAction } from "../action";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { enrollInLiveClassAction } from "../action";

export function EnrollmentButton({ liveClassId }: { liveClassId: string }) {
  const [isPending, startTransition] = useTransition();

  function onSubmit() {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        enrollInLiveClassAction(liveClassId),
      );

      if (error) {
        toast.error("Failed to enroll in live class");
        return;
      }

      if (result.status === "success") {
        toast.success(result.message);
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  }

  return (
    <Button
      onClick={onSubmit}
      disabled={isPending}
      className="w-full cursor-pointer"
    >
      {isPending ? (
        <>
          <Loader2 className="size-4 animate-spin mr-2" />
          Processing...
        </>
      ) : (
        "Enroll Now!"
      )}
    </Button>
  );
}
