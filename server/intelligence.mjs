import pg from "pg";
import { attachDatabasePool } from "@vercel/functions";
import { istWeek } from "../src/lib/family-score.mjs";
let pool;
function database() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) return null;
  if (!pool) {
    pool = new pg.Pool({
      connectionString,
      max: 3,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
      statement_timeout: 5000,
    });
    attachDatabasePool(pool);
    pool.on("error", () =>
      console.error("Database pool connection unavailable"),
    );
  }
  return pool;
}
export async function readIntelligence() {
  const db = database();
  if (!db)
    return {
      status: "unavailable",
      reason: "not-configured",
      reputation: [],
      campaigns: [],
    };
  const week = istWeek();
  try {
    const [reputation, campaigns, totals] = await Promise.all([
      db.query(
        "SELECT hostname, report_count, updated_at FROM kavach.reputation WHERE reviewed = TRUE AND report_count > 0 ORDER BY updated_at DESC LIMIT 500",
      ),
      db.query(
        "SELECT id, title, summary, region, first_seen FROM kavach.campaigns WHERE reviewed = TRUE AND first_seen >= $1 AND first_seen < $2 AND first_seen <= NOW() ORDER BY first_seen DESC LIMIT 100",
        [week.start, week.end],
      ),
      db.query(
        "SELECT region, COUNT(*)::int AS count FROM kavach.campaigns WHERE reviewed = TRUE AND first_seen >= $1 AND first_seen < $2 AND first_seen <= NOW() GROUP BY region",
        [week.start, week.end],
      ),
    ]);
    return {
      status: "connected",
      updatedAt: new Date().toISOString(),
      week,
      campaignTotals: {
        Chennai: totals.rows
          .filter((r) => r.region === "Chennai")
          .reduce((n, r) => n + r.count, 0),
        India: totals.rows.reduce((n, r) => n + r.count, 0),
      },
      reputation: reputation.rows.map((r) => ({
        hostname: r.hostname,
        reportCount: r.report_count,
        updatedAt: r.updated_at,
      })),
      campaigns: campaigns.rows.map((r) => ({
        id: r.id,
        title: r.title,
        summary: r.summary,
        region: r.region,
        firstSeen: r.first_seen,
      })),
      reputationWindow:
        "Up to 500 most recently reviewed hostnames; an absent match does not establish safety.",
    };
  } catch (error) {
    console.error("Intelligence data unavailable", {
      code: /^[A-Z0-9]{5}$/.test(error.code || "")
        ? error.code
        : "connection-error",
    });
    return {
      status: "unavailable",
      reason: "database-unavailable",
      reputation: [],
      campaigns: [],
    };
  }
}
