import { useEffect } from "react";
import { useSessionStore } from "../store/sessionStore";

export function useGameTimer(): void {
  const timerStatus = useSessionStore((state) => state.timerStatus);
  const tick = useSessionStore((state) => state.tick);

  useEffect(() => {
    if (timerStatus !== "running") return;
    const timer = window.setInterval(() => tick(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, [tick, timerStatus]);
}
