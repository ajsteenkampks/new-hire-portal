import { betterAuth } from "better-auth"
import { PostgresDialect } from "kysely"
import { Pool } from "pg"

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL,
  database: new PostgresDialect({
    pool: new Pool({ connectionString: process.env.DATABASE_URL! }),
  }),
  socialProviders: {
    microsoft: {
      clientId: process.env.AZURE_CLIENT_ID!,
      clientSecret: process.env.AZURE_CLIENT_SECRET!,
      tenantId: process.env.AZURE_TENANT_ID,
    },
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3000"],
})
