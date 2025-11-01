import { supabase } from "./supabase";

// Convert between database format and app format
type DatabaseEntry = {
  id: string;
  name: string;
  wallet_address: string;
  avatar: string;
  avatar_type: "upload" | "avatar_seed";
  avatar_seed?: string;
  avatar_style?: string;
  profile_id: number;
  created_at: string;
};
type AppEntry = {
  id: string;
  name: string;
  walletAddress: string;
  avatar: string;
  avatarType: "upload" | "avatar_seed";
  avatarSeed?: string; // Seed for generating anime avatars
  avatarStyle?: string; // DiceBear style
  profileId: number;
  timestamp: number;
};

class WaitlistService {
  private readonly STORAGE_KEY = "axios_waitlist_entries";
  private useDatabase = true;

  constructor() {
    // Check if we have Supabase properly configured
    this.useDatabase = !!supabase;
  }

  // Convert database entry to app format
  private dbToApp(dbEntry: DatabaseEntry): AppEntry {
    return {
      id: dbEntry.id,
      name: dbEntry.name,
      walletAddress: dbEntry.wallet_address,
      avatar: dbEntry.avatar,
      avatarType: dbEntry.avatar_type,
      avatarSeed: dbEntry.avatar_seed,
      avatarStyle: dbEntry.avatar_style,
      profileId: dbEntry.profile_id,
      timestamp: new Date(dbEntry.created_at).getTime(),
    };
  }

  // Convert app entry to database format
  private appToDb(appEntry: {
    name: string;
    walletAddress: string;
    avatar: string;
    avatarType: "upload" | "avatar_seed";
    avatarSeed?: string;
    avatarStyle?: string;
    profileId: number;
  }): {
    name: string;
    wallet_address: string;
    avatar: string;
    avatar_type: "emoji" | "upload" | "avatar_seed";
    avatar_seed?: string;
    avatar_style?: string;
    profile_id: number;
  } {
    return {
      name: appEntry.name,
      wallet_address: appEntry.walletAddress,
      avatar: appEntry.avatar,
      avatar_type: appEntry.avatarType,
      avatar_seed: appEntry.avatarSeed,
      avatar_style: appEntry.avatarStyle,
      profile_id: appEntry.profileId,
    };
  }

  async addEntry(entry: {
    name: string;
    walletAddress: string;
    avatar: string;
    avatarType: "upload" | "avatar_seed";
    avatarSeed?: string;
    avatarStyle?: string;
    profileId: number;
  }): Promise<AppEntry> {
    if (!this.useDatabase || !supabase) {
      return this.fallbackToLocalStorage(entry);
    }

    try {
      const dbEntry = this.appToDb(entry);

      // Check if wallet already exists
      const { data: existing } = await supabase
        .from("waitlist_entries")
        .select("*")
        .eq("wallet_address", entry.walletAddress)
        .single();

      if (existing) {
        // If same profile, return existing
        if (existing.profile_id === entry.profileId) {
          return this.dbToApp(existing);
        }
        // If different profile, update to new position
        const { data, error } = await supabase
          .from("waitlist_entries")
          .update({
            profile_id: entry.profileId,
            name: entry.name,
            avatar: entry.avatar,
            avatar_type: entry.avatarType,
            avatar_seed: entry.avatarSeed,
            avatar_style: entry.avatarStyle,
          })
          .eq("wallet_address", entry.walletAddress)
          .select()
          .single();

        if (error) throw error;
        return this.dbToApp(data);
      }

      // Check if profile position is taken
      const { data: profileTaken } = await supabase
        .from("waitlist_entries")
        .select("*")
        .eq("profile_id", entry.profileId)
        .single();

      if (profileTaken) {
        throw new Error("This position is already taken");
      }

      // Create new entry
      const { data, error } = await supabase
        .from("waitlist_entries")
        .insert(dbEntry)
        .select()
        .single();

      if (error) throw error;
      return this.dbToApp(data);
    } catch (error) {
      // Fallback to localStorage silently
      return this.fallbackToLocalStorage(entry);
    }
  }

  async getEntry(walletAddress: string): Promise<AppEntry | null> {
    if (!this.useDatabase || !supabase) {
      return this.getFromLocalStorage(walletAddress);
    }

    try {
      const { data, error } = await supabase
        .from("waitlist_entries")
        .select("*")
        .eq("wallet_address", walletAddress)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data ? this.dbToApp(data) : null;
    } catch (error) {
      // Fallback to localStorage silently
      return this.getFromLocalStorage(walletAddress);
    }
  }

  async getEntryByProfileId(profileId: number): Promise<AppEntry | null> {
    if (!this.useDatabase || !supabase) {
      return this.getByProfileIdFromLocalStorage(profileId);
    }

    try {
      const { data, error } = await supabase
        .from("waitlist_entries")
        .select("*")
        .eq("profile_id", profileId)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data ? this.dbToApp(data) : null;
    } catch (error) {
      // Fallback to localStorage silently
      return this.getByProfileIdFromLocalStorage(profileId);
    }
  }

