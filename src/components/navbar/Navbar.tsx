"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { Code2, Plus, Search, LogOut, User as UserIcon } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useSnippetStore } from "@/store/snippetStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavbarProps {
  user?: SupabaseUser | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const { searchQuery, setSearchQuery } = useSnippetStore();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 group transition-transform duration-300 hover:scale-[1.02]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground group-hover:bg-primary/90 transition-colors shadow-sm">
              <Code2 className="h-5 w-5" />
            </div>
            <span className="font-bold hidden sm:inline-block bg-clip-text">SnippetVault</span>
          </Link>

          {/* Global Search - Only show if on dashboard or exploring */}
          <div className="hidden md:flex relative w-64 lg:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="global-search-input"
              type="text"
              name="search"
              placeholder="Search snippets..."
              className="w-full bg-muted/50 pl-9 border border-transparent focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/50 hover:bg-muted/80 transition-all duration-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Right Nav Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/dashboard/create">
                <Button size="sm" className="gap-2 h-9 cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Snippet</span>
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger
                  id="navbar-user-menu"
                  suppressHydrationWarning
                  className="relative h-9 w-9 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 hover:ring-2 hover:ring-primary/30 hover:scale-105 transition-all duration-300 shadow-sm"
                >
                  <Avatar className="h-9 w-9" suppressHydrationWarning>
                    <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
                    <AvatarFallback className="bg-primary/10 text-primary" suppressHydrationWarning>
                      {user.email?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.user_metadata?.username ?? "User"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Link href={`/u/${user.user_metadata?.username ?? user.id}`} className="flex w-full cursor-pointer">
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Public Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild className="hover:bg-primary/10 transition-colors duration-300">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild className="hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
                <Link href="/signup">Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
