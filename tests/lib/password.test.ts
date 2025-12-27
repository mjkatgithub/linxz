import { describe, it, expect, vi, beforeEach } from "vitest"

const bcryptHashMock = vi.fn()
const bcryptCompareMock = vi.fn()

vi.mock("bcryptjs", () => ({
  default: {
    hash: bcryptHashMock,
    compare: bcryptCompareMock
  },
  hash: bcryptHashMock,
  compare: bcryptCompareMock
}))

type PasswordModule = typeof import("~/lib/password")

const loadPasswordModule = () => vi.importActual<PasswordModule>("~/lib/password")

describe("password utilities", () => {
  beforeEach(() => {
    bcryptHashMock.mockReset()
    bcryptCompareMock.mockReset()
  })

  it("hashPassword delegates to bcrypt.hash with configured salt rounds", async () => {
    const plaintext = "super-secret"
    const hashedValue = "deterministic-hash"
    bcryptHashMock.mockResolvedValueOnce(hashedValue)

    const { hashPassword } = await loadPasswordModule()
    const result = await hashPassword(plaintext)

    expect(bcryptHashMock).toHaveBeenCalledTimes(1)
    expect(bcryptHashMock).toHaveBeenCalledWith(plaintext, 12)
    expect(result).toBe(hashedValue)
  })

  it("verifyPassword resolves true for matches and false for mismatches", async () => {
    const { verifyPassword } = await loadPasswordModule()

    bcryptCompareMock.mockResolvedValueOnce(true)
    const match = await verifyPassword("secret", "matching-hash")
    expect(match).toBe(true)

    bcryptCompareMock.mockResolvedValueOnce(false)
    const mismatch = await verifyPassword("secret", "different-hash")
    expect(mismatch).toBe(false)

    expect(bcryptCompareMock).toHaveBeenNthCalledWith(1, "secret", "matching-hash")
    expect(bcryptCompareMock).toHaveBeenNthCalledWith(2, "secret", "different-hash")
  })

  it("propagates errors from bcrypt operations", async () => {
    const hashError = new Error("hash failed")
    bcryptHashMock.mockRejectedValueOnce(hashError)

    const { hashPassword, verifyPassword } = await loadPasswordModule()

    await expect(hashPassword("secret")).rejects.toThrow(hashError)

    const compareError = new Error("compare failed")
    bcryptCompareMock.mockRejectedValueOnce(compareError)

    await expect(verifyPassword("secret", "hash")).rejects.toThrow(compareError)
  })
})

