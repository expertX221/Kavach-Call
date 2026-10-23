import { useEffect, useMemo, useRef, useState } from "react";
import { QrCode } from "@phosphor-icons/react/dist/csr/QrCode";
import { Link } from "@phosphor-icons/react/dist/csr/Link";
import { Warning } from "@phosphor-icons/react/dist/csr/Warning";
import { Camera } from "@phosphor-icons/react/dist/csr/Camera";
import { UploadSimple } from "@phosphor-icons/react/dist/csr/UploadSimple";
import { Stop } from "@phosphor-icons/react/dist/csr/Stop";
import { LockKey } from "@phosphor-icons/react/dist/csr/LockKey";
import { Button, Notice, PageTitle } from "../components.jsx";
import { checkLink } from "../lib/link-check.mjs";

export default function LinksPage({ intelligence }) {
  const [input, setInput] = useState(""),
    [submitted, setSubmitted] = useState(""),
    [error, setError] = useState("");
  const [registration, setRegistration] = useState(null),
    [checking, setChecking] = useState(false),
    [lookupConsent, setLookupConsent] = useState(false);
  const [camera, setCamera] = useState("idle"),
    [decoding, setDecoding] = useState(false);
  const video = useRef(null),
    stream = useRef(null),
    timer = useRef(null),
    epoch = useRef(0),
    lookup = useRef(null);
  const result = useMemo(
    () =>
      submitted
        ? checkLink(submitted, {
            reputation: intelligence.reputation,
            databaseStatus: intelligence.status,
            registration,
          })
        : null,
    [submitted, intelligence.reputation, intelligence.status, registration],
  );
  function stopCamera() {
    epoch.current++;
    clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
    setCamera("idle");
  }
  function check(value = input) {
    lookup.current?.abort();
    setChecking(false);
    setSubmitted(value);
    setInput(value);
    setRegistration(null);
    setLookupConsent(false);
    setError("");
  }
  useEffect(
    () => () => {
      epoch.current++;
      clearInterval(timer.current);
      stream.current?.getTracks().forEach((t) => t.stop());
      lookup.current?.abort();
    },
    [],
  );
  async function decodeFrame(canvas) {
    const { default: jsQR } = await import("jsqr");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(data.data, data.width, data.height, {
      inversionAttempts: "attemptBoth",
    })?.data;
  }
  async function upload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    stopCamera();
    setError("");
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 10 * 1024 * 1024
    ) {
      setError("Choose a PNG, JPEG or WebP image smaller than 10 MB.");
      return;
    }
    setDecoding(true);
    let bitmap;
    try {
      bitmap = await createImageBitmap(file);
      if (bitmap.width * bitmap.height > 30000000)
        throw Error(
          "This image is too large. Crop it around the QR and try again.",
        );
      const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas
        .getContext("2d")
        .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const decoded = await decodeFrame(canvas);
      if (decoded) check(decoded);
      else
        setError(
          "No readable QR found. Try a clearer crop or paste the QR content.",
        );
    } catch (e) {
      setError(
        e.message?.includes("too large")
          ? e.message
          : "Could not decode this image. Try PNG/JPEG or paste the link.",
      );
    } finally {
      bitmap?.close();
      setDecoding(false);
    }
  }
  async function startCamera() {
    stopCamera();
    setError("");
    const token = epoch.current;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        "Camera access is unavailable. Upload a QR image or paste its content.",
      );
      return;
    }
    setCamera("starting");
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 640 } },
        audio: false,
      });
      if (token !== epoch.current) {
        media.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = media;
      video.current.srcObject = media;
      await video.current.play();
      if (token !== epoch.current) return;
      setCamera("active");
      const { default: jsQR } = await import("jsqr");
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (token !== epoch.current) return;
      timer.current = setInterval(() => {
        if (token !== epoch.current || !video.current?.videoWidth) return;
        const v = video.current;
        const scale = Math.min(1, 640 / Math.max(v.videoWidth, v.videoHeight));
        canvas.width = Math.round(v.videoWidth * scale);
        canvas.height = Math.round(v.videoHeight * scale);
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qr = jsQR(image.data, image.width, image.height);
        if (qr?.data) {
          stopCamera();
          check(qr.data);
        }
      }, 300);
    } catch {
      if (token === epoch.current) {
        stopCamera();
        setError("Camera could not start. Check permission or use a QR image.");
      }
    }
  }
  async function checkRegistration() {
    if (!lookupConsent || !result?.registrationDomain) return;
    lookup.current?.abort();
    const controller = new AbortController();
    lookup.current = controller;
    setChecking(true);
    setRegistration(null);
    try {
      const r = await fetch(
        "/api/intelligence?host=" + encodeURIComponent(result.host),
        { signal: controller.signal },
      );
      if (!r.ok) throw Error();
      const data = await r.json();
      if (lookup.current === controller) setRegistration(data);
    } catch (e) {
      if (e.name !== "AbortError") setRegistration({ status: "unavailable" });
    } finally {
      if (lookup.current === controller) setChecking(false);
    }
  }
  return (
    <div className="page-content">
      <PageTitle
        eyebrow="LINKS & QR"
        title="Check the destination. Before you go."
        description="Inspect a link or payment QR without opening it. Unknown never means safe."
      />
      <div className="link-check-grid">
        <section className="panel">
          <div className="panel-title">
            <h2>What were you sent?</h2>
            <Link size={25} />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              stopCamera();
              check();
            }}
          >
            <label className="field">
              Link or QR content
              <textarea
                rows={4}
                maxLength={4096}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="https://… or upi://pay?…"
              />
            </label>
            <Button disabled={!input.trim()}>
              Check content <Link size={19} />
            </Button>
          </form>
          <div className="qr-section">
            <h3>
              <QrCode size={22} />
              Or read a QR code
            </h3>
            <p>
              The image and camera frames are decoded on this device and are not
              uploaded.
            </p>
            <div className="button-row">
              <label
                className={`button secondary upload-button ${decoding ? "disabled" : ""}`}
              >
                <UploadSimple size={20} />
                {decoding ? "Reading QR…" : "Upload QR image"}
                <input
                  aria-label="Upload QR image"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={decoding}
                  onChange={upload}
                />
              </label>
              {camera === "idle" ? (
                <Button secondary onClick={startCamera}>
                  <Camera size={20} />
                  Start camera
                </Button>
              ) : (
                <Button secondary onClick={stopCamera}>
                  <Stop size={20} />
                  Stop camera
                </Button>
              )}
            </div>
            <video
              ref={video}
              className="qr-camera"
              hidden={camera === "idle"}
              muted
              playsInline
              aria-label="QR camera preview"
            />
            <p className="fine-print">
              Camera starts only when you choose it. No microphone is requested.
            </p>
          </div>
          {error && <Notice warning>{error}</Notice>}
          <div className="privacy-line">
            <LockKey size={18} />
            No destination is opened, no payment is initiated, and full links
            are not sent to the database.
          </div>
        </section>
        <section className="panel link-result" aria-live="polite">
          <div className="panel-title">
            <h2>Check result</h2>
            <span className="small-label">
              {result ? "HEURISTICS + AVAILABLE DATA" : "AWAITING CONTENT"}
            </span>
          </div>
          {!result ? (
            <div className="empty">
              <QrCode size={54} />
              <h3>Pause at the link.</h3>
              <p>
                Paste a destination, scan a QR, or upload an image. We’ll
                explain what deserves a second look.
              </p>
            </div>
          ) : (
            <>
              <span
                className={`risk-badge ${result.verdict === "high" ? "high" : ""}`}
              >
                <Warning size={22} />
                {result.title}
              </span>
              {result.kind === "url" && (
                <>
                  <div className="hostname">
                    <small>Actual hostname</small>
                    <code>{result.host}</code>
                    <small>Registrable site: {result.domain}</small>
                  </div>
                  <p className="data-status">
                    Report database:{" "}
                    {result.reputation === "reported"
                      ? "Match in reviewed reports"
                      : result.reputation === "no-match"
                        ? "No match · still unverified"
                        : "Unavailable · no reputation conclusion"}
                  </p>
                </>
              )}
              {result.kind === "upi" && (
                <dl className="payment-details">
                  <div>
                    <dt>Recipient address</dt>
                    <dd>{result.payment.payee || "Missing"}</dd>
                  </div>
                  <div>
                    <dt>Displayed name · unverified</dt>
                    <dd>{result.payment.name || "Not supplied"}</dd>
                  </div>
                  <div>
                    <dt>Requested amount</dt>
                    <dd>
                      {result.payment.amount
                        ? `${result.payment.currency} ${result.payment.amount}`
                        : "Not fixed in QR"}
                    </dd>
                  </div>
                </dl>
              )}
              {result.signals.map((s) => (
                <article className="link-signal" key={s.id}>
                  <Warning size={22} />
                  <div>
                    <h3>{s.title}</h3>
                    <p>{s.detail}</p>
                  </div>
                </article>
              ))}
              <Notice warning>{result.message}</Notice>
              {result.kind === "url" && result.registrationDomain && (
                <div className="registration-check">
                  <h3>Domain registration</h3>
                  {registration?.status === "available" ? (
                    <p>
                      Registered{" "}
                      {new Date(registration.createdAt).toLocaleDateString(
                        "en-IN",
                      )}{" "}
                      · {registration.ageDays} days ago.
                      <br />
                      <small>
                        Registry data is not a measure of site trust or current
                        ownership.
                      </small>
                    </p>
                  ) : registration ? (
                    <p>
                      Registration date unavailable. No domain-age conclusion
                      was made.
                    </p>
                  ) : (
                    <p>
                      Optional live registry lookup. A missing or old date does
                      not prove safety.
                    </p>
                  )}
                  <label className="check-row">
                    <input
                      type="checkbox"
                      checked={lookupConsent}
                      onChange={(e) => setLookupConsent(e.target.checked)}
                    />
                    Send only this hostname to the app server and public RDAP
                    registry.
                  </label>
                  <Button
                    secondary
                    disabled={!lookupConsent || checking}
                    onClick={checkRegistration}
                  >
                    {checking ? "Checking registry…" : "Check registration age"}
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
      <Notice>
        Lookalike checks cover a small reference set, not every organization.
        Short links are flagged without following redirects. UPI recipient
        reputation is not currently provided.
      </Notice>
    </div>
  );
}
