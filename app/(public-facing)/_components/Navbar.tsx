"use client";

import Image from "next/image";
import Link from "next/link";
import Logo from "@/public/midjourney-dark.png";
import { authClient } from "@/lib/auth-client";
import { buttonVariants } from "@/components/ui/button";
import UserDropDown from "./UserDropDown";
import {
  ThemeToggleButton,
  useThemeTransition,
} from "@/components/ui/shadcn-io/theme-toggle-button";

import { useTheme } from "next-themes";

export function Navbar() {
  const { data: session, isPending } = authClient.useSession();
  const { theme, setTheme } = useTheme();
  const { startTransition } = useThemeTransition();

  const toggleTheme = () => {
    startTransition(() => {
      setTheme(theme === "light" ? "dark" : "light");
    });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-[backdrop-filter]:bg-background/60">
      <div className="container flex min-h-16 items-center mx-auto px-4 md:px-6 lg:px-8">
        <Link href="/" className="flex items-center space-x-2 mr-4">
          <Image src={Logo} alt="logo" className="size-9" />
          <span className="font-bold">LMS</span>
        </Link>

        <nav className="hidden md:flex md:flex-1 md:items-center md:justify-between">
          <div className="flex itmes-center space-x-2">
            {[
              { name: "Home", href: "/" },
              { name: "Courses", href: "/courses" },
              { name: "Dashboard", href: "/dashboard" }
            ].map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md"
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <ThemeToggleButton
              theme={theme === "light" ? "light" : "dark"}
              variant="circle"
              // start="center"
              onClick={toggleTheme}
            />

            {isPending ? null : session ? (
              <UserDropDown
                email={session.user.email}
                imageUrl={
                  session.user.image ||
                  `https://avatar.vercel.sh/${session?.user.email}`
                }
                name={session.user.name}
              />
            ) : (
              <>
                <Link
                  href="/login"
                  className={buttonVariants({ variant: "secondary" })}
                >
                  Login
                </Link>
                <Link href="/login" className={buttonVariants({})}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
