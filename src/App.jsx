import { QrCode } from "@phosphor-icons/react/dist/csr/QrCode";
import { Newspaper } from "@phosphor-icons/react/dist/csr/Newspaper";
import FamilyProtection from "./features/FamilyProtection.jsx";
import { useIntelligence } from "./lib/useIntelligence.js";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { ShieldCheck } from "@phosphor-icons/react/dist/csr/ShieldCheck";
import { House } from "@phosphor-icons/react/dist/csr/House";
import { Phone } from "@phosphor-icons/react/dist/csr/Phone";
import { Users } from "@phosphor-icons/react/dist/csr/Users";
import { FileText } from "@phosphor-icons/react/dist/csr/FileText";
import { GearSix } from "@phosphor-icons/react/dist/csr/GearSix";
import { Question } from "@phosphor-icons/react/dist/csr/Question";
import { GraduationCap } from "@phosphor-icons/react/dist/csr/GraduationCap";
import { ChatCircle } from "@phosphor-icons/react/dist/csr/ChatCircle";
import { Bank } from "@phosphor-icons/react/dist/csr/Bank";
import { ArrowRight } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { ArrowLeft } from "@phosphor-icons/react/dist/csr/ArrowLeft";
import { ArrowUpRight } from "@phosphor-icons/react/dist/csr/ArrowUpRight";
import { Warning } from "@phosphor-icons/react/dist/csr/Warning";
import { Info } from "@phosphor-icons/react/dist/csr/Info";
import { CheckCircle } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { LockKey } from "@phosphor-icons/react/dist/csr/LockKey";
import { Microphone } from "@phosphor-icons/react/dist/csr/Microphone";
import { Stop } from "@phosphor-icons/react/dist/csr/Stop";
import { Plus } from "@phosphor-icons/react/dist/csr/Plus";
import { Trash } from "@phosphor-icons/react/dist/csr/Trash";
import { DownloadSimple } from "@phosphor-icons/react/dist/csr/DownloadSimple";
import { SpeakerHigh } from "@phosphor-icons/react/dist/csr/SpeakerHigh";
import { Eye } from "@phosphor-icons/react/dist/csr/Eye";
import { WifiSlash } from "@phosphor-icons/react/dist/csr/WifiSlash";
import { Check } from "@phosphor-icons/react/dist/csr/Check";
import { Copy } from "@phosphor-icons/react/dist/csr/Copy";
import {
  analyze,
  canDismiss,
  createReport,
  redact,
  RULE_VERSION,
} from "./lib/risk.mjs";
import { initialTranscript, scenarios } from "./lib/scenarios.js";
import {
  readLocal,
  writeLocal,
  clearLocal,
  downloadJson,
} from "./lib/storage.js";
import { useSpeech } from "./lib/useSpeech.js";
import {
  Modal,
  Button,
  Notice,
  PageTitle,
  Empty,
  RiskBadge,
  OfficialHelp,
} from "./components.jsx";

const LinksPage = lazy(() => import("./features/LinksPage.jsx"));
const DigestPage = lazy(() => import("./features/DigestPage.jsx"));

const methods = [
  {
    id: "family",
    icon: ChatCircle,
    title: "Ask a family question",
    description: "Ask something only your family would know.",
  },
  {
    id: "callback",
    icon: Phone,
    title: "Call back on a saved number",
    description:
      "End the call and call them on a number you already trust, like a saved contact.",
  },
  {
    id: "organization",
    icon: Bank,
    title: "Verify an organization independently",
    description:
      "Contact the organization through its official website or customer care number.",
  },
];
const navigation = [
  { id: "links", label: "Links & QR", icon: QrCode },
  { id: "digest", label: "Weekly digest", icon: Newspaper },
  { id: "verify", label: "Verify caller", icon: House },
  { id: "guard", label: "Call guard", icon: Phone },
  { id: "family", label: "Family circle", icon: Users },
  { id: "practice", label: "Practice studio", icon: GraduationCap },
  { id: "reports", label: "Reports", icon: FileText },
];
const defaultSettings = {
  elder: false,
  spoken: false,
  lang: "en-IN",
  saveReports: false,
};

