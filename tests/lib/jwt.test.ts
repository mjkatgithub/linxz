import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

const signMock = vi.fn()
const verifyMock = vi.fn()

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: signMock,
    verify: verifyMock
  },
  sign: signMock,
  verify: verifyMock
}))

type JwtModule = typeof import("~/lib/jwt")

const loadJwtModule = () => vi.importActual<JwtModule>("~/lib/jwt")

describe("jwt utilities", () => {
  let originalSecret: string | undefined

  beforeEach(() => {
    originalSecret = process.env.JWT_SECRET
    vi.resetModules()
    signMock.mockReset()
    verifyMock.mockReset()
  })

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET
    } else {
      process.env.JWT_SECRET = originalSecret
    }
  })

  it("generateToken signs payload with configured secret and expiry", async () => {
    process.env.JWT_SECRET = "unit-secret"
    const payload = {
      userId: 1,
      username: "alice",
      email: "alice@example.com"
    }
    const expectedToken = "signed.jwt.token"
    signMock.mockReturnValueOnce(expectedToken)

    const { generateToken } = await loadJwtModule()
    const token = generateToken(payload)

    expect(signMock).toHaveBeenCalledTimes(1)
    expect(signMock).toHaveBeenCalledWith(payload, "unit-secret", { expiresIn: "7d" })
    expect(token).toBe(expectedToken)
  })

  it("generateToken falls back to default secret when JWT_SECRET is unset", async () => {
    delete process.env.JWT_SECRET
    const payload = {
      userId: 7,
      username: "charlie",
      email: "charlie@example.com"
    }
    const expectedToken = "fallback.jwt.token"
    signMock.mockReturnValueOnce(expectedToken)

    const { generateToken } = await loadJwtModule()
    const token = generateToken(payload)

    expect(signMock).toHaveBeenCalledTimes(1)
    expect(signMock).toHaveBeenCalledWith(payload, "your-super-secret-jwt-key-change-in-production", { expiresIn: "7d" })
    expect(token).toBe(expectedToken)
  })

  it("verifyToken returns decoded payload for valid token", async () => {
    process.env.JWT_SECRET = "unit-secret"
    const decodedPayload = {
      userId: 5,
      username: "bob",
      email: "bob@example.com"
    }
    verifyMock.mockReturnValueOnce(decodedPayload)

    const { verifyToken } = await loadJwtModule()
    const result = verifyToken("valid.jwt.token")

    expect(verifyMock).toHaveBeenCalledTimes(1)
    expect(verifyMock).toHaveBeenCalledWith("valid.jwt.token", "unit-secret")
    expect(result).toEqual(decodedPayload)
  })

  it("verifyToken returns null when jsonwebtoken throws (e.g. expired token)", async () => {
    process.env.JWT_SECRET = "unit-secret"
    const jwtError = new Error("jwt expired")
    verifyMock.mockImplementationOnce(() => {
      throw jwtError
    })

    const { verifyToken } = await loadJwtModule()
    const result = verifyToken("expired.jwt.token")

    expect(verifyMock).toHaveBeenCalledTimes(1)
    expect(verifyMock).toHaveBeenCalledWith("expired.jwt.token", "unit-secret")
    expect(result).toBeNull()
  })

  it("verifyToken returns null for empty token strings", async () => {
    process.env.JWT_SECRET = "unit-secret"
    verifyMock.mockImplementationOnce(() => {
      throw new Error("jwt must be provided")
    })

    const { verifyToken } = await loadJwtModule()
    const result = verifyToken("")

    expect(verifyMock).toHaveBeenCalledTimes(1)
    expect(verifyMock).toHaveBeenCalledWith("", "unit-secret")
    expect(result).toBeNull()
  })

  it("extractTokenFromHeader returns token when Bearer prefix present", async () => {
    process.env.JWT_SECRET = "unit-secret"
    const { extractTokenFromHeader } = await loadJwtModule()

    const result = extractTokenFromHeader("Bearer abc.def")

    expect(result).toBe("abc.def")
  })

  it("extractTokenFromHeader returns null when header missing or malformed", async () => {
    process.env.JWT_SECRET = "unit-secret"
    const { extractTokenFromHeader } = await loadJwtModule()

    expect(extractTokenFromHeader(undefined)).toBeNull()
    expect(extractTokenFromHeader("Token abc")).toBeNull()
  })
})
