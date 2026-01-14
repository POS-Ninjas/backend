import { Context, Next } from 'hono'
import { verify } from 'hono/jwt'

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const token = authHeader.substring(7)
    
    const payload = await verify(
      token,
      'test-is-secret'
    )
    
    // Attach user info to context
    c.set('user', payload)
    
    await next()
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401)
  }
}

