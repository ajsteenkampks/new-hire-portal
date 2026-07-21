const DOMAIN = "resurrection.church"
export const TEMP_PASSWORD = "Resurrection123"

async function getAccessToken(): Promise<string> {
  const res = await fetch(
    `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.AZURE_CLIENT_ID!,
        client_secret: process.env.AZURE_CLIENT_SECRET!,
        scope: "https://graph.microsoft.com/.default",
      }),
    }
  )
  const data = await res.json()
  if (!data.access_token) {
    throw new Error(data.error_description || "Failed to obtain Graph API token")
  }
  return data.access_token
}

function buildUpn(firstName: string, lastName: string) {
  const clean = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]/g, "")
  return `${clean(firstName)}.${clean(lastName)}@${DOMAIN}`
}

export async function createADUser(params: {
  firstName: string
  lastName: string
  jobTitle: string
  department: string
}): Promise<{ upn: string; objectId: string }> {
  const token = await getAccessToken()
  const upn = buildUpn(params.firstName, params.lastName)

  // Check if the user already exists
  const check = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(upn)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (check.ok) {
    throw new Error(`${upn} already exists in Azure AD`)
  }

  const res = await fetch("https://graph.microsoft.com/v1.0/users", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      displayName: `${params.firstName} ${params.lastName}`,
      givenName: params.firstName,
      surname: params.lastName,
      userPrincipalName: upn,
      mailNickname: `${buildUpn(params.firstName, params.lastName).split("@")[0]}`,
      jobTitle: params.jobTitle || undefined,
      department: params.department || undefined,
      usageLocation: "US",
      accountEnabled: true,
      passwordProfile: {
        password: TEMP_PASSWORD,
        forceChangePasswordNextSignIn: true,
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || `Graph API error ${res.status}`)
  }

  const user = await res.json()
  return { upn, objectId: user.id }
}
