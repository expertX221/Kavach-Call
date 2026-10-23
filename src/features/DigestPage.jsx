import { useState } from "react";
import { ArrowRight } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { ArrowClockwise } from "@phosphor-icons/react/dist/csr/ArrowClockwise";
import { BookOpen } from "@phosphor-icons/react/dist/csr/BookOpen";
import { Button, Notice, PageTitle, Empty } from "../components.jsx";
import { localDigest, istWeek } from "../lib/family-score.mjs";
import { explainers, weeklyExplainer } from "../lib/explainers.js";
export default function DigestPage({
  reports,
  intelligence,
  onPractice,
  onReports,
}) {
  const [region, setRegion] = useState("Chennai"),
    [selected, setSelected] = useState(() => weeklyExplainer().id);
  const local = localDigest(reports),
    week = istWeek();
  const current = explainers.find((e) => e.id === selected) || explainers[0];
  const campaigns = intelligence.campaigns.filter(
    (c) =>
      (region === "India" || c.region === region) &&
      +new Date(c.firstSeen) >= +new Date(week.start) &&
      +new Date(c.firstSeen) < +new Date(week.end) &&
      +new Date(c.firstSeen) <= Date.now(),
  );
  const campaignCount =
    intelligence.campaignTotals?.[region] ?? campaigns.length;
  const range = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  });
  const rangeLabel =
    range.format(new Date(week.start)) +
    " – " +
    range.format(new Date(+new Date(week.end) - 1));
  return (
    <div className="page-content">
      <PageTitle
        eyebrow="WEEKLY SCAM DIGEST"
        title="One calm briefing. Better next steps."
        description={`This week, ${rangeLabel} · Monday–Sunday, India time. Counts come from available report data.`}
        action={
          <Button secondary onClick={intelligence.refresh}>
            <ArrowClockwise size={18} />
            Refresh data
          </Button>
        }
      />
      <div className="digest-grid">
        <section className="panel">
          <div className="panel-title">
            <h2>Reviewed community campaigns</h2>
            <label className="region-picker">
              Region
              <select
                aria-label="Digest region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              >
                <option>Chennai</option>
                <option>India</option>
              </select>
            </label>
          </div>
          {intelligence.status === "connected" ? (
            <>
              <div className="digest-count">
                <strong>{campaignCount}</strong>
                <span>
                  new reviewed campaign{campaignCount === 1 ? "" : "s"} in{" "}
                  {region}
                  <br />
                  <small>Not the number of scams happening in the region</small>
                </span>
              </div>
              {campaigns.length ? (
                <div className="campaigns">
                  {campaigns.map((c) => (
                    <article key={c.id}>
                      <span className="small-label">
                        {c.region} · FIRST REVIEWED{" "}
                        {range.format(new Date(c.firstSeen))}
                      </span>
                      <h3>{c.title}</h3>
                      <p>{c.summary}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <p>
                  No reviewed {region} campaigns are present in this week’s
                  database. This does not mean no scams occurred.
                </p>
              )}
            </>
          ) : (
            <Notice>
              {intelligence.status === "loading"
                ? "Loading reviewed report data…"
                : "Community report data is unavailable. No regional count can be concluded."}
            </Notice>
          )}
          <p className="fine-print">
            Only moderated campaign records are counted. No caller numbers or
            transcripts are published.
          </p>
        </section>
        <section className="panel">
          <h2>Your report drafts this week</h2>
          <div className="digest-count">
            <strong>{local.total}</strong>
            <span>
              personal draft{local.total === 1 ? "" : "s"} on this device
              <br />
              <small>Practice drafts are excluded</small>
            </span>
          </div>
          {local.categories.length ? (
            <ul className="digest-categories">
              {local.categories.map((c) => (
                <li key={c.category}>
                  <span>{c.category}</span>
                  <strong>{c.count}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p>
              No personal report drafts for this week. A practice report never
              becomes community evidence.
            </p>
          )}
          <button className="text-button" onClick={onReports}>
            Review local drafts <ArrowRight size={18} />
          </button>
          <p className="fine-print">
            Drafts are user observations, not confirmed fraud. History may last
            only for this visit depending on your settings.
          </p>
        </section>
      </div>
      <section className="panel weekly-explainer">
        <div className="explainer-heading">
          <BookOpen size={30} />
          <div>
            <div className="eyebrow">SCAM-OF-THE-WEEK EXPLAINER</div>
            <h2>Recognize the pattern. Rehearse the response.</h2>
            <p>
              Editorial learning cards rotate weekly. They are not claims about
              this week’s local prevalence.
            </p>
          </div>
        </div>
        <div
          className="explainer-tabs"
          role="tablist"
          aria-label="Scam explainers"
        >
          {explainers.map((e) => (
            <button
              role="tab"
              key={e.id}
              id={"tab-" + e.id}
              aria-selected={current.id === e.id}
              aria-controls="explainer-panel"
              onClick={() => setSelected(e.id)}
            >
              {e.tag}
            </button>
          ))}
        </div>
        <article
          id="explainer-panel"
          role="tabpanel"
          aria-labelledby={"tab-" + current.id}
        >
          <h2>{current.title}</h2>
          <p className="explainer-summary">{current.summary}</p>
          <div className="two-column">
            <div>
              <h3>What to notice</h3>
              <ul>
                {current.signals.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>What to do</h3>
              <ol>
                {current.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </div>
          </div>
          <Button onClick={() => onPractice(current.practiceId)}>
            Practice the response <ArrowRight size={19} />
          </Button>
          <div className="explainer-sources">
            <a
              href="https://cybercrime.gov.in/"
              target="_blank"
              rel="noreferrer"
            >
              Official cybercrime reporting
            </a>
            <a
              href="https://support.google.com/pay/india/answer/7296412?hl=en"
              target="_blank"
              rel="noreferrer"
            >
              How receiving money works in Google Pay
            </a>
          </div>
        </article>
      </section>
    </div>
  );
}
