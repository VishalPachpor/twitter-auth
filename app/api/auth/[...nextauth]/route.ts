import NextAuth from "next-auth";
import Twitter from "next-auth/providers/twitter";

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  providers: [
    Twitter({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0", // Enable OAuth 2.0
      authorization: {
        params: {
          // Some Twitter endpoints require tweet.read scope
          scope: "users.read tweet.read offline.access",
        },
      },
      // Ensure proper token endpoint configuration
      userinfo: {
        url: "https://api.twitter.com/2/users/me",
        params: {
          "user.fields": "profile_image_url,username",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Log what we receive during sign in
      console.log("=== Sign In Callback ===");
      console.log("User:", user);
      console.log("Account:", account ? "Account exists" : "No account");
      console.log("Profile:", profile);
      console.log("========================");

      // Store username and profile picture from profile/user if available
      if (profile?.username) {
        console.log("Username from profile:", profile.username);
      }
      if (user?.image) {
        console.log("Profile picture from user:", user.image);
      }
      if (user?.name) {
        console.log("Name from user:", user.name);
      }

      return true;
    },
    async jwt({ token, account, profile, user, trigger }) {
      // Log JWT callback execution
      console.log("=== JWT Callback ===");
      console.log("Has account:", !!account);
      console.log("Has profile:", !!profile);
      console.log("Has user:", !!user);
      console.log("Trigger:", trigger);

      // Persist access_token to JWT for profile fetches
      if (account) {
        console.log("Account access_token:", account.access_token?.substring(0, 20) + "...");
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;

        // Fetch user profile from Twitter API
        try {
          const response = await fetch(
            "https://api.twitter.com/2/users/me?user.fields=profile_image_url,username",
            {
              headers: {
                Authorization: `Bearer ${account.access_token}`,
              },
            }
          );

          if (response.ok) {
            const twitterUser = await response.json();
            const userData = twitterUser.data;

            // Store username and profile picture in variables
            const username = userData.username || "";
            const profilePicture = userData.profile_image_url || "";

            // Print the variables
            console.log("=== Twitter User Data (from API) ===");
            console.log("Username:", username);
            console.log("Profile Picture:", profilePicture);
            console.log("========================");

            // Store in token
            token.username = username;
            token.profilePicture = profilePicture;
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error("Twitter API Error:", response.status, response.statusText, errorData);
          }
        } catch (error) {
          console.error("Error fetching Twitter profile:", error);
        }
      }
      
      // Store username from profile if available (fallback - works even without account)
      if (profile?.username && !token.username) {
        console.log("=== Using Profile Data (Fallback) ===");
        console.log("Username:", profile.username);
        token.username = profile.username as string;
      }
      
      // Store profile image from user object if available (fallback)
      if (user?.image && !token.profilePicture) {
        console.log("Profile Picture:", user.image);
        token.profilePicture = user.image;
      }
      
      // Store name if available
      if (user?.name && !token.name) {
        token.name = user.name;
      }
      
      console.log("Final token username:", token.username);
      console.log("Final token profilePicture:", token.profilePicture);
      console.log("========================");
      
      return token;
    },
    async session({ session, token }) {
      // Add access_token and refresh_token to session for client-side use if needed
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      // Add username and profile picture to session user
      if (token.username && session.user) {
        session.user.username = token.username as string;
      }
      if (token.profilePicture && session.user) {
        session.user.image = token.profilePicture as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin", // Optional: Custom signin page
    error: "/auth/error", // Custom error page
  },
});

export { handler as GET, handler as POST };
