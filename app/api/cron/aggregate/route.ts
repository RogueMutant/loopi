import { runAggregator } from "@/lib/aggregator";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Protect with a shared secret to prevent unauthorized triggers
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runAggregator();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
