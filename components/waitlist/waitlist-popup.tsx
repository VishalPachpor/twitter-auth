"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  validateWalletAddress,
  getAddressErrorMessage,
  getAddressPlaceholder,
  getAddressHelpText,
} from "@/lib/address-validation";
// Avatar is sourced from Twitter profile after sign-in

interface WaitlistFormData {
  name: string;
  walletAddress: string;
  avatar: string;
  avatarType: "upload" | "avatar_seed";
  avatarSeed?: string;
  avatarStyle?: string;
}

interface WaitlistPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (entry: WaitlistFormData) => Promise<void>;
  profileId: number | null;
}

const WaitlistPopup: React.FC<WaitlistPopupProps> = ({
  isOpen,
  onClose,
  onSubmit,
  profileId,
}) => {
  const [name, setName] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ name?: string; wallet?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    user,
    username,
    login,
  } = useAuth();
  const [prefilledFromTwitter, setPrefilledFromTwitter] = useState(false);

  // Disable submit until all required inputs are valid
  const canSubmit = (() => {
    const nameOk = name.trim().length > 0;
    const walletValidation = validateWalletAddress(walletAddress);
    const walletOk = walletValidation.isValid;
    const authOk = isAuthenticated; // Only require authentication; avatar may be DiceBear
    return nameOk && walletOk && authOk;
  })();

  // Remove random avatar generation - only Twitter avatar is used

  // If authenticated, prefill name and avatar from Twitter once per open
  useEffect(() => {
    if (!isOpen) return;
    if (isAuthenticated && user && !prefilledFromTwitter) {
      const handle = username ? `@${username}` : user.name || "";
      if (!name) setName(handle);
      if (user.image) setUploadedImage(user.image);
      setPrefilledFromTwitter(true);
    }
  }, [isOpen, isAuthenticated, user, username]);

  // Check if user already joined when popup opens
  useEffect(() => {
    if (!isOpen || !isAuthenticated || isAuthLoading) return;

    const checkUserStatus = async () => {
      try {
        const res = await fetch("/api/waitlist/me", { cache: "no-store" });
        if (res.ok) {
          const { entry } = await res.json();
          if (entry) {
            setErrors({ name: "You have already joined the waitlist with this Twitter account" });
          }
        }
      } catch (error) {
        // Silently handle error
      }
    };

    checkUserStatus();
  }, [isOpen, isAuthenticated, isAuthLoading]);

  // Check if wallet address is already used
  const checkWalletAddress = async (address: string) => {
    if (!address.trim()) return null;
    
    try {
      const validation = validateWalletAddress(address);
      if (!validation.isValid) return null;

      const res = await fetch(`/api/waitlist/check-wallet?address=${encodeURIComponent(validation.normalizedAddress)}`, {
        cache: "no-store",
      });
      
      if (res.ok) {
        const { exists } = await res.json();
        if (exists) {
          return "This wallet address has already been used";
        }
      }
    } catch (error) {
      // Silently handle error
    }
    return null;
  };

  const applyTwitterProfile = () => {
    if (user) {
      const handle = username ? `@${username}` : user.name || "";
      setName(handle);
      if (user.image) setUploadedImage(user.image);
      setPrefilledFromTwitter(true);
    }
  };

  // Removed random avatar style/options logic

  // Reset form when popup closes
  useEffect(() => {
    if (!isOpen) {
      setName("");
      setWalletAddress("");
      setUploadedImage(null);
      setErrors({});
      setPrefilledFromTwitter(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    onClose();
  };

  const validateForm = () => {
    const newErrors: { name?: string; wallet?: string } = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    const walletValidation = validateWalletAddress(walletAddress);
    if (!walletValidation.isValid) {
      newErrors.wallet = getAddressErrorMessage(walletAddress);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (!isAuthenticated) {
      setErrors({ name: "Please sign in with X to continue" });
      return;
    }

    // Check if user already joined
    try {
      const res = await fetch("/api/waitlist/me", { cache: "no-store" });
      if (res.ok) {
        const { entry } = await res.json();
        if (entry) {
          // Check if they're trying to use a different wallet address
          const walletValidation = validateWalletAddress(walletAddress);
          if (entry.wallet_address !== walletValidation.normalizedAddress) {
            setErrors({ 
              wallet: "You have already joined with a different wallet address. Each Twitter account can only be linked to one wallet address." 
            });
            setIsSubmitting(false);
            return;
          }
          setErrors({ name: "You have already joined the waitlist with this Twitter account" });
          setIsSubmitting(false);
          return;
        }
      }
    } catch (error) {
      // Continue with submission if check fails
    }

    setIsSubmitting(true);

    try {
      const walletValidation = validateWalletAddress(walletAddress);
      
      // Check wallet address one more time before submission
      const walletError = await checkWalletAddress(walletAddress);
      if (walletError) {
        setErrors({ wallet: walletError });
        setIsSubmitting(false);
        return;
      }

      // If user has a Twitter image, use it as upload; otherwise assign DiceBear
      let entry: WaitlistFormData;
      if (uploadedImage) {
        entry = {
          name: name.trim(),
          walletAddress: walletValidation.normalizedAddress,
          avatar: uploadedImage,
          avatarType: "upload",
        };
      } else {
        const seed =
          (profileId ?? 0) > 0
            ? String(profileId)
            : walletValidation.normalizedAddress;
        entry = {
          name: name.trim(),
          walletAddress: walletValidation.normalizedAddress,
          avatar: seed, // store seed as avatar string (non-empty)
          avatarType: "avatar_seed",
          avatarSeed: seed,
          avatarStyle: "adventurer",
        };
      }

      await onSubmit(entry);

      // Reset form
      setName("");
      setWalletAddress("");
      setUploadedImage(null);
      setErrors({});
    } catch (error) {
      // Provide user feedback for errors
      const errorMessage =
        error instanceof Error ? error.message : "Failed to join waitlist";
      
      // Check for specific error messages
      if (errorMessage.includes("already joined") || errorMessage.includes("Twitter account")) {
        setErrors({ name: "You have already joined the waitlist with this Twitter account" });
      } else if (errorMessage.includes("wallet address") || errorMessage.includes("already been used")) {
        setErrors({ wallet: "This wallet address has already been used" });
      } else {
        setErrors({ name: errorMessage });
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  // Removed manual image upload handlers

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleClose();
      }
    }}>
      <DialogContent 
        className="sm:max-w-md w-[90vw] max-h-[90vh] sm:max-h-[85vh] overflow-hidden bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-lg sm:rounded-xl [&>button]:text-white/70 [&>button]:hover:text-white [&>button]:hover:bg-white/10"
      >
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center">
            Join the Waitlist
          </DialogTitle>
          <DialogDescription className="text-center text-white/70 text-sm sm:text-base">
            Be part of the future of DeFi lending
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 overflow-hidden smooth-scroll scrollbar-hide">
          {/* Twitter Auth / Profile Section */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-2 flex items-center justify-between">
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user.image || undefined}
                      alt={user.name || ""}
                    />
                    <AvatarFallback>
                      {(user.name || "U").slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.name}</span>
                    {username && (
                      <span className="text-xs text-white/70">@{username}</span>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={applyTwitterProfile}
                  className="text-white/70 border-white/30 hover:bg-white/20 hover:text-white transition-all"
                >
                  Use profile
                </Button>
              </>
            ) : (
              <div className="w-full flex items-center justify-between gap-2">
                <span className="text-sm text-white/80">Connect X handle</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={login}
                  disabled={isAuthLoading}
                  className="text-white/70 border-white/30 hover:bg-white/20 hover:text-white transition-all"
                >
                  {isAuthLoading ? "Signing in..." : "Link your X profile"}
                </Button>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={`bg-white/10 border-white/20 text-white placeholder-white/50 backdrop-blur-sm focus-visible:border-orange-500 focus-visible:ring-orange-500 focus:border-orange-500 focus:ring-orange-500 focus:bg-white/20 transition-all focus-visible:ring-2 focus:ring-2 focus-visible:ring-offset-0 focus:ring-offset-0 ${
                  errors.name ? "border-red-400 focus-visible:border-orange-500 focus-visible:ring-orange-500 focus:border-orange-500 focus:ring-orange-500" : ""
                }`}
              />
              {errors.name && (
                <p className="text-red-400 text-sm">{errors.name}</p>
              )}
            </div>

            {/* Wallet Address Field */}
            <div className="space-y-2">
              <Label htmlFor="wallet">Wallet Address</Label>
              <Input
                id="wallet"
                type="text"
                placeholder={getAddressPlaceholder()}
                value={walletAddress}
                onChange={async (e) => {
                  const newAddress = e.target.value;
                  setWalletAddress(newAddress);
                  // Clear wallet error when user types
                  if (errors.wallet) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.wallet;
                      return newErrors;
                    });
                  }
                  // Check wallet address after a short delay
                  setTimeout(async () => {
                    // Use the current value from the input to avoid stale closure
                    const currentValue = e.target.value;
                    if (currentValue === newAddress && currentValue.trim()) {
                      const walletError = await checkWalletAddress(currentValue);
                      if (walletError) {
                        setErrors((prev) => ({ ...prev, wallet: walletError }));
                      }
                    }
                  }, 500);
                }}
                onBlur={async () => {
                  const walletError = await checkWalletAddress(walletAddress);
                  if (walletError) {
                    setErrors((prev) => ({ ...prev, wallet: walletError }));
                  }
                }}
                required
                className={`bg-white/10 border-white/20 text-white placeholder-white/50 backdrop-blur-sm focus-visible:border-orange-500 focus-visible:ring-orange-500 focus:border-orange-500 focus:ring-orange-500 focus:bg-white/20 transition-all font-mono text-sm focus-visible:ring-2 focus:ring-2 focus-visible:ring-offset-0 focus:ring-offset-0 ${
                  errors.wallet ? "border-red-400 focus-visible:border-orange-500 focus-visible:ring-orange-500 focus:border-orange-500 focus:ring-orange-500" : ""
                }`}
              />
              <p className="text-xs text-white/60">{getAddressHelpText()}</p>
              {errors.wallet && (
                <p className="text-red-400 text-sm">{errors.wallet}</p>
              )}
            </div>

            {/* Avatar Preview (Twitter or DiceBear) */}
            <div className="space-y-2">
              <Label>Avatar</Label>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-orange-500/70">
                  {(() => {
                    if (uploadedImage) {
                      return (
                        <img
                          src={uploadedImage}
                          alt="Twitter avatar"
                          className="w-full h-full object-cover"
                        />
                      );
                    }
                    const style = "adventurer";
                    const seed =
                      (profileId ?? 0) > 0
                        ? String(profileId)
                        : validateWalletAddress(walletAddress)
                            .normalizedAddress || "axios";
                    const dicebearUrl = `https://api.dicebear.com/7.x/${encodeURIComponent(
                      style
                    )}/png?seed=${encodeURIComponent(seed)}&size=128&radius=50`;
                    return (
                      <img
                        src={dicebearUrl}
                        alt="Generated avatar"
                        className="w-full h-full object-cover"
                      />
                    );
                  })()}
                </div>
                <div className="text-xs text-white/70">
                  {uploadedImage
                    ? "Using your X profile photo"
                    : "No X photo found — using a DiceBear avatar"}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || !canSubmit}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-semibold py-1.5 sm:py-2 text-sm sm:text-base backdrop-blur-sm border border-orange-500/50 shadow-lg transition-all"
            >
              {isSubmitting
                ? "Joining..."
                : !isAuthenticated
                ? "Sign in with X to Join"
                : "Join Waitlist"}
            </Button>

            {/* Help text for authentication requirement */}
            {!isAuthenticated && (
              <div className="text-center text-xs text-white/60 mt-2">
                You must sign in with X to join the waitlist
              </div>
            )}
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WaitlistPopup;
