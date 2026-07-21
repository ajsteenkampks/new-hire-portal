"use client"

import { useState } from "react"
import { authClient } from "@/lib/auth-client"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSignIn = async () => {
    setLoading(true)
    setError("")
    try {
      const result = await authClient.signIn.social({
        provider: "microsoft",
        callbackURL: "/",
      })
      if (result?.error) {
        setError(result.error.message || "Sign-in failed. Check your Vercel environment variables.")
        setLoading(false)
      }
      // On success the browser redirects — loading state stays until navigation
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-sm text-center">
        <div className="w-12 h-12 bg-[#0078d4] rounded-xl flex items-center justify-center mx-auto mb-5">
          <span className="text-white font-bold text-lg">IT</span>
        </div>
        <h1 className="text-white font-bold text-xl mb-1">IT Helpdesk Portal</h1>
        <p className="text-zinc-500 text-sm mb-8">Resurrection Church</p>
        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 disabled:bg-zinc-200 disabled:cursor-not-allowed text-zinc-900 text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          <MicrosoftLogo />
          {loading ? "Signing in…" : "Sign in with Microsoft"}
        </button>
        {error && (
          <p className="mt-4 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}

function MicrosoftLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  )
}
