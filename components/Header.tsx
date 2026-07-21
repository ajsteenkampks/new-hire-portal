"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = authClient.useSession()

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/login")
  }

  return (
    <header className="border-b border-zinc-800">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-white font-bold text-sm tracking-tight">
            Resurrection Church IT
          </span>
          <nav className="flex gap-1">
            <Link
              href="/"
              className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                pathname === "/"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              New Hire
            </Link>
            <Link
              href="/history"
              className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                pathname === "/history"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              History
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {session && (
            <span className="text-zinc-500 text-xs hidden sm:block">
              {session.user.email}
            </span>
          )}
          <button
            onClick={handleSignOut}
            className="text-zinc-400 hover:text-white text-xs transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
