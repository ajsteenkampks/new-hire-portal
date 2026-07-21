import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { createADUser, TEMP_PASSWORD } from "@/lib/graph"
import { ensureSchema, logHire } from "@/lib/db"

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { firstName?: string; lastName?: string; jobTitle?: string; department?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { firstName, lastName, jobTitle = "", department = "" } = body
  if (!firstName?.trim() || !lastName?.trim()) {
    return NextResponse.json({ error: "First and last name are required" }, { status: 400 })
  }

  try {
    await ensureSchema()
    const { upn, objectId } = await createADUser({ firstName: firstName.trim(), lastName: lastName.trim(), jobTitle, department })
    await logHire({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: upn,
      jobTitle,
      department,
      azureObjectId: objectId,
      createdBy: session.user.email || session.user.name || "unknown",
    })
    return NextResponse.json({ email: upn, password: TEMP_PASSWORD, objectId })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
