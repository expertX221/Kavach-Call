import { parse, getDomain } from "tldts";

const shorteners = new Set([
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "rb.gy",
  "cutt.ly",
  "is.gd",
  "shorturl.at",
  "rebrand.ly",
  "ow.ly",
]);
const brands = [
  {
    name: "SBI",
    token: "sbi",
    domains: ["sbi.bank.in", "sbi.co.in", "onlinesbi.com", "onlinesbi.sbi"],
  },
  { name: "Google", token: "google", domains: ["google.com"] },
  { name: "Paytm", token: "paytm", domains: ["paytm.com"] },
  { name: "PhonePe", token: "phonepe", domains: ["phonepe.com"] },
  { name: "NPCI", token: "npci", domains: ["npci.org.in"] },
];
function similar(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;
  const rows = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0),
  );
  for (let i = 0; i <= a.length; i++) rows[i][0] = i;
  for (let j = 0; j <= b.length; j++) rows[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
  return rows[a.length][b.length] === 1;
}
export function checkLink(
  raw,
  { reputation = [], databaseStatus = "unavailable", registration = null } = {},
) {
  const input = String(raw || "").trim();
  const invalid = (message) => ({
    kind: "invalid",
    title: "Cannot check this content",
    message,
    signals: [],
    verdict: "unverified",
    score: 0,
  });
  if (!input || input.length > 4096)
    return invalid(
      "Paste a web link or UPI payment QR payload, up to 4,096 characters.",
    );
  if (/[\u0000-\u0020]/.test(input))
    return invalid("Remove spaces or control characters from the link.");
  let url;
  try {
    url = new URL(
      /^[a-z][a-z0-9+.-]*:/i.test(input) ? input : "https://" + input,
    );
  } catch {
    return invalid("The link could not be parsed. Nothing was opened.");
  }
  const signals = [];
  const add = (id, title, detail, weight) =>
    signals.push({ id, title, detail, weight });
  if (url.protocol === "upi:") {
    if (url.hostname.toLowerCase() !== "pay")
      return invalid("Only standard upi://pay payment requests are supported.");
    const pa = url.searchParams.get("pa") || "",
      pn = url.searchParams.get("pn") || "",
      am = url.searchParams.get("am"),
      cu = url.searchParams.get("cu");
    add(
      "payment",
      "This QR requests a payment",
      "A payment QR is not proof of the recipient’s identity. Independently compare the payee in your payment app.",
      20,
    );
    if (!/^[a-z0-9._-]{2,256}@[a-z0-9.-]{2,64}$/i.test(pa))
      add(
        "invalid-payee",
        "Missing or unusual UPI address",
        "Do not proceed until you independently verify the payee.",
        30,
      );
    if (am !== null && (!/^\d{1,9}(\.\d{1,2})?$/.test(am) || Number(am) <= 0))
      add(
        "invalid-amount",
        "Unexpected amount format",
        "Check the exact amount in your payment app.",
        20,
      );
    if (cu && cu !== "INR")
      add(
        "currency",
        "Unexpected currency",
        "Review this request carefully; the expected currency is INR.",
        20,
      );
    if (
      ["pa", "pn", "am", "cu"].some(
        (k) => url.searchParams.getAll(k).length > 1,
      )
    )
      add(
        "duplicate",
        "Conflicting payment fields",
        "The payload repeats important fields. Do not rely on the displayed request.",
        35,
      );
    return {
      kind: "upi",
      title: "Verify the payment recipient",
      verdict: "verify",
      score: Math.min(
        100,
        signals.reduce((n, s) => n + s.weight, 0),
      ),
      signals,
      payment: {
        payee: pa.slice(0, 200),
        name: pn.slice(0, 100),
        amount: am,
        currency: cu || "INR",
      },
      reputation: "not-supported",
      databaseStatus,
      message:
        "UPI payee reputation is not available. This app never initiates a payment. Entering a UPI PIN authorizes sending money, not receiving a refund.",
    };
  }
  if (!["https:", "http:"].includes(url.protocol))
    return invalid(
      "Only HTTP(S) links and UPI payment QR payloads are supported. This content will not be executed.",
    );
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  const info = parse(host, { allowPrivateDomains: true });
  const domain = info.domain || host;
  if (!host || (!host.includes(".") && !info.isIp))
    return invalid("Use a complete public hostname.");
  if (url.username || url.password)
    add(
      "userinfo",
      "Misleading address prefix",
      "Text before @ can impersonate a trusted site. The actual hostname is " +
        host +
        ".",
      35,
    );
  if (url.protocol === "http:")
    add(
      "http",
      "Unencrypted HTTP connection",
      "HTTP does not protect the connection. HTTPS alone still does not prove legitimacy.",
      15,
    );
  if (info.isIp)
    add(
      "ip",
      "Raw IP address",
      "This link uses a numeric address rather than an identifiable domain.",
      20,
    );
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local")
  )
    add(
      "local",
      "Local network address",
      "This checker does not contact local network addresses.",
      20,
    );
  if (host.split(".").some((p) => p.startsWith("xn--")))
    add(
      "unicode",
      "Internationalized domain",
      "Punycode may represent a legitimate language or a lookalike. Compare the exact spelling independently.",
      15,
    );
  if (shorteners.has(host))
    add(
      "short",
      "Shortened destination",
      "The destination is hidden. Kavach does not follow or expand this link.",
      15,
    );
  if ((info.subdomain || "").split(".").filter(Boolean).length >= 3)
    add(
      "subdomains",
      "Many subdomain labels",
      "Read the registrable site name carefully; words on the left do not establish ownership.",
      10,
    );
  for (const brand of brands) {
    const canonical = brand.domains.some(
      (d) => host === d || host.endsWith("." + d),
    );
    const labels = host.split(/[.-]/);
    const mentioned = labels.some(
      (l) => l.includes(brand.token) || similar(l, brand.token),
    );
    if (!canonical && mentioned)
      add(
        "brand-" + brand.token,
        "Possible " + brand.name + " lookalike",
        "This hostname resembles " +
          brand.name +
          " but does not match the reference domains. Open the organization’s official app or independently find its website.",
        25,
      );
  }
  const matched = reputation.filter(
    (r) => r.hostname === host || r.hostname === domain,
  );
  for (const r of matched)
    if (r.reportCount > 0)
      add(
        "reported",
        "Listed in reviewed report data",
        `${r.reportCount} reviewed report${r.reportCount === 1 ? "" : "s"} reference this hostname. Reports are evidence to review, not a legal verdict.`,
        30,
      );
  const registrationDomain = getDomain(host, { allowPrivateDomains: false });
  const validRegistration =
    registration?.status === "available" &&
    registration.domain === registrationDomain;
  if (
    validRegistration &&
    Number.isFinite(registration.ageDays) &&
    registration.ageDays >= 0 &&
    registration.ageDays < 30
  )
    add(
      "new",
      "Recently registered domain",
      `Registry registration is ${registration.ageDays} days old. New sites may be legitimate, but deserve independent verification.`,
      15,
    );
  const score = Math.min(
    100,
    signals.reduce((n, s) => n + s.weight, 0),
  );
  return {
    kind: "url",
    title: signals.length ? "Pause before opening" : "No obvious pattern found",
    verdict: score >= 60 ? "high" : signals.length ? "caution" : "unverified",
    score,
    signals,
    host,
    domain,
    registrationDomain,
    databaseStatus,
    reputation: matched.length
      ? "reported"
      : databaseStatus === "connected"
        ? "no-match"
        : "unavailable",
    registration: validRegistration ? registration : null,
    message:
      "This is a limited check, not a safety certificate. Unknown links remain unverified. The destination was not opened or scanned for malware.",
  };
}
