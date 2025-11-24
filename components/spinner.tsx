import { Loader2 } from "lucide-react";

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <Loader2
      className={`animate-spin opacity-100 ${className}`}
      aria-hidden="true"
    />
  );
}
