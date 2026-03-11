"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/navbar/Navbar";
import SnippetForm from "@/components/snippets/SnippetForm";
import { Info } from "lucide-react";

export default function CreateSnippetPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
      }
      setLoading(false);
    };
    checkUser();
  }, [router]);

  if (loading || !user) {
    return null; // or a loading spinner
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Add a Snippet</h1>
          <p className="text-muted-foreground mt-2">
            Write down a useful block of code, add some tags, and save it to your vault.
          </p>
        </div>

        {/* ── Directions Callout ── */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-5 flex gap-4 text-sm text-muted-foreground mb-8">
          <Info className="h-6 w-6 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-foreground mb-1">Add Snippet Guide</p>
            <ul className="space-y-1.5 list-none">
              <li>• <strong>Title & Language:</strong> Be descriptive so you can search for it later!</li>
              <li>• <strong>Tags:</strong> Press <code>Enter</code> or <code>,</code> after typing a tag word (e.g. "react" or "auth").</li>
              <li>• <strong>Code:</strong> Paste your implementation here. You can edit it later.</li>
              <li>• <strong>Visibility:</strong> Keep it Private for your own vault, or switch to Public to let others find and learn from your code.</li>
            </ul>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <SnippetForm onClose={() => router.push("/dashboard")} />
        </div>
      </main>
    </div>
  );
}
