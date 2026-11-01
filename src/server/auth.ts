import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { db, User } from './db'

const JWT_SECRET = process.env.JWT_SECRET || 'codeshield-secret-key-2026-production'
const COOKIE_NAME = 'codeshield_token'

export interface AuthenticatedRequest extends Request {
  user?: User
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  })
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax'
  })
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token = req.cookies?.[COOKIE_NAME]

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.substring(7)
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' })
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string }
    const user = db.findUserById(payload.userId)
    if (!user) {
      return res.status(401).json({ error: 'User account not found or session revoked.' })
    }
    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' })
  }
}
