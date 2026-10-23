import { useEffect, useState } from "react";
export function useIntelligence(enabled) {
  const [state, setState] = useState({
    status: "idle",
    reputation: [],
    campaigns: [],
  });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setState((s) => ({ ...s, status: "loading" }));
    fetch("/api/intelligence", { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw Error("Unavailable");
        const data = await r.json();
        if (
          data.status !== "connected" ||
          !Array.isArray(data.reputation) ||
          !Array.isArray(data.campaigns)
        )
          throw Error("Invalid response");
        setState(data);
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          setState({ status: "unavailable", reputation: [], campaigns: [] });
      });
    return () => controller.abort();
  }, [enabled, version]);
  return { ...state, refresh: () => setVersion((v) => v + 1) };
}
