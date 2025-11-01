"use client";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
            Welcome to AXIOS
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400">
            Join the future of DeFi lending
          </p>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-500">
            Connect your wallet and be part of our exclusive waitlist
          </p>
        </div>

        <Link
          href="/waitlist"
          className="inline-block px-8 py-4 bg-gradient-to-r from-orange-500 via-orange-400 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:via-orange-500 hover:to-amber-600 transition-all font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Join the Waitlist
        </Link>

        <div className="pt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>Sign in with Twitter when you join to secure your spot</p>
        </div>
      </div>
    </div>
  );
}
