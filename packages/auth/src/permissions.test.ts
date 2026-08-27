import { describe, expect, it } from 'vitest'

import { PERMISSIONS, ROLE_PERMISSIONS } from './permissions'

describe('permissions data model', () => {
  it('admin has every permission in PERMISSIONS', () => {
    expect([...ROLE_PERMISSIONS.admin].sort()).toEqual([...PERMISSIONS].sort())
  })

  it('every permission granted to a role is a real, known permission (catches typos)', () => {
    for (const role of Object.keys(
      ROLE_PERMISSIONS,
    ) as (keyof typeof ROLE_PERMISSIONS)[]) {
      for (const permission of ROLE_PERMISSIONS[role]) {
        expect(PERMISSIONS).toContain(permission)
      }
    }
  })

  it('no role has duplicate permissions', () => {
    for (const role of Object.keys(
      ROLE_PERMISSIONS,
    ) as (keyof typeof ROLE_PERMISSIONS)[]) {
      const perms = ROLE_PERMISSIONS[role]
      expect(new Set(perms).size).toBe(perms.length)
    }
  })

  // docs/rbac.md documents manager as "everything analyst has, plus
  // REQUEST_APPROVE and AI_TRACE_VIEW" — pin that relationship so the two
  // don't silently drift apart.
  it('manager is a strict superset of analyst', () => {
    for (const permission of ROLE_PERMISSIONS.analyst) {
      expect(ROLE_PERMISSIONS.manager).toContain(permission)
    }
    expect(ROLE_PERMISSIONS.manager.length).toBeGreaterThan(
      ROLE_PERMISSIONS.analyst.length,
    )
  })

  it('admin is a strict superset of manager', () => {
    for (const permission of ROLE_PERMISSIONS.manager) {
      expect(ROLE_PERMISSIONS.admin).toContain(permission)
    }
    expect(ROLE_PERMISSIONS.admin.length).toBeGreaterThan(
      ROLE_PERMISSIONS.manager.length,
    )
  })
})
