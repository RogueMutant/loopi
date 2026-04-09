import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { campaign_id, user_id } = body as {
      campaign_id: string;
      user_id?: string;
    };

    if (!campaign_id) {
      return NextResponse.json(
        { error: "campaign_id is required" },
        { status: 400 }
      );
    }

    // Use provided user_id or fallback to anonymous identifier
    const finalUserId = user_id ?? "anonymous";

    const { error } = await supabase.from("saved_campaigns").upsert(
      {
        user_id: finalUserId,
        campaign_id,
      },
      { onConflict: "user_id,campaign_id" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
