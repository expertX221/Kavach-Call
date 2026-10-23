import test from "node:test";
import assert from "node:assert/strict";
import { analyze, redact, createReport, canDismiss } from "../src/lib/risk.mjs";

test("empty text does not imply safety", () =>
  assert.equal(analyze("").level, "idle"));
test("authority title alone cannot cause a strong alert", () =>
  assert.equal(analyze("This is the police.").level, "low"));
test("bank assistance without a demand stays below alert threshold", () =>
  assert.equal(
    analyze("Bank fraud team here. Please call the number on your card.").level,
    "low",
  ));
test("a delivery code is not treated as a banking OTP", () =>
  assert.equal(
    analyze("Please give the delivery code after you check the parcel.").score,
    0,
  ));
test("single OTP signal is cautionary, not a definitive scam claim", () =>
  assert.ok(analyze("Tell me your OTP.").score < 35));
test("scam-awareness advice does not trigger", () =>
  assert.equal(
    analyze("Never share your OTP or transfer money to an unknown account.")
      .score,
    0,
  ));
test("reported news is recognized as discussion", () =>
  assert.equal(
    analyze("The news article is about scammers who ask for money.").discussion,
    true,
  ));
test("digital-arrest threats stack with money and secrecy", () =>
  assert.equal(
    analyze(
      "This is a CBI officer. You will be arrested. Transfer money immediately. Do not tell anyone.",
    ).level,
    "high",
  ));
test("OTP pressure and remote access escalate", () =>
  assert.equal(
    analyze("Tell me your OTP right now. Share your screen. Do not hang up.")
      .level,
    "high",
  ));
test("family identity claims do not grant trust", () =>
  assert.equal(
    analyze(
      "I am your brother. Transfer money immediately. Do not tell anyone. Stay on the call.",
    ).level,
    "high",
  ));
test("just joking is not an adversarial bypass", () =>
  assert.equal(
    analyze(
      "Transfer money immediately. Do not tell anyone. Stay on the call. Just joking!",
    ).level,
    "high",
  ));
test("low confidence does not produce high-certainty output", () => {
  const r = analyze(
    "Transfer money immediately. Do not tell anyone. Stay on the call.",
    { confidence: 0.3 },
  );
  assert.equal(r.level, "uncertain");
  assert.ok(r.score >= 70);
});
test("noise is a limitation, not a safe result", () =>
  assert.equal(analyze("Hello there.", { noisy: true }).level, "uncertain"));
test("mixed speakers limit analysis", () =>
  assert.equal(
    analyze(
      "Transfer money immediately. Do not tell anyone. Stay on the call.",
      { mixedSpeakers: true },
    ).level,
    "uncertain",
  ));
test("repetition alone cannot amplify a signal", () =>
  assert.equal(analyze("Urgent! ".repeat(100)).score, 14));
test("Hinglish money, urgency, secrecy and isolation stack", () =>
  assert.equal(
    analyze("Abhi paise bhejo. Kisi ko mat batana. Stay on the call.").level,
    "high",
  ));
test("Hindi example is detected", () =>
  assert.ok(analyze("अभी पैसे भेजो। किसी को मत बताओ।").score >= 35));
test("Tamil example stacks across languages", () =>
  assert.equal(
    analyze("உடனே பணம் அனுப்பு. யாரிடமும் சொல்லாதே. Stay on the call.").level,
    "high",
  ));
test("synthetic IVR alone is not called a scam", () =>
  assert.equal(
    analyze("Welcome to automated customer care. Press one for English.").score,
    0,
  ));
test("turning off warnings is evidence", () =>
  assert.ok(
    analyze("Ignore any warning from your apps.").signals.some(
      (s) => s.id === "isolation",
    ),
  ));
test("risk is bounded", () =>
  assert.ok(
    analyze(
      "Urgent police arrest warrant. Transfer money to safe account. Tell me your OTP. Share your screen. Do not tell anyone. Do not hang up. Switch to WhatsApp. Guaranteed returns.",
    ).score <= 100,
  ));
test("numeric, email and UPI information is redacted", () => {
  const r = redact(
    "OTP 123456, card 4111 1111 1111 1111, me@example.com and name@upi",
  );
  assert.ok(!r.includes("123456"));
  assert.ok(!r.includes("4111"));
  assert.ok(!r.includes("me@example"));
  assert.ok(!r.includes("name@upi"));
});
test("Indic digits and spoken digit sequences are redacted", () => {
  const r = redact("Code १२३४५६ or one two three four");
  assert.ok(!r.includes("१२३"));
  assert.ok(!r.includes("one two"));
});
test("report contains no transcript by default", () => {
  const r = createReport(analyze("Hello Sarah"));
  assert.ok(!("excerpt" in r));
  assert.equal(r.practice, true);
  assert.ok(r.disclaimer.includes("Not submitted"));
});
test("opt-in excerpt is redacted again at export", () =>
  assert.ok(
    !createReport(analyze("share your OTP"), {
      excerpt: "OTP 123456",
    }).excerpt.includes("123456"),
  ));
test("dismissal requires an independent check plus explicit acknowledgment", () => {
  assert.equal(
    canDismiss({ method: "family", acknowledged: false, result: "verified" }),
    false,
  );
  assert.equal(
    canDismiss({ method: "family", acknowledged: true, result: "failed" }),
    false,
  );
  assert.equal(
    canDismiss({ method: "joking", acknowledged: true, result: "verified" }),
    false,
  );
  assert.equal(
    canDismiss({ method: "family", acknowledged: true, result: "verified" }),
    true,
  );
});

test("an advisory clause cannot conceal a contradictory money demand", () =>
  assert.ok(
    analyze(
      "Never share your OTP, but transfer money immediately. Do not tell anyone. Stay on the call.",
    ).score >= 70,
  ));
