"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/navbar/Navbar";
import SnippetForm from "@/components/snippets/SnippetForm";
import { useSnippet } from "@/hooks/useSnippet";
import { Loader2, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function EditSnippetPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const { data: snippet, isLoading: snippetLoading, error } = useSnippet(id);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
      }
      setAuthLoading(false);
    };
    checkUser();
  }, [router]);

  if (authLoading) return null;

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar user={user} />
        <main className="flex-1 container mx-auto px-4 py-16 max-w-4xl flex flex-col items-center gap-4 text-destructive">
          <Code2 className="h-10 w-10 opacity-50" />
          <p>Failed to load snippet to edit.</p>
          <Link href="/dashboard">
            <Button variant="outline">Return to Dashboard</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Edit Snippet</h1>
          <p className="text-muted-foreground mt-2">
            Update your saved code, change visibility, or categorize it with new tags.
          </p>
        </div>

        <div className="bg-card border rounded-xl p-6 shadow-sm min-h-[500px]">
          {snippetLoading || !snippet ? (
            <div className="flex h-full items-center justify-center p-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <SnippetForm snippet={snippet} onClose={() => router.push("/dashboard")} />
          )}
        </div>
      </main>
    </div>
  );
}
