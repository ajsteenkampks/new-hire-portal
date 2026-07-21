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

interface ParsedTicket {
  firstName: string
  lastName: string
  jobTitle: string
  department: string
  needsEmail: boolean
}

function parseTicket(raw: string): ParsedTicket {
  const lines = raw.split("\n").map((l) => l.trim())

  const getValueAfterLabel = (label: string): string => {
    const idx = lines.findIndex((l) => l.toLowerCase() === label.toLowerCase())
    if (idx === -1) return ""
    for (let i = idx + 1; i < lines.length; i++) {
      if (lines[i]) return lines[i]
    }
    return ""
  }

  const legalName = getValueAfterLabel("Candidate's Legal Name:")
  const nameParts = legalName.trim().split(/\s+/)
  const firstName = nameParts[0] || ""
  const lastName = nameParts.slice(1).join(" ") || ""

  const jobTitle = getValueAfterLabel("Position Title:")
  const department = getValueAfterLabel("Department:")

  // Scan IT Requests section for "Email Address"
  const itIdx = lines.findIndex((l) => l.toLowerCase() === "it requests:")
  let needsEmail = false
  if (itIdx !== -1) {
    for (let i = itIdx + 1; i < lines.length; i++) {
      if (!lines[i]) continue
      if (lines[i].endsWith(":")) break // next label = end of IT Requests
      if (lines[i].toLowerCase() === "email address") {
        needsEmail = true
        break
      }
    }
  }

  return { firstName, lastName, jobTitle, department, needsEmail }
}

