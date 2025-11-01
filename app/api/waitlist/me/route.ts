import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getSupabaseClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ entry: null });
    }

    const supabase = getSupabaseClient();
    const userEmail = session.user.email || null;
    const userId = userEmail; // Use email as user identifier

    if (!userId) {
      return NextResponse.json({ entry: null });
    }

    // Check if user already joined
    const { data: entry, error } = await supabase
      .from("waitlist_entries")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Supabase error:", error);
      return NextResponse.json({ entry: null });
    }

    return NextResponse.json({ entry: entry || null });
  } catch (error) {
    console.error("Waitlist me API error:", error);
    return NextResponse.json({ entry: null });
  }
}

