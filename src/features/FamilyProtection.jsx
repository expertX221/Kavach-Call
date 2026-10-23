import { CheckCircle } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { Circle } from "@phosphor-icons/react/dist/csr/Circle";
import { ShieldCheck } from "@phosphor-icons/react/dist/csr/ShieldCheck";
import { protectionScore } from "../lib/family-score.mjs";
import { Button } from "../components.jsx";
export default function FamilyProtection({
  contacts,
  progress,
  plan,
  onPlan,
  onPractice,
  onAdd,
}) {
  const result = protectionScore(contacts, progress, plan);
  return (
    <section
      className="panel protection-panel"
      aria-labelledby="protection-title"
    >
      <div className="protection-summary">
        <ShieldCheck size={35} />
        <div>
          <div className="eyebrow">FAMILY PROTECTION SCORE</div>
          <h2 id="protection-title">A few habits. A stronger setup.</h2>
          <p>
            Each completed setup step adds 25 points. This is a readiness
            checklist, not a guarantee or probability of safety.
          </p>
        </div>
        <div className="readiness-score">
          <strong>{result.score}</strong>
          <span>/ 100</span>
        </div>
      </div>
      <progress
        className="readiness-progress"
        value={result.score}
        max={100}
        aria-label="Family protection setup score"
      />
      <div className="readiness-grid">
        {result.checks.map((c) => (
          <div className={`readiness-item ${c.done ? "done" : ""}`} key={c.id}>
            {c.done ? (
              <CheckCircle size={25} weight="fill" />
            ) : (
              <Circle size={25} />
            )}
            <div>
              <strong>{c.title}</strong>
              <p>{c.detail}</p>
            </div>
          </div>
        ))}
      </div>
      <label className="check-row">
        <input
          type="checkbox"
          checked={plan.callbackPlan === true}
          onChange={(e) => onPlan({ callbackPlan: e.target.checked })}
        />
        We agreed to end unusual money-request calls and call back on a saved
        number.
      </label>
      <div className="button-row">
        {!result.checks[0].done && (
          <Button secondary onClick={onAdd}>
            Set up a trusted contact
          </Button>
        )}
        {!result.checks[2].done && (
          <Button secondary onClick={onPractice}>
            Complete a practice lesson
          </Button>
        )}
      </div>
      <p className="fine-print">
        Setup and practice progress are saved in this browser. They do not prove
        anyone’s identity.
      </p>
    </section>
  );
}
