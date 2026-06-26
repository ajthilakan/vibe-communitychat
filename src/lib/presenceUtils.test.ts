import { describe, it, expect } from 'vitest'
import { uniqueMembers } from './presenceUtils'

describe('uniqueMembers', () => {
  it('returns an empty list for empty state', () => {
    expect(uniqueMembers({})).toEqual([])
  })

  it('maps presence metas to members sorted by display name', () => {
    const members = uniqueMembers({
      u2: [{ user_id: 'u2', display_name: 'Bob' }],
      u1: [{ user_id: 'u1', display_name: 'Alice' }],
    })
    expect(members).toEqual([
      { userId: 'u1', displayName: 'Alice' },
      { userId: 'u2', displayName: 'Bob' },
    ])
  })

  it('collapses multiple metas for the same user (e.g. two tabs) into one', () => {
    const members = uniqueMembers({
      u1: [
        { user_id: 'u1', display_name: 'Alice' },
        { user_id: 'u1', display_name: 'Alice' },
      ],
    })
    expect(members).toEqual([{ userId: 'u1', displayName: 'Alice' }])
  })

  it('falls back to "Someone" when a display name is missing', () => {
    const members = uniqueMembers({ u1: [{ user_id: 'u1' }] })
    expect(members).toEqual([{ userId: 'u1', displayName: 'Someone' }])
  })

  it('skips metas with no user id', () => {
    expect(uniqueMembers({ ghost: [{ display_name: 'Nobody' }] })).toEqual([])
  })
})