  async getAllEntries(): Promise<AppEntry[]> {
    if (!this.useDatabase || !supabase) {
      return this.getAllFromLocalStorage();
    }

    try {
      const { data, error } = await supabase
        .from("waitlist_entries")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []).map((entry) => this.dbToApp(entry));
    } catch (error) {
      // Fallback to localStorage silently
      return this.getAllFromLocalStorage();
    }
  }

  async removeEntry(walletAddress: string): Promise<boolean> {
    if (!this.useDatabase || !supabase) {
      return this.removeFromLocalStorage(walletAddress);
    }

    try {
      const { error } = await supabase
        .from("waitlist_entries")
        .delete()
        .eq("wallet_address", walletAddress);

      return !error;
    } catch (error) {
      // Fallback to localStorage silently
      return this.removeFromLocalStorage(walletAddress);
    }
  }

  async getWaitlistSize(): Promise<number> {
    if (!this.useDatabase || !supabase) {
      return this.getSizeFromLocalStorage();
    }

    try {
      const { count, error } = await supabase
        .from("waitlist_entries")
        .select("*", { count: "exact", head: true });

      if (error) throw error;
      return count || 0;
    } catch (error) {
      // Fallback to localStorage silently
      return this.getSizeFromLocalStorage();
    }
  }

  async clearAllEntries(): Promise<void> {
    if (!this.useDatabase || !supabase) {
      this.clearLocalStorage();
      return;
    }

    try {
      const { error } = await supabase
        .from("waitlist_entries")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

      if (error) throw error;
    } catch (error) {
      // Fallback to localStorage silently
      this.clearLocalStorage();
    }
  }

  // LocalStorage fallback methods
  private getLocalStorageEntries(): Map<string, AppEntry> {
    if (typeof window === "undefined") return new Map();

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const entries = JSON.parse(stored) as AppEntry[];
        return new Map(entries.map((entry) => [entry.walletAddress, entry]));
      }
    } catch (error) {
      // Silently handle localStorage errors
    }
    return new Map();
  }

  private saveToLocalStorage(entries: Map<string, AppEntry>) {
    if (typeof window === "undefined") return;

    try {
      const entriesArray = Array.from(entries.values());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(entriesArray));
    } catch (error) {
      // Silently handle localStorage errors
    }
  }

  private fallbackToLocalStorage(entry: {
    name: string;
    walletAddress: string;
    avatar: string;
    avatarType: "upload" | "avatar_seed";
    avatarSeed?: string;
    avatarStyle?: string;
    profileId: number;
  }): Promise<AppEntry> {
    return new Promise((resolve, reject) => {
      const entries = this.getLocalStorageEntries();

      // Check if wallet address already exists
      const existingWalletEntry = entries.get(entry.walletAddress);
      if (existingWalletEntry) {
        // If it's the same wallet trying to claim the same position, return the existing entry
        if (existingWalletEntry.profileId === entry.profileId) {
          resolve(existingWalletEntry);
          return;
        }
        // If it's a different position, allow them to move to the new position
        entries.delete(entry.walletAddress);
      }

      // Check if profile is already claimed by a different wallet
      const existingProfileEntry = Array.from(entries.values()).find(
        (e) => e.profileId === entry.profileId
      );
      if (existingProfileEntry) {
        reject(new Error("This position is already taken"));
        return;
      }

      const newEntry: AppEntry = {
        ...entry,
        id: this.generateId(),
        timestamp: Date.now(),
      };

      entries.set(entry.walletAddress, newEntry);
      this.saveToLocalStorage(entries);
      resolve(newEntry);
    });
  }

  private getFromLocalStorage(walletAddress: string): AppEntry | null {
    const entries = this.getLocalStorageEntries();
    return entries.get(walletAddress) || null;
  }

  private getByProfileIdFromLocalStorage(profileId: number): AppEntry | null {
    const entries = this.getLocalStorageEntries();
    return (
      Array.from(entries.values()).find(
        (entry) => entry.profileId === profileId
      ) || null
    );
  }

  private getAllFromLocalStorage(): AppEntry[] {
    const entries = this.getLocalStorageEntries();
    return Array.from(entries.values());
  }

  private removeFromLocalStorage(walletAddress: string): boolean {
    const entries = this.getLocalStorageEntries();
    const removed = entries.delete(walletAddress);
    if (removed) {
      this.saveToLocalStorage(entries);
    }
    return removed;
  }

  private getSizeFromLocalStorage(): number {
    const entries = this.getLocalStorageEntries();
    return entries.size;
  }

  private clearLocalStorage(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

// Export types for compatibility
export type { AppEntry as WaitlistEntry };

// Singleton instance
const waitlistService = new WaitlistService();
export default waitlistService;
