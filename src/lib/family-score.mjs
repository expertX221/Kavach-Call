export function protectionScore(contacts = [], progress = [], plan = {}) {
  const checks = [
    {
      id: "contact",
      title: "Trusted contact saved",
      detail: "Keep a number you already trust.",
      done: contacts.some((c) => c.phone && c.name),
    },
    {
      id: "question",
      title: "Family question agreed",
      detail: "Agree on a private memory; keep the answer outside the app.",
      done: contacts.some((c) => c.question?.trim().length >= 8),
    },
    {
      id: "practice",
      title: "A practice lesson completed",
      detail: "Finish a scenario and review the suggested next step.",
      done: progress.some((p) => p.scenarioId && p.completedAt),
    },
    {
      id: "callback",
      title: "Callback plan agreed",
      detail: "Agree to hang up and call a saved number for unusual requests.",
      done: plan.callbackPlan === true,
    },
  ];
  return { score: checks.filter((c) => c.done).length * 25, checks };
}
export function istWeek(now = new Date()) {
  const day = new Date(new Date(now).getTime() + 330 * 60000);
  const midnight = Date.UTC(
    day.getUTCFullYear(),
    day.getUTCMonth(),
    day.getUTCDate(),
  );
  const weekday = new Date(midnight).getUTCDay();
  const start = midnight - ((weekday + 6) % 7) * 86400000 - 330 * 60000;
  return {
    start: new Date(start).toISOString(),
    end: new Date(start + 7 * 86400000).toISOString(),
  };
}
export function localDigest(reports = [], now = new Date()) {
  const week = istWeek(now),
    time = +new Date(now);
  const real = reports.filter(
    (r) =>
      r.practice === false &&
      Number.isFinite(+new Date(r.createdAt)) &&
      +new Date(r.createdAt) >= +new Date(week.start) &&
      +new Date(r.createdAt) < +new Date(week.end) &&
      +new Date(r.createdAt) <= time,
  );
  const categories = Object.entries(
    real.reduce((o, r) => {
      const k = r.category || "Unclassified";
      o[k] = (o[k] || 0) + 1;
      return o;
    }, {}),
  ).map(([category, count]) => ({ category, count }));
  return {
    ...week,
    total: real.length,
    categories,
    scope: "This device only; user-created drafts, not confirmed fraud",
  };
}
