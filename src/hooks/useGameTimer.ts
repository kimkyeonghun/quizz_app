import { useEffect } from "react";
import { useSessionStore } from "../store/sessionStore";

export function useGameTimer(): void {
  const roundTimerStatus = useSessionStore((state) => state.roundTimerStatus);
  const phaseTimerStatus = useSessionStore((state) => state.phaseTimerStatus);
  const tick = useSessionStore((state) => state.tick);

  useEffect(() => {
    if (roundTimerStatus !== "running" && phaseTimerStatus !== "running") return;
    const timer = window.setInterval(() => tick(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, [tick, roundTimerStatus, phaseTimerStatus]);
}
