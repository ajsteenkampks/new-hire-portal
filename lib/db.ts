import { neon } from "@neondatabase/serverless"

function getSql() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set")
  return neon(process.env.DATABASE_URL)
}

export async function ensureSchema() {
  const sql = getSql()
  await sql`
    CREATE TABLE IF NOT EXISTS hire_log (
      id              SERIAL PRIMARY KEY,
      first_name      TEXT NOT NULL,
      last_name       TEXT NOT NULL,
      email           TEXT NOT NULL,
      job_title       TEXT,
      department      TEXT,
      azure_object_id TEXT,
      created_by      TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW()
    )
  `
}

export async function logHire(data: {
  firstName: string
  lastName: string
  email: string
  jobTitle: string
  department: string
  azureObjectId: string
  createdBy: string
}) {
  const sql = getSql()
  await sql`
    INSERT INTO hire_log (first_name, last_name, email, job_title, department, azure_object_id, created_by)
    VALUES (${data.firstName}, ${data.lastName}, ${data.email}, ${data.jobTitle}, ${data.department}, ${data.azureObjectId}, ${data.createdBy})
  `
}

export async function getHireLog() {
  const sql = getSql()
  return sql`SELECT * FROM hire_log ORDER BY created_at DESC LIMIT 100`
}
