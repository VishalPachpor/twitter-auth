import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getSupabaseClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, walletAddress, avatar, avatarType, avatarSeed, avatarStyle, profileId } = body;

    if (!name || !walletAddress || !avatar || !profileId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const userEmail = session.user.email || null;
    const userId = userEmail; // Use email as user identifier

    if (!userId) {
      return NextResponse.json(
        { error: "Unable to identify user. Please sign in again." },
        { status: 400 }
      );
    }

    // FIRST: Check if Twitter ID (email) already exists - this is the primary constraint
    const { data: existingUser, error: userError } = await supabase
      .from("waitlist_entries")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (userError && userError.code !== "PGRST116") {
      console.error("Error checking user:", userError);
      return NextResponse.json(
        { error: "Error checking user status" },
        { status: 500 }
      );
    }

    if (existingUser) {
      // User already joined - check if they're trying to use the same wallet
      if (existingUser.wallet_address === walletAddress) {
        // Same wallet address - allow if same profile, otherwise it's an update attempt
        if (existingUser.profile_id === profileId) {
          // Same profile and wallet - return existing entry
          return NextResponse.json({
            id: existingUser.id,
            name: existingUser.name,
            wallet_address: existingUser.wallet_address,
            avatar: existingUser.avatar,
            avatar_type: existingUser.avatar_type,
            avatar_seed: existingUser.avatar_seed,
            avatar_style: existingUser.avatar_style,
            profile_id: existingUser.profile_id,
            created_at: existingUser.created_at,
          });
        } else {
          // Different profile but same wallet - this is an update attempt, not allowed
          return NextResponse.json(
            { error: "You have already joined the waitlist with this Twitter account and wallet address" },
            { status: 400 }
          );
        }
      } else {
        // Different wallet address - NOT ALLOWED
        return NextResponse.json(
          { error: "You have already joined the waitlist with this Twitter account using a different wallet address. Each Twitter account can only be linked to one wallet address." },
          { status: 400 }
        );
      }
    }

    // SECOND: Check if wallet address already exists (by another user)
    const { data: existingWallet, error: walletError } = await supabase
      .from("waitlist_entries")
      .select("*")
      .eq("wallet_address", walletAddress)
      .maybeSingle();

    if (walletError && walletError.code !== "PGRST116") {
      console.error("Error checking wallet:", walletError);
      return NextResponse.json(
        { error: "Error checking wallet address" },
        { status: 500 }
      );
    }

    if (existingWallet) {
      // Wallet already used by someone else
      return NextResponse.json(
        { error: "This wallet address has already been used by another account" },
        { status: 400 }
      );
    }

    // Check if profile position is taken
    const { data: profileTaken } = await supabase
      .from("waitlist_entries")
      .select("*")
      .eq("profile_id", profileId)
      .single();

    if (profileTaken) {
      return NextResponse.json(
        { error: "This position is already taken" },
        { status: 400 }
      );
    }

    // Create new entry
    const { data, error } = await supabase
      .from("waitlist_entries")
      .insert({
        name,
        wallet_address: walletAddress,
        avatar,
        avatar_type: avatarType,
        avatar_seed: avatarSeed || null,
        avatar_style: avatarStyle || null,
        profile_id: profileId,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      return NextResponse.json(
        { 
          error: "Failed to create waitlist entry", 
          details: error.message,
          code: error.code,
          hint: error.hint 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Waitlist API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

