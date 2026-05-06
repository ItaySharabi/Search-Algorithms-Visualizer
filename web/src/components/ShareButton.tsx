import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ShareButton(): JSX.Element {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1200);
        } catch {
          // ignore — older browsers without clipboard API
        }
      }}
    >
      {copied ? "Copied!" : "Share"}
    </Button>
  );
}
