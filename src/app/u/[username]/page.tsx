import { supabase } from "@/lib/supabase";
import Navbar from "@/components/navbar/Navbar";
import SnippetGrid from "@/components/snippets/SnippetGrid";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params;

  // 1. Fetch user by username
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (error || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-bold tracking-tight">User not found</h1>
        <p className="text-muted-foreground">This user does not exist.</p>
      </div>
    );
  }

  // 2. Fetch logged-in user to pass to Navbar
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar user={currentUser} />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        {/* Profile Header */}
        <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 mb-8 mt-4">
          <Avatar className="h-24 w-24 border">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="text-3xl bg-primary/10 text-primary">
              {profile.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-2">
            <div>
              <h1 className="text-3xl font-bold">{profile.display_name || profile.username}</h1>
              <p className="text-lg text-muted-foreground">@{profile.username}</p>
            </div>
            {profile.created_at && (
              <p className="text-muted-foreground max-w-md text-sm">
                Joined {new Date(profile.created_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        <Separator className="my-8" />

        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight">Public Snippets</h2>
          {/* Reusing SnippetGrid but scoped to this user. 
              The grid automatically queries useSnippets and handles loading/empty states. 
              Since this is a public page, row-level security defaults to `is_public=true`
              unless currentUser == profile.id! */}
          <SnippetGrid userId={profile.id} />
        </div>
      </main>
    </div>
  );
}
