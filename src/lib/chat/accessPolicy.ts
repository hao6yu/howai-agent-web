export const WEB_ACCESS_POLICY = {
  unrestricted: true,
} as const

export function isWebPortalUnrestricted(): boolean {
  return WEB_ACCESS_POLICY.unrestricted
}
