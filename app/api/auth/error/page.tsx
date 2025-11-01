"use client";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = (errorParam: string | null) => {
    switch (errorParam) {
      case "OAuthCallback":
        return "OAuth authentication failed. The token exchange returned a 403 Forbidden error. This usually means there's a configuration issue with your Twitter app.";
      case "Configuration":
        return "There is a problem with the server configuration.";
      case "AccessDenied":
        return "You do not have permission to sign in.";
      case "Verification":
        return "The verification token has expired or has already been used.";
      default:
        return "An error occurred during authentication.";
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
              <svg
                className="h-6 w-6 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
              Authentication Error
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {getErrorMessage(error)}
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              Troubleshooting Steps:
            </h2>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
              <li>Check your Twitter Developer Portal settings</li>
              <li>Verify the callback URL matches exactly</li>
              <li>Ensure OAuth 2.0 is enabled</li>
              <li>Check app type is &quot;Web App, Automated App or Bot&quot;</li>
              <li>Verify client ID and secret are correct</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Link
              href="/"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-center"
            >
              Go Home
            </Link>
            <Link
              href="/"
              className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-center"
            >
              Try Again
            </Link>
          </div>

          {error && (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Error code: {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Loading...</p>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
