"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AnimationVariant = "circle" | "circle-blur" | "polygon";

export interface ThemeToggleButtonProps {
  theme?: "light" | "dark";
  showLabel?: boolean;
  variant?: AnimationVariant;
  className?: string;
  onClick?: () => void;
}

export const useThemeTransition = () => {
  const startTransition = useCallback((updateFn: () => void) => {
    if ("startViewTransition" in document) {
      (document as any).startViewTransition(updateFn);
    } else {
      updateFn();
    }
  }, []);

  return { startTransition };
};

export const ThemeToggleButton = ({
  theme = "light",
  showLabel = false,
  variant = "circle",
  className,
  onClick,
}: ThemeToggleButtonProps) => {
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;

    // get button position
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const styleId = `theme-transition-${Date.now()}`;
    const style = document.createElement("style");
    style.id = styleId;

    let css = "";

    if (variant === "circle") {
      css = `
        @supports (view-transition-name: root) {
          ::view-transition-old(root) { animation: none; }
          ::view-transition-new(root) {
            animation: circle-expand 1.0s ease-out;
          }
          @keyframes circle-expand {
            from {
              clip-path: circle(0px at ${cx}px ${cy}px);
            }
            to {
              clip-path: circle(200vmax at ${cx}px ${cy}px);
            }
          }
        }
      `;
    }

    if (variant === "circle-blur") {
      css = `
        @supports (view-transition-name: root) {
          ::view-transition-old(root) { animation: none; }
          ::view-transition-new(root) {
            animation: circle-blur-expand 0.55s ease-out;
          }
          @keyframes circle-blur-expand {
            from {
              clip-path: circle(0px at ${cx}px ${cy}px);
              filter: blur(6px);
            }
            to {
              clip-path: circle(200vmax at ${cx}px ${cy}px);
              filter: blur(0);
            }
          }
        }
      `;
    }

    if (variant === "polygon") {
      css = `
        @supports (view-transition-name: root) {
          ::view-transition-old(root) { animation: none; }
          ::view-transition-new(root) {
            animation: wipe 0.45s ease-out;
          }
          @keyframes wipe {
            from {
              clip-path: polygon(
                ${cx}px ${cy}px,
                ${cx}px ${cy}px,
                ${cx}px ${cy}px,
                ${cx}px ${cy}px
              );
            }
            to {
              clip-path: polygon(
                0 0,
                100% 0,
                100% 100%,
                0 100%
              );
            }
          }
        }
      `;
    }

    style.textContent = css;
    document.head.appendChild(style);

    // cleanup
    setTimeout(() => {
      document.getElementById(styleId)?.remove();
    }, 3000);

    onClick?.();
  }, [onClick, variant, theme]);

  return (
    <Button
      ref={btnRef}
      variant="outline"
      size={showLabel ? "default" : "icon"}
      onClick={handleClick}
      className={cn(
        "relative overflow-hidden transition-all",
        showLabel && "gap-2",
        className
      )}
    >
      {theme === "light" ? (
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      )}

      {showLabel && (
        <span className="text-sm">{theme === "light" ? "Light" : "Dark"}</span>
      )}
    </Button>
  );
};
