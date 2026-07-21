"use client"

import { useEffect, useState } from "react"
import Header from "@/components/Header"

interface HireRecord {
  id: number
  first_name: string
  last_name: string
  email: string
  job_title: string | null
  department: string | null
  created_by: string | null
  created_at: string
}

export default function HistoryPage() {
  const [records, setRecords] = useState<HireRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/history")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load")
        return r.json()
      })
      .then(setRecords)
      .catch(() => setError("Could not load history."))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-white font-bold text-xl mb-1">Account History</h1>
        <p className="text-zinc-500 text-sm mb-6">
          All Microsoft 365 accounts created through this portal.
        </p>

        {loading && <p className="text-zinc-500 text-sm">Loading…</p>}
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {!loading && !error && records.length === 0 && (
          <p className="text-zinc-500 text-sm">No accounts created yet.</p>
        )}

        {!loading && records.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left text-zinc-500 font-medium px-4 py-3">Name</th>
                  <th className="text-left text-zinc-500 font-medium px-4 py-3">Email</th>
                  <th className="text-left text-zinc-500 font-medium px-4 py-3 hidden md:table-cell">Job title</th>
                  <th className="text-left text-zinc-500 font-medium px-4 py-3 hidden lg:table-cell">Department</th>
                  <th className="text-left text-zinc-500 font-medium px-4 py-3 hidden sm:table-cell">Created</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">
                      {r.first_name} {r.last_name}
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-[#0078d4] font-mono text-xs">{r.email}</code>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 hidden md:table-cell">
                      {r.job_title || <span className="text-zinc-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 hidden lg:table-cell">
                      {r.department || <span className="text-zinc-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs hidden sm:table-cell">
                      {new Date(r.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
