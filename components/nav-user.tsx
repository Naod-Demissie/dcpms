"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";

import { ChevronsUpDown, LogOut, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth-client";
import { authClient } from "@/lib/auth-client";

export function NavUser() {
  const { isMobile } = useSidebar();
  const { data: session } = useSession();
  const user = session?.user;

  const [displayInitials, setDisplayInitials] = useState("U");
  const [displayName, setDisplayName] = useState("User");
  const [displayEmail, setDisplayEmail] = useState("No email");

  useEffect(() => {
    const getInitials = (name?: string) => {
      if (!name) return "U";
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
    };

    if (user) {
      setDisplayInitials(getInitials(user.name));
      setDisplayName(user.name || "User");
      setDisplayEmail(user.email || "No email");
    } else {
      setDisplayInitials("U");
      setDisplayName("User");
      setDisplayEmail("No email");
    }
  }, [user]);

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = "/";
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user?.image || undefined} alt={displayName} />
                <AvatarFallback className="rounded-lg">
                  {displayInitials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{displayName}</span>
                <span className="truncate text-xs">{displayEmail}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={user?.image || undefined}
                    alt={displayName}
                  />
                  <AvatarFallback className="rounded-lg">
                    {displayInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{displayName}</span>
                  <span className="truncate text-xs">{displayEmail}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/account" className="flex items-center gap-2">
                  <Settings className="w-4 h-4 mr-2" />
                  Account
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
