"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/navbar/Navbar";
import SnippetGrid from "@/components/snippets/SnippetGrid";
import SnippetFilters from "@/components/snippets/SnippetFilters";
import SnippetDetailPanel from "@/components/snippets/SnippetDetailPanel";
import { useSnippetStore } from "@/store/snippetStore";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { searchGlobalPublic, setSearchGlobalPublic } = useSnippetStore();

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

      <main className="flex-1 container mx-auto px-4 py-8 animate-fade-in-up">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              {searchGlobalPublic ? "Global Code Search" : "Your Vault"}
            </h1>
            <p className="text-base text-muted-foreground mt-2 leading-relaxed">
              {searchGlobalPublic
                ? "Discover public code snippets shared by the community."
                : "Manage your code snippets, gists, and saved configurations."}
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-muted/30 p-2.5 rounded-xl border border-border/70 hover:border-primary/30 transition-colors duration-300 shadow-sm">
            <Switch
              id="global-search-mode"
              checked={searchGlobalPublic}
              onCheckedChange={setSearchGlobalPublic}
            />
            <Label htmlFor="global-search-mode" className="cursor-pointer text-sm font-medium">
              Explore Public Snippets
            </Label>
          </div>
        </div>

        {/* Global Filters */}
        <SnippetFilters userId={searchGlobalPublic ? undefined : user.id} />

        {/* The snippet grid fetched conditionally */}
        <SnippetGrid userId={searchGlobalPublic ? undefined : user.id} />
      </main>

      {/* Global Modals/Sheets for the dashboard */}
      <SnippetDetailPanel />
    </div>
  );
}
