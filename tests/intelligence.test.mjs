import test from "node:test";
import assert from "node:assert/strict";
import { checkLink } from "../src/lib/link-check.mjs";
import {
  protectionScore,
  istWeek,
  localDigest,
} from "../src/lib/family-score.mjs";
import { registrationTarget, lookupRegistration } from "../server/domain.mjs";
test("unknown links remain unverified even with no database match", () => {
  const r = checkLink("https://example.com", { databaseStatus: "connected" });
  assert.equal(r.verdict, "unverified");
  assert.equal(r.reputation, "no-match");
});
test("userinfo does not hide actual hostname", () => {
  const r = checkLink("https://google.com@evil.test");
  assert.equal(r.host, "evil.test");
  assert.ok(r.signals.some((s) => s.id === "userinfo"));
});
test("brand in subdomain is not trusted", () =>
  assert.ok(
    checkLink("https://sbi.co.in.evil.test").signals.some(
      (s) => s.id === "brand-sbi",
    ),
  ));
test("lookalike spelling flagged", () =>
  assert.ok(
    checkLink("https://goggle.com").signals.some(
      (s) => s.id === "brand-google",
    ),
  ));
test("exact shortener matching avoids innocent suffix match", () => {
  assert.ok(
    checkLink("https://bit.ly/a").signals.some((s) => s.id === "short"),
  );
  assert.ok(
    !checkLink("https://bit.ly.evil.test").signals.some(
      (s) => s.id === "short",
    ),
  );
});
test("executable protocols never accepted", () =>
  assert.equal(checkLink("javascript:alert(1)").kind, "invalid"));
test("raw IP and HTTP are warning signals", () =>
  assert.equal(checkLink("http://127.0.0.1").signals.length, 2));
test("UPI payload shows payee but never verifies identity", () => {
  const r = checkLink("upi://pay?pa=merchant@upi&pn=Shop&am=100");
  assert.equal(r.kind, "upi");
  assert.equal(r.payment.payee, "merchant@upi");
  assert.equal(r.verdict, "verify");
});
test("conflicting UPI fields are flagged", () =>
  assert.ok(
    checkLink("upi://pay?pa=one@upi&pa=two@upi").signals.some(
      (s) => s.id === "duplicate",
    ),
  ));
test("reviewed reputation and matching fresh registration add signals", () => {
  const r = checkLink("https://example.com", {
    reputation: [{ hostname: "example.com", reportCount: 3 }],
    registration: { status: "available", domain: "example.com", ageDays: 3 },
  });
  assert.ok(r.signals.some((s) => s.id === "reported"));
  assert.ok(r.signals.some((s) => s.id === "new"));
});
test("unrelated registration cannot affect result", () =>
  assert.ok(
    !checkLink("https://example.com", {
      registration: { status: "available", domain: "other.com", ageDays: 1 },
    }).signals.some((s) => s.id === "new"),
  ));
test("empty family starts at zero and complete checklist scores 100", () => {
  assert.equal(protectionScore().score, 0);
  assert.equal(
    protectionScore(
      [{ name: "Test", phone: "000", question: "A private memory?" }],
      [{ scenarioId: "family", completedAt: "2026-10-23" }],
      { callbackPlan: true },
    ).score,
    100,
  );
});
test("IST week changes Sunday at 18:30 UTC", () => {
  assert.equal(
    istWeek("2026-10-25T18:29:59Z").start,
    "2026-10-18T18:30:00.000Z",
  );
  assert.equal(
    istWeek("2026-10-25T18:30:00Z").start,
    "2026-10-25T18:30:00.000Z",
  );
});
test("digest excludes practice, future and previous weeks", () => {
  const now = "2026-10-23T12:00:00Z";
  const rows = [
    { practice: false, createdAt: now, category: "Payment" },
    { practice: true, createdAt: now },
    { practice: false, createdAt: "2026-10-26T12:00:00Z" },
    { practice: false, createdAt: "2026-10-18T12:00:00Z" },
  ];
  assert.equal(localDigest(rows, now).total, 1);
});
test("registration rejects private addresses and URLs", () => {
  for (const h of [
    "127.0.0.1",
    "localhost",
    "https://example.com",
    "example.com@evil.com",
  ])
    assert.equal(registrationTarget(h), null);
});
test("invalid registry input causes no network request", async () => {
  let called = false;
  await lookupRegistration("127.0.0.1", () => {
    called = true;
  });
  assert.equal(called, false);
});
