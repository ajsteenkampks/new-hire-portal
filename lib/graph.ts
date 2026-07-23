const DOMAIN = "resurrection.church"
export const TEMP_PASSWORD = "Resurrection123"

const F3_PART_NUMBERS = ["SPE_F1", "SPE_F3", "DESKLESSPACK", "Microsoft_365_F3"]
const BUSINESS_PREMIUM_PART_NUMBERS = ["SPB", "Microsoft_365_Business_Premium", "O365_BUSINESS_PREMIUM"]

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
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "")
  return `${clean(firstName)}.${clean(lastName)}@${DOMAIN}`
}

async function findLicenseSku(
  token: string,
  type: "f3" | "businessPremium"
): Promise<{ skuId: string; skuPartNumber: string } | null> {
  const res = await fetch("https://graph.microsoft.com/v1.0/subscribedSkus", {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Could not fetch subscribed licenses from tenant")
  const data = await res.json()
  const skus: Array<{ skuId: string; skuPartNumber: string; prepaidUnits: { enabled: number } }> =
    data.value || []

  const partNumbers = type === "f3" ? F3_PART_NUMBERS : BUSINESS_PREMIUM_PART_NUMBERS
  for (const partNumber of partNumbers) {
    const sku = skus.find((s) => s.skuPartNumber === partNumber)
    if (sku) return { skuId: sku.skuId, skuPartNumber: sku.skuPartNumber }
  }
  return null
}

async function assignLicense(token: string, userId: string, skuId: string): Promise<void> {
  const res = await fetch(`https://graph.microsoft.com/v1.0/users/${userId}/assignLicense`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      addLicenses: [{ skuId, disabledPlans: [] }],
      removeLicenses: [],
    }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || "Failed to assign license")
  }
}

export interface UserMatch {
  displayName: string
  userPrincipalName: string
  accountEnabled: boolean
  jobTitle: string | null
  department: string | null
}

export interface LookupResult {
  searched: string
  matches: UserMatch[]
}

export async function searchUsers(names: string[]): Promise<LookupResult[]> {
  const token = await getAccessToken()
  return Promise.all(
    names.map(async (name): Promise<LookupResult> => {
      const trimmed = name.trim()
      if (!trimmed) return { searched: trimmed, matches: [] }

      const url =
        `https://graph.microsoft.com/v1.0/users` +
        `?$search="displayName:${encodeURIComponent(trimmed)}"` +
        `&$select=displayName,userPrincipalName,accountEnabled,jobTitle,department` +
        `&$top=5`

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          ConsistencyLevel: "eventual",
        },
      })

      if (!res.ok) return { searched: trimmed, matches: [] }
      const data = await res.json()
      return { searched: trimmed, matches: data.value || [] }
    })
  )
}

export async function createADUser(params: {
  firstName: string
  lastName: string
  jobTitle: string
  department: string
  isVariableStatus: boolean
}): Promise<{ upn: string; objectId: string; license: string }> {
  const token = await getAccessToken()
  const upn = buildUpn(params.firstName, params.lastName)

  // Check if user already exists
  const check = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(upn)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (check.ok) {
    throw new Error(`${upn} already exists in Azure AD`)
  }

  // Create user
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
      mailNickname: buildUpn(params.firstName, params.lastName).split("@")[0],
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

  // Assign license
  const licenseType = params.isVariableStatus ? "f3" : "businessPremium"
  const licenseLabel = params.isVariableStatus ? "Microsoft 365 F3" : "Microsoft 365 Business Premium"
  const sku = await findLicenseSku(token, licenseType)

  if (!sku) {
    // User was created but license not found — don't fail the whole operation
    return { upn, objectId: user.id, license: `${licenseLabel} (not found in tenant — assign manually)` }
  }

  await assignLicense(token, user.id, sku.skuId)

  return { upn, objectId: user.id, license: licenseLabel }
}
