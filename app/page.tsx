"use client"

import { useState } from "react"
import Header from "@/components/Header"

interface FormState {
  firstName: string
  lastName: string
  jobTitle: string
  department: string
}

interface Result {
  email: string
  password: string
}

export default function Home() {
  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    jobTitle: "",
    department: "",
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState<"email" | "password" | null>(null)

  const emailPreview =
    form.firstName.trim() && form.lastName.trim()
      ? `${form.firstName.trim().toLowerCase().replace(/[^a-z]/g, "")}.${form.lastName.trim().toLowerCase().replace(/[^a-z]/g, "")}@resurrection.church`
      : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const res = await fetch("/api/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create account")
      setResult({ email: data.email, password: data.password })
      setForm({ firstName: "", lastName: "", jobTitle: "", department: "" })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, field: "email" | "password") => {
    await navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  const field = (
    label: string,
    key: keyof FormState,
    required = false,
    placeholder = ""
  ) => (
    <div>
      <label className="text-zinc-400 text-xs block mb-1.5">
        {label} {required && <span className="text-zinc-600">*</span>}
      </label>
      <input
        type="text"
        required={required}
        placeholder={placeholder}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full bg-zinc-800 border border-zinc-700 focus:border-[#0078d4] text-white placeholder-zinc-600 text-sm rounded-lg px-3 py-2 outline-none transition-colors"
      />
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-10">
        <h1 className="text-white font-bold text-xl mb-1">New Hire Account</h1>
        <p className="text-zinc-500 text-sm mb-6">
          Creates a Microsoft 365 account at resurrection.church with a temporary password.
        </p>

        {result ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-green-500/15 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-white font-semibold">Account created</h2>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <p className="text-zinc-500 text-xs mb-1.5">Email</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-zinc-800 text-blue-400 text-sm px-3 py-2 rounded-lg font-mono">
                    {result.email}
                  </code>
                  <button
                    onClick={() => copyToClipboard(result.email, "email")}
                    className="text-zinc-400 hover:text-white text-xs px-2 py-2 transition-colors"
                    title="Copy email"
                  >
                    {copied === "email" ? "✓" : "Copy"}
                  </button>
                </div>
              </div>
              <div>
                <p className="text-zinc-500 text-xs mb-1.5">Temporary password</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-zinc-800 text-white text-sm px-3 py-2 rounded-lg font-mono">
                    {result.password}
                  </code>
                  <button
                    onClick={() => copyToClipboard(result.password, "password")}
                    className="text-zinc-400 hover:text-white text-xs px-2 py-2 transition-colors"
                    title="Copy password"
                  >
                    {copied === "password" ? "✓" : "Copy"}
                  </button>
                </div>
              </div>
              <p className="text-zinc-600 text-xs">
                User must change their password on first sign-in.
              </p>
            </div>

            <button
              onClick={() => setResult(null)}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-sm py-2 rounded-lg transition-colors"
            >
              Create another account
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {field("First name", "firstName", true)}
              {field("Last name", "lastName", true)}
            </div>
            {field("Job title", "jobTitle", true, "e.g. Organist")}
            {field("Department", "department", false, "e.g. Worship & Worship Experience")}

            {emailPreview && (
              <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2.5">
                <p className="text-zinc-500 text-xs mb-0.5">Will create</p>
                <p className="text-[#0078d4] font-mono text-sm">{emailPreview}</p>
              </div>
            )}

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0078d4] hover:bg-[#106ebe] disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        )}
      </main>
    </div>
  )
}
