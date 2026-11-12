import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleAnalyzeRequest } from "../shared/handler.js";

// Vercel serverless function: POST /api/analyze
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      ok: false,
      error: { code: "method_not_allowed", message: "Use POST." },
    });
  }

  const result = await handleAnalyzeRequest(req.body);
  return res.status(result.status).json(result.body);
}
