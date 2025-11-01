// Wallet address validation utilities
// Supports common blockchain address formats

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  normalizedAddress: string; // Always provided (trimmed address)
}

/**
 * Validates a wallet address
 * Supports: Ethereum (0x...), Bitcoin (starts with 1, 3, or bc1), Solana (base58)
 */
export function validateWalletAddress(address: string): ValidationResult {
  const trimmed = address.trim();
  
  if (!address || trimmed.length === 0) {
    return {
      isValid: false,
      error: "Wallet address is required",
      normalizedAddress: "",
    };
  }

  // Ethereum address (0x followed by 40 hex characters)
  if (trimmed.startsWith("0x")) {
    if (trimmed.length === 42 && /^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
      return { isValid: true, normalizedAddress: trimmed };
    }
    return {
      isValid: false,
      error: "Invalid Ethereum address format",
      normalizedAddress: trimmed,
    };
  }

  // Bitcoin address (starts with 1, 3, or bc1)
  if (trimmed.startsWith("1") || trimmed.startsWith("3") || trimmed.startsWith("bc1")) {
    if (trimmed.length >= 26 && trimmed.length <= 62) {
      return { isValid: true, normalizedAddress: trimmed };
    }
    return {
      isValid: false,
      error: "Invalid Bitcoin address format",
      normalizedAddress: trimmed,
    };
  }

  // Solana address (base58, typically 32-44 characters)
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed)) {
    return { isValid: true, normalizedAddress: trimmed };
  }

  // Generic validation - allow alphanumeric addresses
  if (trimmed.length >= 20 && trimmed.length <= 100 && /^[a-zA-Z0-9]+$/.test(trimmed)) {
    return { isValid: true, normalizedAddress: trimmed };
  }

  return {
    isValid: false,
    error: "Invalid wallet address format",
    normalizedAddress: trimmed, // Return trimmed address even if invalid for display purposes
  };
}

/**
 * Gets error message for invalid wallet address
 */
export function getAddressErrorMessage(address: string): string | undefined {
  const validation = validateWalletAddress(address);
  return validation.error;
}

/**
 * Gets placeholder text for wallet address input
 */
export function getAddressPlaceholder(): string {
  return "Enter wallet address (e.g., 0x... or 1A1z...)";
}

/**
 * Gets help text for wallet address input
 */
export function getAddressHelpText(): string {
  return "Supported formats: Ethereum (0x...), Bitcoin (1... or bc1...), Solana, and other common formats";
}

