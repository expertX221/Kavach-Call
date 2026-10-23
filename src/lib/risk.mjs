/** Explainable demonstration rules. Scores are heuristic, never calibrated probabilities. */
export const RULE_VERSION = "2026.10.23-1";
const RULES = [
  {
    id: "urgency",
    weight: 14,
    title: "Pressure to act immediately",
    detail: "The caller is creating a deadline or demanding immediate action.",
    pattern:
      /\b(urgent|immediately|right now|money now|act now|within \d+ minutes|jaldi|abhi)\b|तुरंत|अभी|உடனே|உடனடியாக/i,
  },
  {
    id: "money",
    weight: 24,
    title: "Request for a money transfer",
    detail: "Pause any payment until you independently verify the request.",
    pattern:
      /\b(send|transfer|pay|deposit|move)\b.{0,45}\b(money|funds|account|fee|rupees|deposit|payment)\b|safe account|paise (bhejo|transfer)|पैसे.{0,15}(भेज|ट्रांसफर)|பணம்.{0,20}(அனுப்பு|செலுத்)/i,
  },
  {
    id: "secrecy",
    weight: 22,
    title: "Caller asks for secrecy",
    detail:
      "The caller asks you to keep the conversation from people you trust.",
    pattern:
      /don['’]?t tell|do not tell|keep (this|it).{0,15}(secret|confidential)|don['’]?t discuss|do not discuss|kisi ko mat|किसी को मत|யாரிடமும்.{0,15}(சொல்லா|சொல்ல வேண்டாம்)/i,
  },
  {
    id: "authority",
    weight: 8,
    title: "Claim of official authority",
    detail:
      "A claimed title is weak evidence. Verify using an independent official channel.",
    pattern:
      /\b(cbi|police|customs|rbi|bank fraud team|cybercrime officer)\b|पुलिस|காவல்/i,
  },
  {
    id: "threat",
    weight: 26,
    title: "Threat of arrest or account closure",
    detail: "Threats can be used to make you comply before checking the facts.",
    pattern:
      /you.{0,25}(arrest|detain)|arrest warrant|digital arrest|account.{0,25}(blocked|suspended|frozen)|kyc.{0,15}expired|तुम्हें.{0,15}गिरफ्तार|கைது செய்வோம்/i,
  },
  {
    id: "secret",
    weight: 30,
    title: "Request for a sensitive code",
    detail:
      "Do not reveal banking OTPs, passwords or UPI PINs. A delivery code requires separate context.",
    pattern:
      /\b(share|tell|give|read|send)\b.{0,35}\b(otp|one.time password|pin|password|verification code)\b|otp.{0,15}(batao|bhejo)|ओटीपी.{0,15}(बताओ|भेजो)/i,
  },
  {
    id: "remote",
    weight: 28,
    title: "Screen sharing or remote access",
    detail:
      "Do not share your screen or install remote-control software at a caller’s request.",
    pattern:
      /share your screen|screen shar|install.{0,20}(anydesk|teamviewer|remote)|download.{0,20}(apk|remote)/i,
  },
  {
    id: "isolation",
    weight: 22,
    title: "Pressure to stay connected",
    detail:
      "You are being discouraged from hanging up or checking with someone else.",
    pattern:
      /don['’]?t hang up|do not hang up|stay on.{0,15}(call|line|video)|ignore.{0,20}(warning|alert)|turn off.{0,25}(app|protection)|disable.{0,15}(app|warning)/i,
  },
  {
    id: "move",
    weight: 12,
    title: "Request to move to another app",
    detail:
      "Changing platforms can make a pressured conversation harder to interrupt.",
    pattern:
      /\b(move|switch|join|come)\b.{0,30}\b(whatsapp|telegram|video call|skype)\b/i,
  },
  {
    id: "reward",
    weight: 20,
    title: "Guaranteed returns or advance fee",
    detail:
      "Verify the business and offer independently before making any payment.",
    pattern:
      /guaranteed.{0,20}(return|profit)|double your money|pay.{0,25}(registration|processing|job).{0,10}fee|refund.{0,35}upi pin/i,
  },
];
const advisory =
  /\b(never|do not|don['’]?t)\s+(?:ever\s+)?(?:share|give|send|transfer|install|pay|tell (?:them|anyone) your)\b/i;
const educational =
  /\b(news|podcast|awareness|article|training|story about|example of|scammers (say|ask)|scammer (said|asked)|warning about)\b/i;

export function analyze(
  input,
  { confidence = 1, mixedSpeakers = false, noisy = false } = {},
) {
  const text = String(input || "")
    .slice(-12000)
    .normalize("NFKC");
  const sentences = text
    .split(/(?<=[.!?।])\s+|\n+|;\s*|\b(?:but|instead|however)\b/i)
    .filter(Boolean);
  const discussion =
    sentences.length > 0 &&
    sentences.every((s) => educational.test(s) || advisory.test(s));
  const active = sentences.filter(
    (s) => !advisory.test(s) && !educational.test(s),
  );
  const signals = RULES.flatMap((rule) => {
    const excerpt = active.find((s) => rule.pattern.test(s));
    return excerpt
      ? [
          {
            ...rule,
            pattern: undefined,
            excerpt: redact(excerpt).slice(0, 240),
          },
        ]
      : [];
  });
  // A single vocabulary category cannot produce a high-risk verdict.
  const sum = signals.reduce((n, s) => n + s.weight, 0);
  const score = Math.min(signals.length < 2 ? 34 : 100, sum);
  const limited =
    !Number.isFinite(confidence) || confidence < 0.6 || noisy || mixedSpeakers;
  const level = !text.trim()
    ? "idle"
    : limited
      ? "uncertain"
      : score >= 70 && signals.length >= 3
        ? "high"
        : score >= 35
          ? "elevated"
          : "low";
  let category = "Unclassified";
  const ids = new Set(signals.map((s) => s.id));
  if (ids.has("threat") && ids.has("authority"))
    category = "Possible authority impersonation";
  else if (ids.has("secret")) category = "Possible credential theft";
  else if (ids.has("reward"))
    category = "Possible advance-fee or investment scam";
  else if (ids.has("remote")) category = "Possible remote-access scam";
  else if (ids.has("money")) category = "Unverified payment request";
  return {
    score,
    level,
    signals,
    category,
    discussion,
    confidence: limited ? "Limited" : "Rule-based",
    limited,
    advice:
      level === "high"
        ? "Pause payments. End the call yourself and verify using a number you already trust."
        : limited
          ? "Analysis is limited. Do not assume this call is safe; verify independently."
          : "A score cannot establish identity. Verify unusual requests independently.",
  };
}

/** Conservative export redaction; names and contextual identifiers still require human review. */
export function redact(text) {
  return String(text || "")
    .normalize("NFKC")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email removed]")
    .replace(/\b[a-z0-9._-]+@[a-z][a-z0-9.-]*\b/gi, "[UPI removed]")
    .replace(
      /(?:\+?[\p{N}][\p{N}\s().-]{2,}[\p{N}])|\p{N}+/gu,
      "[digits removed]",
    )
    .replace(
      /\b(?:zero|one|two|three|four|five|six|seven|eight|nine)(?:[\s,-]+(?:zero|one|two|three|four|five|six|seven|eight|nine)){2,}\b/gi,
      "[spoken digits removed]",
    );
}

export function createReport(
  result,
  { practice = true, disposition = "Unverified", excerpt = "" } = {},
) {
  return {
    id: globalThis.crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    practice,
    disposition,
    ruleVersion: RULE_VERSION,
    riskScore: result.score,
    riskLevel: result.level,
    category: result.category,
    signals: result.signals.map((s) => s.title),
    ...(excerpt ? { excerpt: redact(excerpt).slice(0, 1500) } : {}),
    disclaimer:
      "User-prepared draft, not a finding of fraud. Not submitted to authorities. No caller reputation claim.",
  };
}

export function canDismiss({ method, acknowledged, result }) {
  return (
    ["family", "callback", "organization"].includes(method) &&
    acknowledged === true &&
    result === "verified"
  );
}
