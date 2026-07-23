"use client"

import { useState } from "react"
import Header from "@/components/Header"
import type { LookupResult } from "@/lib/graph"

export default function LookupPage() {
  const [input, setInput] = useState("")
  const [results, setResults] = useState<LookupResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSearch = async () => {
    const names = input.split("\n").map((n) => n.trim()).filter(Boolean)
    if (!names.length) return

    setLoading(true)
    setError("")
    setResults([])

    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Lookup failed")
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const found = results.filter((r) => r.matches.length > 0)
  const notFound = results.filter((r) => r.matches.length === 0)

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-white font-bold text-xl mb-1">User Lookup</h1>
        <p className="text-zinc-500 text-sm mb-6">
          Paste a list of names — one per line — to check who has an active account in Azure AD.
        </p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 mb-6">
          <div>
            <label className="text-zinc-400 text-xs block mb-1.5">Names (one per line)</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={"Sora Shepard\nJoseph Hill\nTrevor Good"}
              rows={8}
              className="w-full bg-zinc-800 border border-zinc-700 focus:border-[#0078d4] text-white placeholder-zinc-600 text-sm rounded-lg px-3 py-2 outline-none transition-colors resize-none"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            onClick={handleSearch}
            disabled={loading || !input.trim()}
            className="w-full bg-[#0078d4] hover:bg-[#106ebe] disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            {loading ? "Searching…" : "Search Azure AD"}
          </button>
        </div>

        {results.length > 0 && (
          <div className="space-y-5">
            {/* Summary */}
            <div className="flex gap-3">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2 text-center">
                <p className="text-green-400 font-bold text-lg">{found.length}</p>
                <p className="text-zinc-400 text-xs">Found</p>
              </div>
              <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-4 py-2 text-center">
                <p className="text-zinc-300 font-bold text-lg">{notFound.length}</p>
                <p className="text-zinc-400 text-xs">Not found</p>
              </div>
            </div>

            {/* Found users */}
            {found.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-800">
                  <h2 className="text-white font-medium text-sm">Found in Azure AD</h2>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left text-zinc-500 font-medium px-4 py-2.5">Searched</th>
                      <th className="text-left text-zinc-500 font-medium px-4 py-2.5">Display name</th>
                      <th className="text-left text-zinc-500 font-medium px-4 py-2.5">Email</th>
                      <th className="text-left text-zinc-500 font-medium px-4 py-2.5">Status</th>
                      <th className="text-left text-zinc-500 font-medium px-4 py-2.5 hidden md:table-cell">Job title</th>
                    </tr>
                  </thead>
                  <tbody>
                    {found.flatMap((r) =>
                      r.matches.map((u, i) => (
                        <tr key={`${r.searched}-${i}`} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                          <td className="px-4 py-3 text-zinc-400 text-xs">{i === 0 ? r.searched : ""}</td>
                          <td className="px-4 py-3 text-white">{u.displayName}</td>
                          <td className="px-4 py-3">
                            <code className="text-[#0078d4] font-mono text-xs">{u.userPrincipalName}</code>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.accountEnabled ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                              {u.accountEnabled ? "Active" : "Disabled"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-zinc-400 text-xs hidden md:table-cell">{u.jobTitle || "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Not found */}
            {notFound.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-800">
                  <h2 className="text-white font-medium text-sm">Not found in Azure AD</h2>
                </div>
                <ul className="divide-y divide-zinc-800/50">
                  {notFound.map((r) => (
                    <li key={r.searched} className="px-4 py-3 text-zinc-400 text-sm">
                      {r.searched}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
