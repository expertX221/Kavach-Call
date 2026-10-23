import { readIntelligence } from "../server/intelligence.mjs";
import { lookupRegistration } from "../server/domain.mjs";
export async function GET(request) {
  const url = new URL(request.url);
  if (url.searchParams.has("host")) {
    const result = await lookupRegistration(url.searchParams.get("host"));
    return Response.json(result, {
      status: result.status === "invalid" ? 400 : 200,
      headers: {
        "Cache-Control": "private, max-age=600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
  const result = await readIntelligence();
  return Response.json(result, {
    status: result.status === "connected" ? 200 : 503,
    headers: {
      "Cache-Control":
        result.status === "connected" ? "private, max-age=60" : "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
