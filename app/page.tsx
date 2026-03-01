"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  useEffect(() => {
    const test = async () => {
      const { data, error } = await supabase.auth.getSession();
      console.log("Supabase connected:", { data, error });
    };

    test();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-3xl font-bold">
        Budget Tracker
      </h1>
    </div>
  );
}