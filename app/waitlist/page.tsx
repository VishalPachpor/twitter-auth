"use client";
import { Suspense } from "react";
import GlobeCanvas from "@/components/globe/GlobeCanvas";

function WaitlistContent() {
  return <GlobeCanvas />;
}

export default function WaitlistPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    }>
      <WaitlistContent />
    </Suspense>
  );
}

