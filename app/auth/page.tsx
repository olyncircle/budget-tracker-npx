"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signUp = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Check your email!");
    }
  };

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error) {
      router.push("/dashboard");
    } else {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-96 space-y-4">
        <h1 className="text-2xl font-bold text-center">
          Budget Tracker
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="border p-2 w-full"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="border p-2 w-full"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={signIn}
          className="bg-black text-white w-full py-2"
        >
          Sign In
        </button>

        <button
          onClick={signUp}
          className="border w-full py-2"
        >
          Sign Up
        </button>
      </div>
    </div>
  );
}