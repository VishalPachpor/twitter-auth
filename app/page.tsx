"use client";
import { useSession, signOut, signIn } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";

interface StoredProfileData {
  username: string;
  walletAddress: string;
  name: string;
  image: string;
  email?: string;
  submittedAt: Date;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [editedUsername, setEditedUsername] = useState("");
  const [savedUsername, setSavedUsername] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [storedProfile, setStoredProfile] = useState<StoredProfileData | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Get the current username - prioritize saved, then session, then empty
  const currentUsername = savedUsername || session?.user?.username || "";

  const handleEditClick = () => {
    setEditedUsername(currentUsername);
    setIsEditing(true);
  };

  const handleSaveClick = () => {
    if (editedUsername.trim()) {
      setSavedUsername(editedUsername.trim());
      console.log("Updated username:", editedUsername.trim());
    }
    setIsEditing(false);
    // Here you can add logic to save the username to your backend
  };

  const handleCancelClick = () => {
    setEditedUsername("");
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSaveClick();
    } else if (e.key === "Escape") {
      handleCancelClick();
    }
  };

  const handleSubmit = async () => {
    if (!walletAddress.trim() || !session?.user) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const profileData = {
      username: currentUsername,
      walletAddress: walletAddress.trim(),
      name: session.user.name || "",
      image: session.user.image?.replace("_normal", "_400x400") || "",
      email: session.user.email || undefined,
    };

    try {
      const response = await fetch("/api/profile/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save profile");
      }

      // Store profile data locally for display
      const storedData: StoredProfileData = {
        ...profileData,
        submittedAt: new Date(),
      };
      setStoredProfile(storedData);

      // Clear the wallet address input after successful submission
      setWalletAddress("");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setSubmitError(errorMessage);
      console.error("Error submitting profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Twitter Authentication
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in with Twitter to view your profile
          </p>
          <button
            onClick={() => signIn("twitter")}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Sign in with Twitter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900 gap-6">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Profile Card
            </h1>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Sign out
            </button>
          </div>

          {/* Profile Picture */}
          <div className="flex justify-center">
            {session.user?.image ? (
              <div className="relative">
                <Image
                  src={session.user.image.replace("_normal", "_400x400")}
                  alt="Profile Picture"
                  width={120}
                  height={120}
                  className="rounded-full border-4 border-blue-500 dark:border-blue-400"
                />
              </div>
            ) : (
              <div className="w-30 h-30 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                <span className="text-4xl text-gray-500 dark:text-gray-400">
                  ?
                </span>
              </div>
            )}
          </div>

          {/* Username Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Username
            </label>
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editedUsername}
                  onChange={(e) => setEditedUsername(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white outline-none"
                  placeholder="Enter username"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveClick}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelClick}
                    className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                  @{currentUsername || "No username"}
                </p>
                <button
                  onClick={handleEditClick}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  aria-label="Edit username"
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* Wallet Address Section */}
          <div className="space-y-2">
            <label
              htmlFor="wallet-address"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Wallet Address
            </label>
            <input
              id="wallet-address"
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white outline-none"
              placeholder="Enter wallet address"
              aria-label="Wallet address input"
            />
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="px-4 py-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-sm">
              {submitError}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!walletAddress.trim() || isSubmitting}
            className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400 flex items-center justify-center gap-2"
            aria-label="Submit wallet address"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </button>

          {/* Welcome Message */}
          {session.user?.name && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-center text-gray-600 dark:text-gray-400">
                Welcome,{" "}
                <span className="font-semibold">{session.user.name}</span>!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stored Profile Card */}
      {storedProfile && (
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6 border-2 border-green-500 dark:border-green-400">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Stored Profile
              </h2>
              <span className="px-3 py-1 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                Submitted
              </span>
            </div>

            {/* Profile Picture */}
            <div className="flex justify-center">
              {storedProfile.image ? (
                <div className="relative">
                  <Image
                    src={storedProfile.image}
                    alt="Profile Picture"
                    width={120}
                    height={120}
                    className="rounded-full border-4 border-green-500 dark:border-green-400"
                  />
                </div>
              ) : (
                <div className="w-30 h-30 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <span className="text-4xl text-gray-500 dark:text-gray-400">
                    ?
                  </span>
                </div>
              )}
            </div>

            {/* Profile Details */}
            <div className="space-y-4">
              {/* Name */}
              {storedProfile.name && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Name
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {storedProfile.name}
                  </p>
                </div>
              )}

              {/* Username */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Username
                </label>
                <p className="text-lg text-gray-900 dark:text-white">
                  @{storedProfile.username || "No username"}
                </p>
              </div>

              {/* Email */}
              {storedProfile.email && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Email
                  </label>
                  <p className="text-lg text-gray-900 dark:text-white break-all">
                    {storedProfile.email}
                  </p>
                </div>
              )}

              {/* Wallet Address */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Wallet Address
                </label>
                <p className="text-lg font-mono text-gray-900 dark:text-white break-all bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                  {storedProfile.walletAddress}
                </p>
              </div>

              {/* Submitted At */}
              <div className="space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Submitted At
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {storedProfile.submittedAt.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
