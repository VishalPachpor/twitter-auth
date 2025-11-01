"use client";
import { signIn, getProviders } from "next-auth/react";
import { useEffect, useState } from "react";

type Provider = {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
};

export default function SignIn() {
  const [providers, setProviders] = useState<Record<string, Provider>>({});

  useEffect(() => {
    const setUpProviders = async () => {
      const res = await getProviders();
      setProviders(res ?? {});
    };
    setUpProviders();
  }, []);

  return (
    <>
      {Object.values(providers).map((provider) => {
        const callbackUrl = typeof window !== "undefined" 
          ? `${window.location.origin}/waitlist?join=true&spot=1`
          : "/waitlist?join=true&spot=1";
        return (
          <div key={provider.name}>
            <button onClick={() => signIn(provider.id, { callbackUrl })}>
              Sign in with {provider.name}
            </button>
          </div>
        );
      })}
    </>
  );
}
