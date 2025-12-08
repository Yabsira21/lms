import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useSignOut } from "@/hooks/user-signout";
import { authClient } from "@/lib/auth-client";

import {
  BoltIcon,
  BookOpen,
  ChevronDownIcon,
  Home,
  LayoutDashboardIcon,
  LogOutIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface iAppProps {
  name: string;
  email: string;
  imageUrl: string;
}

export default function UserDropDown({ name, email, imageUrl }: iAppProps) {
  const handleSignout = useSignOut();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
          <Avatar className="hover:cursor-pointer">
            <AvatarImage src={imageUrl} alt="User Avatar" />
            <AvatarFallback>
              {name ? name[0].toUpperCase() : email[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={12} className="max-w-64">
        <DropdownMenuLabel className="flex min-w-0 flex-col">
          <span className="text-foreground truncate text-sm font-medium">
            {name}
          </span>
          <span className="text-muted-foreground truncate text-xs font-normal">
            {email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/">
              <Home size={16} className="opacity-60" aria-hidden="true" />
              <span>Home</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/courses">
              <BookOpen size={16} className="opacity-60" aria-hidden="true" />
              <span>Courses</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard">
              <LayoutDashboardIcon
                size={16}
                className="opacity-60"
                aria-hidden="true"
              />
              <span>Dashboard</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignout}>
            {/* <Link href="/dashboard"> */}
            <LogOutIcon size={16} className="opacity-60" aria-hidden="true" />
            <span>Logout</span>
            {/* </Link> */}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
