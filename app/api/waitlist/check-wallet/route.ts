import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "Address parameter is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Check if wallet address already exists
    const { data: existing, error } = await supabase
      .from("waitlist_entries")
      .select("id")
      .eq("wallet_address", address)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Supabase error:", error);
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({ exists: !!existing });
  } catch (error) {
    console.error("Check wallet API error:", error);
    return NextResponse.json({ exists: false });
  }
}