export function App() {
  const [page, setPage] = useState("verify");
  const intelligence = useIntelligence(page === "links" || page === "digest");
  const [progress, setProgress] = useState(() => {
    const p = readLocal("progress", []);
    return Array.isArray(p)
      ? p
          .filter(
            (x) =>
              x &&
              typeof x.scenarioId === "string" &&
              typeof x.completedAt === "string",
          )
          .slice(0, 30)
      : [];
  });
  const [plan, setPlan] = useState(() => ({
    callbackPlan: readLocal("plan", {})?.callbackPlan === true,
  }));
  function updatePlan(next) {
    setPlan(next);
    if (!writeLocal("plan", next))
      setToast(
        "Setup changed for this visit only; browser storage unavailable.",
      );
  }
  function completePractice(id) {
    setAnswer(id);
    if (!quiz || id !== quiz.expected) return;
    const next = [
      ...progress.filter((p) => p.scenarioId !== quiz.id),
      { scenarioId: quiz.id, completedAt: new Date().toISOString() },
    ];
    setProgress(next);
    if (!writeLocal("progress", next))
      setToast(
        "Practice progress lasts for this visit only; browser storage unavailable.",
      );
  }
  const [text, setText] = useState(initialTranscript);
  const [confidence, setConfidence] = useState(1);
  const [noisy, setNoisy] = useState(false);
  const [mixed, setMixed] = useState(false);
  const [practice, setPractice] = useState(true);
  const [method, setMethod] = useState("family");
  const [step, setStep] = useState(1);
  const [ack, setAck] = useState(false);
  const [outcome, setOutcome] = useState("");
  const [dismissedAt, setDismissedAt] = useState(null);
  const [session, setSession] = useState(0);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [settings, setSettings] = useState(() => ({
    ...defaultSettings,
    ...readLocal("settings", {}),
  }));
  const [contacts, setContacts] = useState(() => {
    const c = readLocal("contacts", []);
    return Array.isArray(c)
      ? c
          .filter(
            (x) =>
              typeof x.name === "string" &&
              typeof x.phone === "string" &&
              typeof x.question === "string",
          )
          .slice(0, 5)
      : [];
  });
  const [reports, setReports] = useState(() => {
    const r = readLocal("reports", []);
    return Array.isArray(r)
      ? r
          .filter((x) => typeof x.id === "string" && Array.isArray(x.signals))
          .slice(0, 100)
      : [];
  });
  const [online, setOnline] = useState(navigator.onLine);
  const [playId, setPlayId] = useState(null);
  const [playIndex, setPlayIndex] = useState(0);
  const [quiz, setQuiz] = useState(null);
  const [answer, setAnswer] = useState("");
  const alertKey = useRef("");
  const result = useMemo(
    () => analyze(text, { confidence, noisy, mixedSpeakers: mixed }),
    [text, confidence, noisy, mixed],
  );
  const dismissed = dismissedAt === text;
  const hasUrgentPayment =
    result.signals.some((s) => s.id === "urgency") &&
    result.signals.some((s) => s.id === "money");
  const contextSignals = hasUrgentPayment
    ? [
        {
          id: "urgent-payment",
          title: "Urgent money request",
          detail: "Caller is asking for an immediate transfer of money.",
        },
        ...result.signals.filter((s) => !["urgency", "money"].includes(s.id)),
      ]
    : result.signals;
  const speech = useSpeech((line, c) => {
    setText((prev) => (prev + "\n" + line).trim().slice(-12000));
    setConfidence((prev) => Math.min(prev, c));
  });
  const currentScenario = scenarios.find((s) => s.id === playId);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  useEffect(() => {
    if (!playId || !currentScenario) return;
    if (playIndex >= currentScenario.lines.length) {
      setQuiz(currentScenario);
      setPlayId(null);
      return;
    }
    const t = setTimeout(
      () => {
        setText((p) => (p + "\n" + currentScenario.lines[playIndex]).trim());
        setPlayIndex((i) => i + 1);
      },
      playIndex === 0 ? 400 : 2600,
    );
    return () => clearTimeout(t);
  }, [playId, playIndex, currentScenario]);
  useEffect(() => {
    if (result.level !== "high" || dismissed) return;
    const key = `${session}:${result.signals.map((s) => s.id).join(",")}`;
    if (alertKey.current === key) return;
    alertKey.current = key;
    setModal("risk");
    if (navigator.vibrate) navigator.vibrate([150, 70, 150]);
    if (settings.spoken && "speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(
        settings.lang === "hi-IN"
          ? "रुकिए। पैसे भेजने से पहले स्वतंत्र रूप से पुष्टि करें।"
          : settings.lang === "ta-IN"
            ? "நிறுத்துங்கள். பணம் அனுப்பும் முன் தனியாக சரிபார்க்கவும்."
            : "Pause. Verify independently before sending money.",
      );
      u.lang = settings.lang;
      window.speechSynthesis.speak(u);
    }
  }, [result, dismissed, session, settings.spoken, settings.lang]);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  function notify(message) {
    setToast(message);
  }
  function navigate(id) {
    setPage(id);
  }
  function resetSession({ demo = false, transcript = "" } = {}) {
    speech.stop();
    setPlayId(null);
    setQuiz(null);
    setAnswer("");
    setText(transcript);
    setConfidence(1);
    setNoisy(false);
    setMixed(false);
    setPractice(demo);
    setDismissedAt(null);
    setStep(1);
    setAck(false);
    setOutcome("");
    setSession((n) => n + 1);
    setModal(null);
  }
  function startScenario(s) {
    resetSession({ demo: true });
    setPage("guard");
    setPlayId(s.id);
    setPlayIndex(0);
  }
  function updateSettings(patch) {
    const next = { ...settings, ...patch };
    setSettings(next);
    if (!writeLocal("settings", next))
      notify(
        "Settings changed for this visit only. Device storage is unavailable.",
      );
    if (patch.saveReports === false) writeLocal("reports", []);
  }
  function openVerify(family = false) {
    if (family) setMethod("family");
    setStep(1);
    setAck(false);
    setOutcome("");
    setPage("verify");
    setModal(null);
  }
  function saveReport(report) {
    const metadata = { ...report };
    delete metadata.excerpt;
    const next = [metadata, ...reports].slice(0, 100);
    setReports(next);
    if (settings.saveReports && !writeLocal("reports", next))
      notify("Draft kept for this visit. Device storage is unavailable.");
    else
      notify(
        practice
          ? "Practice draft created. Nothing was submitted."
          : "Local draft created. Nothing was submitted.",
      );
  }
  function finishVerification() {
    if (!canDismiss({ method, acknowledged: ack, result: outcome })) return;
    alertKey.current = "";
    setDismissedAt(text);
    setStep(3);
    notify(
      "Warning dismissed for this transcript only. New speech is checked again.",
    );
  }
  function contactSave(contact) {
    const next = [...contacts, { ...contact, id: crypto.randomUUID() }];
    if (writeLocal("contacts", next)) {
      setContacts(next);
      setModal(null);
      notify("Contact saved on this device. No message was sent.");
    } else notify("Could not save contact. Browser storage is unavailable.");
  }

  return (
    <div className={`app ${settings.elder ? "elder" : ""}`}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="rail" aria-label="Main navigation">
        <button
          className="rail-brand"
          title="Kavach Call"
          aria-label="Kavach Call home"
          onClick={() => navigate("verify")}
        >
          <ShieldCheck size={36} weight="duotone" />
        </button>
        <nav>
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={page === id ? "active" : ""}
              aria-current={page === id ? "page" : undefined}
              title={label}
              aria-label={label}
              onClick={() => navigate(id)}
            >
              <Icon size={27} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="rail-bottom">
          <button
            title="Settings"
            aria-label="Settings"
            className={page === "settings" ? "active" : ""}
            onClick={() => navigate("settings")}
          >
            <GearSix size={27} />
          </button>
          <button
            title="Help & limitations"
            aria-label="Help and limitations"
            onClick={() => setModal("help")}
          >
            <Question size={27} />
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <button
            className="brand"
            onClick={() => navigate("verify")}
            aria-label="Kavach Call home"
          >
            <ShieldCheck size={62} weight="fill" />
            <span>
              <strong>Kavach Call</strong>
              <small>Armor for every call</small>
            </span>
          </button>
          <span className={`session-badge ${practice ? "" : "personal"}`}>
            {practice ? "Demo session" : "Personal session"}
          </span>
          <div className="header-right">
            {!online && (
              <span className="offline">
                <WifiSlash size={18} /> Offline
              </span>
            )}
            <time>
              {new Intl.DateTimeFormat("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: "Asia/Kolkata",
              }).format(new Date())}
            </time>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          <Suspense fallback={<Notice>Loading protection tools…</Notice>}>
            {page === "links" && <LinksPage intelligence={intelligence} />}
            {page === "digest" && (
              <DigestPage
                reports={reports}
                intelligence={intelligence}
                onReports={() => setPage("reports")}
                onPractice={(id) =>
                  startScenario(
                    scenarios.find((s) => s.id === id) || scenarios[0],
                  )
                }
              />
            )}
          </Suspense>
          {page === "verify" && (
            <div className="verification-layout">
              <section
                className="verification-main"
                aria-labelledby="verify-title"
              >
                <h1 id="verify-title">Before you trust, verify.</h1>
                <p className="hero-subtitle">
                  A familiar voice isn’t proof of identity.
                </p>
                <ol className="steps" aria-label="Verification progress">
                  {["Pause", "Verify", "Decide"].map((s, i) => (
                    <li
                      key={s}
                      className={
                        i < step ? "complete" : i === step ? "current" : ""
                      }
                      aria-current={i === step ? "step" : undefined}
                    >
                      <span>
                        {i < step ? <Check size={22} weight="bold" /> : i + 1}
                      </span>
                      <strong>{s}</strong>
                    </li>
                  ))}
                </ol>
                {step === 1 && (
                  <>
                    <div className="section-heading">
                      <span>01</span>
                      <h2>Choose a verification method.</h2>
                    </div>
                    <fieldset className="method-list">
                      <legend className="sr-only">Verification method</legend>
                      {methods.map(({ id, icon: Icon, title, description }) => (
                        <label
                          key={id}
                          className={`method ${method === id ? "selected" : ""}`}
                        >
                          <input
                            type="radio"
                            name="verification"
                            value={id}
                            checked={method === id}
                            onChange={() => setMethod(id)}
                          />
                          <Icon size={36} />
                          <span>
                            <strong>{title}</strong>
                            <small>{description}</small>
                          </span>
                        </label>
                      ))}
                    </fieldset>
                    <Button
                      className="continue"
                      onClick={() => {
                        setStep(2);
                        setAck(false);
                        setOutcome("");
                      }}
                    >
                      Continue securely <ArrowRight size={23} />
                    </Button>
                    <div className="sensitive-note">
                      <Warning size={21} />
                      Never enter an OTP, bank PIN, or password here.
                    </div>
                  </>
                )}
                {step === 2 && (
                  <div className="verification-detail">
                    <button className="text-button" onClick={() => setStep(1)}>
                      <ArrowLeft size={18} /> Change method
                    </button>
                    <div className="section-heading">
                      <span>02</span>
                      <h2>{methods.find((m) => m.id === method).title}</h2>
                    </div>
                    {method === "family" ? (
                      <>
                        <p>
                          Ask the question aloud. Keep the answer outside this
                          app and off any chat the caller can see.
                        </p>
                        <div className="challenge">
                          <LockKey size={25} />
                          <div>
                            <small>
                              {contacts.length
                                ? "Your saved family question"
                                : "Example question · agree one with your family first"}
                            </small>
                            <strong>
                              {contacts[0]?.question ||
                                "What did we eat together last Diwali?"}
                            </strong>
                          </div>
                        </div>
                        <Notice>
                          A correct answer is one check, not proof. For urgent
                          money requests, also call back on a saved number.
                          Never ask for banking secrets.
                        </Notice>
                      </>
                    ) : method === "callback" ? (
                      <>
                        <p>
                          End the original call yourself. Open your own contacts
                          and dial the saved number. Don’t use a number the
                          caller supplies or trust caller ID alone.
                        </p>
                        <Notice>
                          This browser cannot hang up a phone call. Use your
                          phone’s call controls.
                        </Notice>
                        {contacts.length > 0 && (
                          <div className="contact-links">
                            {contacts.map((c) => (
                              <a
                                className="button secondary"
                                key={c.id}
                                href={`tel:${c.phone}`}
                              >
                                <Phone size={19} />
                                Call {c.name}
                              </a>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <p>
                          End the call and find the organization’s number on
                          your bank card, official app, or official website you
                          open yourself.
                        </p>
                        <Notice>
                          Caller ID and uniforms can be impersonated. A claimed
                          job title is not independent verification.
                        </Notice>
                      </>
                    )}
                    <fieldset className="outcomes">
                      <legend>What happened when you checked?</legend>
                      <label>
                        <input
                          type="radio"
                          name="outcome"
                          checked={outcome === "verified"}
                          onChange={() => setOutcome("verified")}
                        />
                        I independently checked and recognized the caller.
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="outcome"
                          checked={outcome === "failed"}
                          onChange={() => setOutcome("failed")}
                        />
                        The answer was wrong, they refused, or I’m unsure.
                      </label>
                    </fieldset>
                    {outcome === "verified" && (
                      <label className="check-row">
                        <input
                          type="checkbox"
                          checked={ack}
                          onChange={(e) => setAck(e.target.checked)}
                        />
                        Dismiss this warning for this session. Keep checking new
                        speech.
                      </label>
                    )}
                    {outcome === "failed" ? (
                      <div>
                        <Notice warning>
                          Keep the warning. Pause any payment and end the
                          original call. Contact someone you trust.
                        </Notice>
                        <Button
                          onClick={() => {
                            setModal("report");
                          }}
                        >
                          Prepare a report draft <FileText size={20} />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        disabled={
                          !canDismiss({
                            method,
                            acknowledged: ack,
                            result: outcome,
                          })
                        }
                        onClick={finishVerification}
                      >
                        Confirm my check <CheckCircle size={22} />
                      </Button>
                    )}
                  </div>
                )}
                {step === 3 && (
                  <div className="success-panel">
                    <CheckCircle size={58} weight="duotone" />
                    <h2>
                      {dismissed
                        ? "Your check is recorded."
                        : "New speech needs a fresh check."}
                    </h2>
                    <p>
                      {dismissed
                        ? "You chose to dismiss this warning. This does not mark the caller permanently safe."
                        : "The conversation changed after your check. Review the new signals before trusting the caller."}
                    </p>
                    <Button
                      onClick={() => {
                        setPage("guard");
                      }}
                    >
                      Return to call guard <ArrowRight size={20} />
                    </Button>
                    <button
                      className="text-button"
                      onClick={() => openVerify()}
                    >
                      Verify again
                    </button>
                  </div>
                )}
              </section>
              <aside className="context-panel" aria-label="Session context">
                <h2>Session context</h2>
                <div className="call-summary">
                  <Phone size={30} />
                  <div>
                    <strong>
                      {practice
                        ? "Incoming call (simulated)"
                        : "Transcript session"}
                    </strong>
                    <small>
                      {practice
                        ? "Demo caller · identity unverified"
                        : speech.status === "listening"
                          ? "Microphone listening"
                          : "No phone call access"}
                    </small>
                  </div>
                  <RiskBadge result={result} dismissed={dismissed} />
                </div>
                <div className="context-section">
                  <h3>Security indicators</h3>
                  {result.signals.length ? (
                    contextSignals.slice(0, 3).map((s) => (
                      <div className="indicator" key={s.id}>
                        <Warning size={30} />
                        <div>
                          <strong>{s.title}</strong>
                          <p>{s.detail}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>
                      {result.discussion
                        ? "Discussion or advice detected."
                        : "No strong pattern detected in this text."}{" "}
                      This does not confirm the caller is safe.
                    </p>
                  )}
                </div>
                <div className="context-section transcript-preview">
                  <h3>
                    {practice
                      ? "Call transcript (simulated)"
                      : "Transcript excerpt"}
                  </h3>
                  <blockquote>
                    “
                    {redact(text.split("\n")[0]).slice(0, 180) ||
                      "Waiting for a transcript…"}
                    ”
                  </blockquote>
                  <button
                    className="text-button"
                    onClick={() => openVerify(true)}
                  >
                    They may be joking <ArrowRight size={20} />
                  </button>
                  <p>You can dismiss after checking.</p>
                </div>
                <div className="context-footer">
                  <Info size={29} />
                  <p>
                    {practice
                      ? "Practice session · No real call connected."
                      : "Text analysis only · No phone call control."}
                    <br />
                    Voice authenticity not analyzed.
                  </p>
                </div>
              </aside>
            </div>
          )}

          {page === "guard" && (
            <div className="page-content">
              <PageTitle
                eyebrow="CALL GUARD"
                title="Listen. Notice. Take a breath."
                description="Make sense of a suspicious conversation, one signal at a time."
                action={
                  <Button secondary onClick={() => resetSession()}>
                    New session <Plus size={18} />
                  </Button>
                }
              />
              <div className="guard-grid">
                <section className="panel">
                  <div className="panel-title">
                    <h2>
                      {practice
                        ? "Simulated transcript"
                        : "Conversation transcript"}
                    </h2>
                    <span className="small-label">
                      {speech.status === "listening"
                        ? "MICROPHONE ON"
                        : playId
                          ? "DEMO PLAYING"
                          : "TEXT MODE"}
                    </span>
                  </div>
                  <label htmlFor="transcript" className="input-label">
                    {playId
                      ? "Script arriving in real time"
                      : "Type or paste what the caller said"}
                  </label>
                  <textarea
                    id="transcript"
                    className="transcript-input"
                    value={text}
                    maxLength={12000}
                    disabled={Boolean(playId) || speech.status !== "idle"}
                    onChange={(e) => {
                      setText(e.target.value);
                      setConfidence(1);
                    }}
                    placeholder="For example: Send money now. Don’t tell anyone."
                  />
                  <div className="transcript-controls">
                    <span>
                      {text.length.toLocaleString()} / 12,000 characters
                    </span>
                    {playId ? (
                      <Button
                        secondary
                        onClick={() => {
                          setPlayId(null);
                          notify("Demo stopped. Transcript remains available.");
                        }}
                      >
                        <Stop size={18} />
                        Stop demo
                      </Button>
                    ) : speech.status !== "idle" ? (
                      <Button secondary onClick={speech.stop}>
                        <Stop size={18} />
                        Stop microphone
                      </Button>
                    ) : (
                      <Button secondary onClick={() => setModal("mic")}>
                        <Microphone size={18} />
                        Use microphone
                      </Button>
                    )}
                  </div>
                  {speech.error && <Notice warning>{speech.error}</Notice>}
                  <details className="quality-controls">
                    <summary>Transcript quality & context</summary>
                    <label>
                      Transcript quality
                      <select
                        aria-label="Transcript quality"
                        value={confidence < 0.6 ? "limited" : "clear"}
                        onChange={(e) =>
                          setConfidence(e.target.value === "limited" ? 0.4 : 1)
                        }
                      >
                        <option value="clear">
                          Clear / manually checked text
                        </option>
                        <option value="limited">
                          Poor transcription / uncertain words
                        </option>
                      </select>
                    </label>
                    <label className="check-row">
                      <input
                        type="checkbox"
                        checked={noisy}
                        onChange={(e) => setNoisy(e.target.checked)}
                      />
                      Noisy audio or echo
                    </label>
                    <label className="check-row">
                      <input
                        type="checkbox"
                        checked={mixed}
                        onChange={(e) => setMixed(e.target.checked)}
                      />
                      Multiple speakers / TV in the background
                    </label>
                    <p>
                      These quality labels are supplied by you or the browser,
                      not measured by an audio model.
                    </p>
                  </details>
                  <div className="privacy-line">
                    <LockKey size={17} />
                    Text scoring runs on this device. Transcripts are not saved.
                  </div>
                </section>
                <aside
                  className={`risk-panel panel risk-${result.level}`}
                  aria-live="polite"
                >
                  <RiskBadge result={result} dismissed={dismissed} />
                  <div className="score">
                    <strong>
                      {result.level === "idle" ? "—" : result.score}
                    </strong>
                    <span>
                      /100
                      <br />
                      rule score
                    </span>
                  </div>
                  <p className="score-caption">
                    A heuristic score, not a probability of fraud.
                  </p>
                  <div className="score-track">
                    <span style={{ width: `${result.score}%` }} />
                  </div>
                  <h3>{result.category}</h3>
                  <p>{result.advice}</p>
                  {result.limited && (
                    <Notice warning>
                      Transcript confidence is limited. No high-confidence
                      verdict is available.
                    </Notice>
                  )}
                  <Button onClick={() => openVerify()}>
                    Verify this caller <ArrowRight size={19} />
                  </Button>
                  <button
                    className="text-button"
                    onClick={() => setModal("report")}
                  >
                    <FileText size={19} />
                    Prepare a report draft
                  </button>
                </aside>
              </div>
              <section className="evidence panel">
                <div className="panel-title">
                  <h2>Why we’re asking you to pause</h2>
                  <span className="small-label">
                    {result.signals.length} SIGNALS
                  </span>
                </div>
                {result.signals.length ? (
                  <div className="evidence-grid">
                    {result.signals.map((s) => (
                      <article key={s.id}>
                        <Warning size={24} />
                        <div>
                          <h3>{s.title}</h3>
                          <p>{s.detail}</p>
                          <blockquote>“{s.excerpt}”</blockquote>
                          <small>+{s.weight} points · counted once</small>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <Empty
                    title={
                      result.discussion
                        ? "This sounds like discussion or advice."
                        : "No matching risk pattern yet."
                    }
                  >
                    Rules miss unfamiliar scripts and subtle coercion. A low
                    score does not establish safety.
                  </Empty>
                )}
              </section>
              {quiz && (
                <section className="panel quiz">
                  <h2>Your turn: what would you do?</h2>
                  <div className="quiz-answers">
                    {[
                      ["stop", "Stop and verify independently"],
                      ["verify", "Ask a family question or call back"],
                      ["context", "Recognize discussion / advice"],
                    ].map(([id, label]) => (
                      <Button
                        key={id}
                        secondary={answer !== id}
                        onClick={() => completePractice(id)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                  {answer && (
                    <Notice>
                      {answer === quiz.expected
                        ? "Good judgment. "
                        : "Consider this approach. "}
                      {quiz.explanation}
                    </Notice>
                  )}
                  <button
                    className="text-button"
                    onClick={() => setPage("practice")}
                  >
                    Try another scenario <ArrowRight size={18} />
                  </button>
                </section>
              )}
            </div>
          )}

          {page === "practice" && (
            <div className="page-content">
              <PageTitle
                eyebrow="PRACTICE STUDIO"
                title="Build a habit of checking."
                description="Short, scripted conversations. Real decisions. No calls, reports, or alerts are sent."
              />
              <div className="scenario-grid">
                {scenarios.map((s, i) => (
                  <button
                    key={s.id}
                    className="scenario-card"
                    onClick={() => startScenario(s)}
                  >
                    <div className="scenario-top">
                      <span>{String(i + 1).padStart(2, "0")}</span>
                      <span>{s.difficulty}</span>
                    </div>
                    <small>{s.type}</small>
                    <h2>{s.title}</h2>
                    <p>{s.description}</p>
                    <span className="scenario-action">
                      Start practice <ArrowUpRight size={22} />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {page === "family" && (
            <div className="page-content">
              <PageTitle
                eyebrow="FAMILY CIRCLE"
                title="Trust starts with a conversation."
                description="Agree on a private question together. Keep the answer out of the app."
                action={
                  <Button
                    disabled={contacts.length >= 5}
                    onClick={() => setModal("contact")}
                  >
                    Add a trusted contact <Plus size={20} />
                  </Button>
                }
              />
              <Notice>
                Contacts and questions are stored in this browser when you save
                them. No automatic SMS, Telegram message, or notification is
                sent by this prototype.
              </Notice>
              <FamilyProtection
                contacts={contacts}
                progress={progress}
                plan={plan}
                onPlan={updatePlan}
                onPractice={() => setPage("practice")}
                onAdd={() => setModal("contact")}
              />
              {contacts.length ? (
                <div className="contact-grid">
                  {contacts.map((c) => (
                    <article className="panel contact-card" key={c.id}>
                      <div className="contact-card-top">
                        <div className="avatar">
                          {c.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <h2>{c.name}</h2>
                          <p>{c.phone}</p>
                        </div>
                        <button
                          className="icon-button"
                          aria-label={`Remove ${c.name}`}
                          onClick={() => {
                            const next = contacts.filter((x) => x.id !== c.id);
                            setContacts(next);
                            if (!writeLocal("contacts", next))
                              notify(
                                "Removed for this visit only; device storage could not be updated.",
                              );
                          }}
                        >
                          <Trash size={20} />
                        </button>
                      </div>
                      <div className="challenge">
                        <LockKey size={21} />
                        <div>
                          <small>Family question</small>
                          <strong>{c.question}</strong>
                        </div>
                      </div>
                      <a className="button secondary" href={`tel:${c.phone}`}>
                        <Phone size={20} />
                        Call saved number
                      </a>
                      <button
                        className="text-button"
                        onClick={() =>
                          setModal({ type: "message", contact: c })
                        }
                      >
                        <ChatCircle size={19} />
                        Prepare a check-in message
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <Empty title="Your circle starts here.">
                  Add someone you trust, then agree on a question in person.
                  They don’t need this app.
                </Empty>
              )}
              <div className="two-column">
                <section className="panel">
                  <h2>Make the question personal.</h2>
                  <p>
                    Choose a shared memory that is not on social media. Change
                    it if it is disclosed. Don’t use a date of birth, password,
                    PIN, or OTP.
                  </p>
                </section>
                <section className="panel">
                  <h2>Permission lasts for one session.</h2>
                  <p>
                    Even saved contacts can be impersonated. Confirming a family
                    joke dismisses the current warning; new speech is evaluated
                    again.
                  </p>
                </section>
              </div>
            </div>
          )}

          {page === "reports" && (
            <div className="page-content">
              <PageTitle
                eyebrow="YOUR REPORTS"
                title="A clear record. On your terms."
                description="Prepare a draft you can review. Nothing here is automatically reported or shared."
                action={
                  <Button onClick={() => setModal("report")}>
                    Create draft <Plus size={19} />
                  </Button>
                }
              />
              <Notice>
                {settings.saveReports
                  ? "Report summaries are saved in this browser. Excerpts are never kept in history."
                  : "History lasts for this visit. Enable local history in Settings to keep summaries on this device."}
              </Notice>
              {reports.length ? (
                <div className="report-list">
                  {reports.map((r) => (
                    <article className="panel report-row" key={r.id}>
                      <div className="report-symbol">
                        <FileText size={25} />
                      </div>
                      <div>
                        <span className="small-label">
                          {r.practice ? "PRACTICE DRAFT" : "PERSONAL DRAFT"} ·
                          NOT SUBMITTED
                        </span>
                        <h3>{r.category}</h3>
                        <p>
                          {new Date(r.createdAt).toLocaleString("en-IN", {
                            timeZone: "Asia/Kolkata",
                          })}{" "}
                          IST · Score {r.riskScore}/100
                        </p>
                      </div>
                      <Button
                        secondary
                        onClick={() =>
                          downloadJson(
                            r,
                            `kavach-draft-${r.id.slice(0, 8)}.json`,
                          )
                        }
                      >
                        <DownloadSimple size={19} />
                        Export
                      </Button>
                      <button
                        className="icon-button"
                        aria-label="Delete draft"
                        onClick={() => {
                          const next = reports.filter((x) => x.id !== r.id);
                          setReports(next);
                          if (
                            settings.saveReports &&
                            !writeLocal("reports", next)
                          )
                            notify("Could not update device history.");
                        }}
                      >
                        <Trash size={20} />
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <Empty title="No drafts yet.">
                  Review a conversation, then create a report draft. Caller
                  numbers are not added to any public database.
                </Empty>
              )}
              <section className="panel">
                <h2>Already sent money?</h2>
                <p>
                  Contact your bank promptly. In India, use the cybercrime
                  reporting channels below. This prototype does not submit a
                  complaint for you.
                </p>
                <OfficialHelp />
              </section>
            </div>
          )}

          {page === "settings" && (
            <div className="page-content settings-page">
              <PageTitle
                eyebrow="SETTINGS & PRIVACY"
                title="Protection that respects your choices."
                description="Clear controls. No hidden recording. No permanent trust bypass."
              />
              <section className="panel setting-list">
                <Setting
                  icon={Eye}
                  title="Large-text mode"
                  description="Larger text and more prominent controls."
                  checked={settings.elder}
                  onChange={(v) => updateSettings({ elder: v })}
                />
                <Setting
                  icon={SpeakerHigh}
                  title="Spoken high-risk warning"
                  description="Uses your device’s available voices. Language support varies."
                  checked={settings.spoken}
                  onChange={(v) => updateSettings({ spoken: v })}
                />
                <div className="setting">
                  <ChatCircle size={25} />
                  <div>
                    <h3>Recognition & warning language</h3>
                    <p>
                      Interface remains in English. Hindi and Tamil rules are
                      illustrative.
                    </p>
                  </div>
                  <select
                    aria-label="Recognition language"
                    value={settings.lang}
                    onChange={(e) => updateSettings({ lang: e.target.value })}
                  >
                    <option value="en-IN">English (India)</option>
                    <option value="hi-IN">हिन्दी</option>
                    <option value="ta-IN">தமிழ்</option>
                  </select>
                </div>
                <Setting
                  icon={FileText}
                  title="Save local report summaries"
                  description="Stores scores and signal names in this browser; never transcript excerpts or audio."
                  checked={settings.saveReports}
                  onChange={(v) => updateSettings({ saveReports: v })}
                />
              </section>
              <div className="two-column">
                <section className="panel">
                  <LockKey size={28} />
                  <h2>Your data, explained</h2>
                  <p>
                    Scoring runs in your browser. Microphone transcription may
                    use your browser provider’s servers, only with explicit
                    consent. On-device recognition is optional where supported.
                  </p>
                  <p>
                    Contacts are local to this browser. Anyone using the same
                    browser profile may access them.
                  </p>
                </section>
                <section className="panel">
                  <h2>Start fresh</h2>
                  <p>
                    Remove Kavach contacts, settings and report history from
                    this browser. Downloaded files are not affected.
                  </p>
                  <Button secondary onClick={() => setModal("erase")}>
                    <Trash size={20} />
                    Delete local data
                  </Button>
                </section>
              </div>
              <div className="privacy-line">
                <ShieldCheck size={18} />
                Rules {RULE_VERSION} · No deepfake model connected · No
                telemetry
              </div>
            </div>
          )}
        </main>
        {page !== "verify" && (
          <footer className="app-footer">
            <span>
              <ShieldCheck size={16} /> Warn. Verify. Stay in control.
            </span>
            <button onClick={() => setModal("help")}>
              Prototype limits & privacy <ArrowUpRight size={14} />
            </button>
          </footer>
        )}
      </div>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle size={22} />
          {toast}
        </div>
      )}
      {modal === "mic" && (
        <MicConsent
          supported={speech.supported}
          onClose={() => setModal(null)}
          onStart={(local) => {
            resetSession();
            setModal(null);
            setPage("guard");
            speech.start(settings.lang, local);
          }}
        />
      )}
      {modal === "contact" && (
        <ContactForm onClose={() => setModal(null)} onSave={contactSave} />
      )}
      {modal === "report" && (
        <ReportForm
          result={result}
          practice={practice}
          text={text}
          dismissed={dismissed}
          onClose={() => setModal(null)}
          onSave={(r) => {
            saveReport(r);
            setModal(null);
            setPage("reports");
          }}
        />
      )}
      {modal?.type === "message" && (
        <MessageDraft
          contact={modal.contact}
          practice={practice}
          onClose={() => setModal(null)}
          notify={notify}
        />
      )}
      {modal === "risk" && (
        <Modal
          title={
            practice
              ? "Practice alert: pause and verify"
              : "Pause. Verify before you act."
          }
          onClose={() => setModal(null)}
        >
          <div className="risk-alert">
            <Warning size={64} />
            <h3>Multiple warning signals appeared.</h3>
            <p>{result.advice}</p>
          </div>
          <Notice warning>
            This is a risk warning, not a finding of fraud. The browser cannot
            end your phone call.
          </Notice>
          <Button
            onClick={() => {
              speech.stop();
              setPlayId(null);
              openVerify();
            }}
          >
            Stop analysis & verify <ShieldCheck size={21} />
          </Button>
          <button className="text-button" onClick={() => setModal(null)}>
            Review the signals
          </button>
          {practice ? (
            <p className="fine-print">
              Practice mode: no real contact is alerted.
            </p>
          ) : (
            <button
              className="text-button"
              onClick={() => {
                setModal(null);
                setPage("family");
              }}
            >
              Contact someone I trust <Users size={19} />
            </button>
          )}
        </Modal>
      )}
      {modal === "erase" && (
        <Modal
          title="Delete Kavach data on this device?"
          onClose={() => setModal(null)}
        >
          <p>
            This removes your saved contacts, settings and report summaries. You
            cannot undo this.
          </p>
          <Button
            className="danger"
            onClick={() => {
              if (clearLocal()) {
                setContacts([]);
                setReports([]);
                setProgress([]);
                setPlan({ callbackPlan: false });
                setSettings(defaultSettings);
                resetSession({ demo: true, transcript: initialTranscript });
                notify("Local Kavach data deleted.");
              } else
                notify(
                  "Storage could not be cleared. Use your browser’s site-data controls.",
                );
            }}
          >
            Delete local data
          </Button>
          <Button secondary onClick={() => setModal(null)}>
            Keep my data
          </Button>
        </Modal>
      )}
      {modal === "help" && (
        <Modal
          title="A warning tool. You stay in control."
          onClose={() => setModal(null)}
          wide
        >
          <div className="help-grid">
            <section>
              <h3>What works here</h3>
              <p>
                Local text scoring, explained signals, guided verification,
                consent-based browser transcription, practice scenarios, local
                contacts, downloadable report drafts, link/QR inspection, family
                setup score and weekly explainers. Reviewed campaign and
                hostname metadata is read from Neon; registration lookup is
                optional.
              </p>
              <h3>What isn’t connected</h3>
              <p>
                No phone-call interception or hang-up control, deepfake model,
                number-reputation database, automatic family messages, police
                submission, or cloud account.
              </p>
              <h3>When context is uncertain</h3>
              <p>
                Rules can miss scams or flag genuine conversations. Poor
                transcription, multiple speakers and noise produce an “analysis
                limited” label. A joke or saved number never creates permanent
                trust.
              </p>
            </section>
            <section>
              <h3>Privacy</h3>
              <p>
                No audio is recorded by this app. Browser-provider recognition
                can transmit audio; microphone consent explains the options.
                Transcripts stay in memory unless you manually export an
                excerpt.
              </p>
              <h3>Need official help?</h3>
              <p>
                For financial cyber fraud in India, contact your bank and the
                official reporting channels.
              </p>
              <OfficialHelp />
              <a
                className="text-button"
                href="https://www.mha.gov.in/MHA1/Par2017/pdfs/par2023-pdfs/LS-12122023/131.pdf"
                target="_blank"
                rel="noreferrer"
              >
                Official helpline reference <ArrowUpRight size={16} />
              </a>
            </section>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Setting({ icon: Icon, title, description, checked, onChange }) {
  return (
    <label className="setting">
      <Icon size={25} />
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <input
        className="switch"
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

function MicConsent({ supported, onStart, onClose }) {
  const [local, setLocal] = useState(true),
    [consent, setConsent] = useState(false);
  return (
    <Modal title="Choose how speech is transcribed" onClose={onClose}>
      <p>
        Use a speakerphone or speak into your microphone. Kavach cannot access
        the other side of a normal phone call directly.
      </p>
      <fieldset className="outcomes">
        <legend>Recognition mode</legend>
        <label>
          <input
            type="radio"
            name="micmode"
            checked={local}
            onChange={() => {
              setLocal(true);
              setConsent(false);
            }}
          />
          On-device only, if supported by your browser
        </label>
        <label>
          <input
            type="radio"
            name="micmode"
            checked={!local}
            onChange={() => {
              setLocal(false);
              setConsent(false);
            }}
          />
          Browser provider · audio may leave this device
        </label>
      </fieldset>
      <Notice warning>
        {local
          ? "Requires a supported browser and an installed language pack. If unavailable, we stop; we never silently switch to cloud recognition."
          : "Your browser may send audio to its recognition provider. Provider processing and retention are outside this app’s control."}
      </Notice>
      <label className="check-row">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        I have permission from the people speaking and consent to this
        recognition mode.
      </label>
      {!supported && (
        <Notice warning>
          This browser does not support speech recognition. Use a typed
          transcript instead.
        </Notice>
      )}
      <Button disabled={!supported || !consent} onClick={() => onStart(local)}>
        <Microphone size={21} />
        Start microphone
      </Button>
      <p className="fine-print">
        Starts a new personal session and clears the current transcript. You can
        stop at any time. No audio file is saved by Kavach.
      </p>
    </Modal>
  );
}
function ContactForm({ onSave, onClose }) {
  const [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [question, setQuestion] = useState(""),
    [consent, setConsent] = useState(false);
  return (
    <Modal title="Add someone you trust" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const p = phone.replace(/[\s()-]/g, "");
          if (!/^\+?[0-9]{8,15}$/.test(p)) return;
          onSave({ name: name.trim(), phone: p, question: question.trim() });
        }}
      >
        <label className="field">
          Their name
          <input
            required
            maxLength={50}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="For example, Amma"
          />
        </label>
        <label className="field">
          Saved phone number
          <input
            required
            type="tel"
            pattern="[+0-9 ()-]{8,24}"
            maxLength={24}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Include country code"
          />
        </label>
        <label className="field">
          A question you agreed on
          <input
            required
            minLength={8}
            maxLength={160}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="A shared memory, not a password"
          />
        </label>
        <Notice>
          Do not enter the answer. Rotate the question if it becomes known to
          someone else.
        </Notice>
        <label className="check-row">
          <input
            type="checkbox"
            required
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          Save this contact and question in this browser.
        </label>
        <Button
          disabled={
            !consent ||
            !name.trim() ||
            question.trim().length < 8 ||
            !/^\+?[0-9]{8,15}$/.test(phone.replace(/[\s()-]/g, ""))
          }
        >
          Save trusted contact <Check size={20} />
        </Button>
      </form>
    </Modal>
  );
}
function ReportForm({ result, practice, text, dismissed, onSave, onClose }) {
  const [include, setInclude] = useState(false),
    [excerpt, setExcerpt] = useState(redact(text).slice(0, 1500)),
    [reviewed, setReviewed] = useState(false);
  const build = () =>
    createReport(result, {
      practice,
      disposition: dismissed ? "User checked caller" : "Unverified",
      excerpt: include ? excerpt : "",
    });
  return (
    <Modal
      title={practice ? "Prepare a practice draft" : "Prepare a report draft"}
      onClose={onClose}
      wide
    >
      <Notice>
        {practice
          ? "This is a practice report and must not be filed as a real incident."
          : "Review all details before using official reporting channels. This app does not submit reports."}
      </Notice>
      <div className="report-summary">
        <span>
          Risk score <strong>{result.score}/100</strong>
        </span>
        <span>
          Signals <strong>{result.signals.length}</strong>
        </span>
        <span>
          Status <strong>Not submitted</strong>
        </span>
      </div>
      <label className="check-row">
        <input
          type="checkbox"
          checked={include}
          onChange={(e) => {
            setInclude(e.target.checked);
            setReviewed(false);
          }}
        />
        Include a manually reviewed transcript excerpt in the download
      </label>
      {include && (
        <>
          <label className="field">
            Redacted excerpt
            <textarea
              maxLength={1500}
              rows={5}
              value={excerpt}
              onChange={(e) => {
                setExcerpt(e.target.value);
                setReviewed(false);
              }}
            />
          </label>
          <Notice warning>
            Automatic redaction can miss names, addresses and spoken codes.
            Remove identifying details manually. Excerpts are never saved to
            local history.
          </Notice>
          <label className="check-row">
            <input
              type="checkbox"
              checked={reviewed}
              onChange={(e) => setReviewed(e.target.checked)}
            />
            I removed personal details and reviewed this excerpt.
          </label>
        </>
      )}
      <div className="button-row">
        <Button
          disabled={include && !reviewed}
          onClick={() => {
            const r = build();
            downloadJson(
              r,
              `kavach-${practice ? "practice" : "report"}-${r.id.slice(0, 8)}.json`,
            );
            onSave(r);
          }}
        >
          <DownloadSimple size={20} />
          Download JSON draft
        </Button>
        <Button
          secondary
          onClick={() => {
            onSave(
              createReport(result, {
                practice,
                disposition: dismissed ? "User checked caller" : "Unverified",
              }),
            );
          }}
        >
          Save summary only
        </Button>
      </div>
      <p className="fine-print">
        No phone numbers are published. No claim is added to a reputation
        database. This draft is a decision aid, not a legal verdict.
      </p>
    </Modal>
  );
}
function MessageDraft({ contact, practice, onClose, notify }) {
  const message = `${practice ? "PRACTICE ONLY — " : ""}Hi ${contact.name}, I received a call I want to check. Please call me back on my saved number. I have paused any payment. This is a request to verify, not an accusation.`;
  return (
    <Modal title="Review a check-in message" onClose={onClose}>
      <p>
        This is a draft for you to copy and send yourself. Kavach will not
        message anyone.
      </p>
      <textarea
        readOnly
        value={message}
        rows={5}
        aria-label="Check-in message"
      />
      <Button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(message);
            notify("Draft copied. Nothing was sent.");
          } catch {
            notify(
              "Clipboard unavailable. Select and copy the draft manually.",
            );
          }
        }}
      >
        <Copy size={20} />
        Copy draft
      </Button>
    </Modal>
  );
}
