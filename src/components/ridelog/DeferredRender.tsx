import { useState, useEffect, type ReactNode } from "react";

interface DeferredRenderProps {
  children: ReactNode;
  fallback: ReactNode;
  delay?: number;
}

export function DeferredRender({ children, fallback, delay = 150 }: DeferredRenderProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setReady(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!ready) {
    return <>{fallback}</>;
  }

  return <div className="fade-in-content">{children}</div>;
}
