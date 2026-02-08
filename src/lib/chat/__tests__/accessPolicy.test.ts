import { describe, expect, it } from 'vitest'
import { isWebPortalUnrestricted, WEB_ACCESS_POLICY } from '../accessPolicy'

describe('web access policy', () => {
  it('keeps web portal unrestricted', () => {
    expect(WEB_ACCESS_POLICY.unrestricted).toBe(true)
    expect(isWebPortalUnrestricted()).toBe(true)
  })
})
