import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { searchUsers } from "@/lib/graph"

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { names?: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const names = (body.names || []).filter((n) => n.trim())
  if (names.length === 0) {
    return NextResponse.json({ error: "No names provided" }, { status: 400 })
  }
  if (names.length > 163) {
    return NextResponse.json({ error: "Maximum 163 names per lookup" }, { status: 400 })
  }

  try {
    const results = await searchUsers(names)
    return NextResponse.json(results)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
