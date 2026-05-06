import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle(): JSX.Element {
  const [dark, setDark] = useState<boolean>(() =>
    typeof window !== "undefined" && document.documentElement.classList.contains("dark"),
  );
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return (
    <Button variant="outline" size="sm" onClick={() => setDark(d => !d)}>
      {dark ? "Light" : "Dark"}
    </Button>
  );
}
