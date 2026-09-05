/**
 * LoadingState — spinner for loading content.
 * Full-page and inline variants.
 */

import { cn } from "@/utils/cn";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  /** "full" centers vertically in the viewport, "inline" is for within containers */
  variant?: "full" | "inline";
  message?: string;
  className?: string;
}

export default function LoadingState({
  variant = "inline",
  message = "Loading...",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        variant === "full" && "min-h-screen",
        variant === "inline" && "py-16",
        className
      )}
    >
      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      {message && (
        <p className="text-sm text-neutral-500">{message}</p>
      )}
    </div>
  );
}
