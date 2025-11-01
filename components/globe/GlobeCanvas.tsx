"use client";

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useThreeGlobe } from "@/components/globe/useThreeGlobe";
import WaitlistPopup from "@/components/waitlist/waitlist-popup";
import waitlistService, { WaitlistEntry } from "@/lib/waitlist-service";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { MAX_SPOTS } from "@/components/globe/constants";

const GlobeCanvas: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [isWaitlistPopupOpen, setWaitlistPopupOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(
    null
  );
  const [waitlistError, setWaitlistError] = useState<string | null>(null);
  const [waitlistEntries, setWaitlistEntries] = useState<
    Map<number, WaitlistEntry>
  >(new Map());
  const [alreadyJoined, setAlreadyJoined] = useState<boolean>(false);
  const [isGlobeVisible, setIsGlobeVisible] = useState(false);
  const [hasCheckedUserStatus, setHasCheckedUserStatus] = useState(false);

  // Use refs to store latest searchParams to avoid recreating callbacks
  const searchParamsRef = useRef(searchParams);
  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  const getEntryByProfileId = useMemo(
    () => (id: number) => waitlistEntries.get(id),
    [waitlistEntries]
  );

  // Open popup and update URL - stable callback using ref
  const openPopup = useCallback((profileId: number) => {
    setSelectedProfileId(profileId);
    setWaitlistPopupOpen(true);
    setWaitlistError(null);
    // Update URL with query parameter
    const params = new URLSearchParams(searchParamsRef.current.toString());
    params.set("join", "true");
    if (profileId) {
      params.set("spot", profileId.toString());
    }
    router.replace(`/waitlist?${params.toString()}`, { scroll: false });
  }, [router]);

  // Close popup and update URL - stable callback using ref
  const closePopup = useCallback(() => {
    setWaitlistPopupOpen(false);
    setSelectedProfileId(null);
    setWaitlistError(null);
    // Remove query parameters
    const params = new URLSearchParams(searchParamsRef.current.toString());
    params.delete("join");
    params.delete("spot");
    const newUrl = params.toString() 
      ? `/waitlist?${params.toString()}`
      : "/waitlist";
    router.replace(newUrl, { scroll: false });
  }, [router]);

  const { mountRef, loading, loadingProgress, tooltip, applyEntryToGlobe } =
    useThreeGlobe(waitlistEntries, {
      onEmptySpotClick: (profileId) => {
        if (alreadyJoined) {
          setWaitlistError("You have already joined the waitlist.");
          return;
        }
        openPopup(profileId);
      },
      getEntryByProfileId,
      enabled: isGlobeVisible, // Only initialize when visible
    });

  const handleWaitlistSubmit = async (entryData: {
    name: string;
    walletAddress: string;
    avatar: string;
    avatarType: "upload" | "avatar_seed";
    avatarSeed?: string;
    avatarStyle?: string;
  }) => {
    try {
      setWaitlistError(null);
      if (selectedProfileId === null) throw new Error("No profile selected");

      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...entryData, profileId: selectedProfileId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorMsg = data?.error || `Request failed (${res.status})`;
        const details = data?.details ? `: ${data.details}` : "";
        const hint = data?.hint ? ` (${data.hint})` : "";
        throw new Error(`${errorMsg}${details}${hint}`);
      }
      const data = await res.json();

      const entry: WaitlistEntry = {
        id: data.id,
        name: data.name,
        walletAddress: data.wallet_address,
        avatar: data.avatar,
        avatarType: data.avatar_type,
        avatarSeed: data.avatar_seed,
        avatarStyle: data.avatar_style,
        profileId: data.profile_id,
        timestamp: new Date(data.created_at ?? Date.now()).getTime(),
      };

      // Update waitlist entries state first
      setWaitlistEntries((prev) => {
        const newEntries = new Map(prev);
        newEntries.set(entry.profileId, entry);
        return newEntries;
      });

      // Close popup immediately after successful submission
      closePopup();

      // Clear any error messages
      setWaitlistError(null);

      // Apply entry to globe - use requestAnimationFrame to ensure meshes are ready
      // Delay slightly to ensure state update is processed
      setTimeout(() => {
        requestAnimationFrame(() => {
          applyEntryToGlobe(entry);
        });
      }, 100);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to join waitlist";
      setWaitlistError(errorMessage);
      throw error;
    }
  };

  useEffect(() => {
    const loadEntries = async () => {
      try {
        // Check cache first
        const cacheKey = "waitlist_entries_cache";
        const cachedData = localStorage.getItem(cacheKey);
        const cacheTimestamp = localStorage.getItem(cacheKey + "_timestamp");

        // Use cached data if less than 5 minutes old
        if (cachedData && cacheTimestamp) {
          const age = Date.now() - parseInt(cacheTimestamp);
          if (age < 5 * 60 * 1000) {
            // 5 minutes
            const entries = JSON.parse(cachedData);
            const entriesMap = new Map<number, WaitlistEntry>();
            entries.forEach((entry: WaitlistEntry) => {
              entriesMap.set(entry.profileId, entry);
            });
            setWaitlistEntries(entriesMap);
            setIsGlobeVisible(true);
            return;
          }
        }

        // Delay loading to reduce initial data transfer
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const allEntries = await waitlistService.getAllEntries();
        const entriesMap = new Map<number, WaitlistEntry>();
        allEntries.forEach((entry) => entriesMap.set(entry.profileId, entry));
        setWaitlistEntries(entriesMap);

        // Cache the data
        localStorage.setItem(cacheKey, JSON.stringify(allEntries));
        localStorage.setItem(cacheKey + "_timestamp", Date.now().toString());

        setIsGlobeVisible(true);

        // Check current user status
        const res = await fetch("/api/waitlist/me", { cache: "no-store" });
        if (res.ok) {
          const { entry } = await res.json();
          setAlreadyJoined(!!entry);
        }
        setHasCheckedUserStatus(true);
      } catch (error) {
        // Silently handle error and show globe anyway
        setIsGlobeVisible(true); // Show globe even if data loading fails
        setHasCheckedUserStatus(true);
      }
    };
    loadEntries();
  }, []);

  // Extract URL params for stable dependencies (use empty string instead of null)
  const joinParam = searchParams.get("join") || "";
  const spotParam = searchParams.get("spot") || "";

  // Sync popup state with URL parameters (only on mount or URL change)
  useEffect(() => {
    if (joinParam === "true" && spotParam) {
      const spotId = parseInt(spotParam, 10);
      if (!isNaN(spotId) && spotId > 0 && spotId <= MAX_SPOTS) {
        // Only update if different from current state
        if (!isWaitlistPopupOpen || selectedProfileId !== spotId) {
          setSelectedProfileId(spotId);
          setWaitlistPopupOpen(true);
          setWaitlistError(null);
        }
      }
    } else if (joinParam !== "true" && isWaitlistPopupOpen) {
      // If URL doesn't have join param but popup is open, close it
      setWaitlistPopupOpen(false);
      setSelectedProfileId(null);
      setWaitlistError(null);
    }
  }, [joinParam, spotParam, isWaitlistPopupOpen, selectedProfileId]); // Use extracted values instead of searchParams object

  // Store callbacks in refs for stable access
  const openPopupRef = useRef(openPopup);
  const closePopupRef = useRef(closePopup);
  useEffect(() => {
    openPopupRef.current = openPopup;
    closePopupRef.current = closePopup;
  }, [openPopup, closePopup]);

  // Auto-open popup for authenticated users who haven't joined yet
  useEffect(() => {
    if (
      isAuthenticated &&
      !isAuthLoading &&
      hasCheckedUserStatus &&
      !alreadyJoined &&
      !isWaitlistPopupOpen &&
      !loading &&
      isGlobeVisible &&
      waitlistEntries.size > 0 &&
      joinParam !== "true" // Don't auto-open if URL already has join param
    ) {
      // Find first available spot
      let chosen: number | null = null;
      for (let i = 1; i <= MAX_SPOTS; i++) {
        if (!waitlistEntries.has(i)) {
          chosen = i;
          break;
        }
      }
      if (chosen) {
        openPopupRef.current(chosen);
      }
    } else if (
      isAuthenticated &&
      !isAuthLoading &&
      hasCheckedUserStatus &&
      alreadyJoined &&
      joinParam === "true"
    ) {
      // If user already joined but URL has join param, close popup and show message
      closePopupRef.current();
      setWaitlistError("You have already joined the waitlist with this Twitter account.");
    }
  }, [
    isAuthenticated,
    isAuthLoading,
    hasCheckedUserStatus,
    alreadyJoined,
    isWaitlistPopupOpen,
    loading,
    isGlobeVisible,
    waitlistEntries.size, // Use size instead of whole object
    joinParam, // Use extracted value instead of searchParams object
  ]);

  // Store waitlistEntries in ref for stable access
  const waitlistEntriesRef = useRef(waitlistEntries);
  useEffect(() => {
    waitlistEntriesRef.current = waitlistEntries;
  }, [waitlistEntries]);

  // Apply existing entries once the scene is mounted and entries are present
  useEffect(() => {
    if (waitlistEntries.size === 0) return;
    // Defer to next frame to ensure meshes exist
    const id = requestAnimationFrame(() => {
      waitlistEntriesRef.current.forEach((entry) => applyEntryToGlobe(entry));
    });
    return () => cancelAnimationFrame(id);
  }, [waitlistEntries.size]); // Removed applyEntryToGlobe since it's stable from useCallback

  return (
    <div className="relative w-screen h-screen overflow-hidden font-sans">
      {!isGlobeVisible && (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-[1000] px-4">
          <div className="text-white text-center">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-lg">Loading waitlist...</p>
          </div>
        </div>
      )}

      <div
        ref={mountRef}
        className="w-full h-full cursor-grab globe-container touch-optimized"
        style={{ userSelect: "none" }}
      />

      {loading && (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-[1000] px-4">
          <div className="w-full max-w-sm md:max-w-md mb-6">
            <div className="relative">
              <div className="w-full h-1.5 md:h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <div className="flex justify-center mt-3 md:mt-4">
                <span className="text-white text-xs md:text-sm font-medium">
                  {Math.round(loadingProgress)}% COMPLETE
                </span>
              </div>
            </div>
          </div>
          <div className="flex space-x-1">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-orange-500 rounded-full animate-pulse" />
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-orange-500 rounded-full animate-pulse delay-75" />
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-orange-500 rounded-full animate-pulse delay-150" />
          </div>
        </div>
      )}

      <div
        className="absolute bg-black/90 text-white px-3 py-2 rounded-md text-xs pointer-events-none z-[1000] border border-orange-500/50 transition-opacity duration-300"
        style={{
          left: `${tooltip.x}px`,
          top: `${tooltip.y}px`,
          opacity: tooltip.visible ? 1 : 0,
        }}
        dangerouslySetInnerHTML={{ __html: tooltip.content }}
      />

      <WaitlistPopup
        isOpen={isWaitlistPopupOpen}
        onClose={closePopup}
        onSubmit={handleWaitlistSubmit}
        profileId={selectedProfileId}
      />

      {waitlistError && (
        <div className="fixed top-4 right-4 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg z-[10000]">
          {waitlistError}
        </div>
      )}

      {/* Join Waitlist Button - bottom center with glowing border (shows only after loading) */}
      {!loading && (
        <div className="absolute inset-x-0 bottom-20 md:bottom-8 z-[1100] flex justify-center px-4 pointer-events-none">
          <div className="relative group pointer-events-auto">
            <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-amber-500 blur opacity-70 group-hover:opacity-100 transition duration-300" />
            <Button
              onClick={() => {
                if (alreadyJoined) {
                  setWaitlistError("You have already joined the waitlist.");
                  return;
                }
                // Use dynamic MAX_SPOTS from constants (respects NEXT_PUBLIC_WAITLIST_MAX_SPOTS)
                // Pick the first available spot from 1..MAX_SPOTS
                let chosen: number | null = null;
                for (let i = 1; i <= MAX_SPOTS; i++) {
                  if (!waitlistEntries.has(i)) {
                    chosen = i;
                    break;
                  }
                }
                if (!chosen) {
                  setWaitlistError("No available spots at the moment.");
                  return;
                }
                openPopup(chosen);
              }}
              className="relative bg-black/70 hover:bg-black/60 text-white border border-orange-500/50 px-6 py-3 h-10 md:h-11 rounded-full shadow-[0_0_20px_rgba(249,115,22,0.3)] text-base md:text-lg font-medium min-w-32"
              size="default"
            >
              {alreadyJoined ? "Already Joined" : "Join waitlist"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobeCanvas;