export default function Home() {
  const [mode, setMode] = useState<"paste" | "manual">("paste")
  const [ticketText, setTicketText] = useState("")
  const [parsed, setParsed] = useState<ParsedTicket | null>(null)
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

  const activeForm = mode === "paste" && parsed?.needsEmail
    ? { firstName: parsed.firstName, lastName: parsed.lastName, jobTitle: parsed.jobTitle, department: parsed.department }
    : form

  const emailPreview =
    activeForm.firstName.trim() && activeForm.lastName.trim()
      ? `${activeForm.firstName.trim().toLowerCase().replace(/[^a-z]/g, "")}.${activeForm.lastName.trim().toLowerCase().replace(/[^a-z]/g, "")}@resurrection.church`
      : null

  const handleParse = () => {
    const p = parseTicket(ticketText)
    setParsed(p)
    if (p.needsEmail) {
      setForm({ firstName: p.firstName, lastName: p.lastName, jobTitle: p.jobTitle, department: p.department })
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const res = await fetch("/api/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activeForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create account")
      setResult({ email: data.email, password: data.password })
      setForm({ firstName: "", lastName: "", jobTitle: "", department: "" })
      setParsed(null)
      setTicketText("")
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

  const inputClass = "w-full bg-zinc-800 border border-zinc-700 focus:border-[#0078d4] text-white placeholder-zinc-600 text-sm rounded-lg px-3 py-2 outline-none transition-colors"

  const formField = (label: string, key: keyof FormState, required = false, placeholder = "") => (
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
        className={inputClass}
      />
    </div>
  )

  if (result) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <Header />
        <main className="max-w-lg mx-auto px-4 py-10">
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
                  <code className="flex-1 bg-zinc-800 text-blue-400 text-sm px-3 py-2 rounded-lg font-mono">{result.email}</code>
                  <button onClick={() => copyToClipboard(result.email, "email")} className="text-zinc-400 hover:text-white text-xs px-2 py-2 transition-colors">
                    {copied === "email" ? "✓" : "Copy"}
                  </button>
                </div>
              </div>
              <div>
                <p className="text-zinc-500 text-xs mb-1.5">Temporary password</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-zinc-800 text-white text-sm px-3 py-2 rounded-lg font-mono">{result.password}</code>
                  <button onClick={() => copyToClipboard(result.password, "password")} className="text-zinc-400 hover:text-white text-xs px-2 py-2 transition-colors">
                    {copied === "password" ? "✓" : "Copy"}
                  </button>
                </div>
              </div>
              <p className="text-zinc-600 text-xs">User must change their password on first sign-in.</p>
            </div>
            <button onClick={() => setResult(null)} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-sm py-2 rounded-lg transition-colors">
              Create another account
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-10">
        <h1 className="text-white font-bold text-xl mb-1">New Hire Account</h1>
        <p className="text-zinc-500 text-sm mb-6">
          Creates a Microsoft 365 account at resurrection.church with a temporary password.
        </p>

        {/* Mode tabs */}
        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1 mb-5">
          <button
            onClick={() => { setMode("paste"); setParsed(null) }}
            className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${mode === "paste" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"}`}
          >
            Paste Ticket
          </button>
          <button
            onClick={() => setMode("manual")}
            className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${mode === "manual" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"}`}
          >
            Manual Entry
          </button>
        </div>

        {mode === "paste" ? (
          <div className="space-y-4">
            {!parsed ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
                <div>
                  <label className="text-zinc-400 text-xs block mb-1.5">Paste the full ticket text</label>
                  <textarea
                    value={ticketText}
                    onChange={(e) => setTicketText(e.target.value)}
                    placeholder={"Supervisor Name:\nJoseph Hill\n\nDepartment:\nWorship & Worship Experience\n..."}
                    rows={10}
                    className="w-full bg-zinc-800 border border-zinc-700 focus:border-[#0078d4] text-white placeholder-zinc-600 text-sm rounded-lg px-3 py-2 outline-none transition-colors resize-none font-mono"
                  />
                </div>
                <button
                  onClick={handleParse}
                  disabled={!ticketText.trim()}
                  className="w-full bg-[#0078d4] hover:bg-[#106ebe] disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                >
                  Parse ticket
                </button>
              </div>
            ) : !parsed.needsEmail ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-white font-medium mb-1">No email address requested</p>
                <p className="text-zinc-500 text-sm mb-5">This ticket does not include "Email Address" in the IT Requests section.</p>
                <button onClick={() => setParsed(null)} className="text-zinc-400 hover:text-white text-sm transition-colors">
                  ← Parse another ticket
                </button>
              </div>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-green-500/15 flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-green-400 text-sm font-medium">Email address required</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-zinc-500 text-xs mb-0.5">First name</p>
                    <input
                      value={form.firstName}
                      onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs mb-0.5">Last name</p>
                    <input
                      value={form.lastName}
                      onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div className="col-span-2">
                    <p className="text-zinc-500 text-xs mb-0.5">Job title</p>
                    <input
                      value={form.jobTitle}
                      onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div className="col-span-2">
                    <p className="text-zinc-500 text-xs mb-0.5">Department</p>
                    <input
                      value={form.department}
                      onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                </div>

                {emailPreview && (
                  <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2.5">
                    <p className="text-zinc-500 text-xs mb-0.5">Will create</p>
                    <p className="text-[#0078d4] font-mono text-sm">{emailPreview}</p>
                  </div>
                )}

                {error && (
                  <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
                )}

                <button
                  onClick={() => handleSubmit()}
                  disabled={loading || !form.firstName.trim() || !form.lastName.trim()}
                  className="w-full bg-[#0078d4] hover:bg-[#106ebe] disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                >
                  {loading ? "Creating account…" : "Create account"}
                </button>
                <button onClick={() => setParsed(null)} className="w-full text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
                  ← Parse another ticket
                </button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {formField("First name", "firstName", true)}
              {formField("Last name", "lastName", true)}
            </div>
            {formField("Job title", "jobTitle", true, "e.g. Organist")}
            {formField("Department", "department", false, "e.g. Worship & Worship Experience")}

            {emailPreview && (
              <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2.5">
                <p className="text-zinc-500 text-xs mb-0.5">Will create</p>
                <p className="text-[#0078d4] font-mono text-sm">{emailPreview}</p>
              </div>
            )}

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
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
