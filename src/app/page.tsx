import { supabase } from "@/lib/supabase";
import Navbar from "@/components/navbar/Navbar";
import SnippetGrid from "@/components/snippets/SnippetGrid";
import SnippetForm from "@/components/snippets/SnippetForm";
import SnippetDetailPanel from "@/components/snippets/SnippetDetailPanel";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Code2 } from "lucide-react";

export default async function Home() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar user={user} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-32 border-b bg-muted/30">
          <div className="container px-4 md:px-6 mx-auto text-center flex flex-col items-center">
            <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-primary text-primary-foreground mb-6 shadow-lg">
              <Code2 className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 max-w-3xl">
              Store, share, and discover beautiful code snippets
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mb-8">
              SnippetVault is your personal developer gist manager. Save your favorite configurations, reusable components, and scripts in one beautifully designed place.
            </p>
            <div className="flex items-center gap-4">
              {user ? (
                <Button size="lg" asChild>
                  <Link href="/dashboard">
                    Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" asChild>
                    <Link href="/signup">Get Started for Free</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/login">Sign In</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Explore Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Explore Public Vaults</h2>
            <p className="text-muted-foreground mt-2">
              Discover useful scripts and components created by the community.
            </p>
          </div>

          {/* Renders all public snippets (since userId is omitted and Supabase RLS policies enforce is_public=true for non-authors) */}
          <SnippetGrid />
        </section>
      </main>

      {/* Global Modals/Sheets */}
      <SnippetForm />
      <SnippetDetailPanel />
    </div>
  );
}
