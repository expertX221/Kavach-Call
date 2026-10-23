import { parse } from "tldts";
export function registrationTarget(host) {
  if (
    typeof host !== "string" ||
    host.length > 253 ||
    !host ||
    !/^[a-z0-9.-]+$/i.test(host)
  )
    return null;
  const info = parse(host.toLowerCase(), { allowPrivateDomains: false });
  if (info.isIp || !info.isIcann || !info.domain) return null;
  return { domain: info.domain, tld: info.publicSuffix.split(".").at(-1) };
}
export async function lookupRegistration(
  host,
  fetcher = fetch,
  now = new Date(),
) {
  const target = registrationTarget(host);
  if (!target) return { status: "invalid" };
  try {
    const bootstrap = await fetcher("https://data.iana.org/rdap/dns.json", {
      signal: AbortSignal.timeout(7000),
      redirect: "error",
      headers: { Accept: "application/json" },
    });
    if (!bootstrap.ok) throw Error("bootstrap");
    const data = await bootstrap.json();
    const service = data.services?.find(([suffixes]) =>
      suffixes.includes(target.tld),
    );
    const base = service?.[1]?.find((u) => u.startsWith("https://"));
    if (!base) return { status: "unavailable", domain: target.domain };
    const endpoint = new URL(
      "domain/" + encodeURIComponent(target.domain),
      base.endsWith("/") ? base : base + "/",
    );
    const response = await fetcher(endpoint, {
      signal: AbortSignal.timeout(7000),
      redirect: "error",
      headers: { Accept: "application/rdap+json" },
    });
    if (!response.ok) return { status: "unavailable", domain: target.domain };
    const record = await response.json();
    const dates = (record.events || [])
      .filter((e) => e.eventAction === "registration")
      .map((e) => +new Date(e.eventDate))
      .filter((d) => Number.isFinite(d) && d <= +new Date(now));
    if (!dates.length) return { status: "unavailable", domain: target.domain };
    const created = Math.min(...dates);
    return {
      status: "available",
      domain: target.domain,
      createdAt: new Date(created).toISOString(),
      ageDays: Math.floor((+new Date(now) - created) / 86400000),
      source: "Public RDAP registry via IANA bootstrap",
      checkedAt: new Date(now).toISOString(),
    };
  } catch {
    console.error("Domain registration lookup unavailable");
    return { status: "unavailable", domain: target.domain };
  }
}
