import { handle } from 'hono/vercel'
import app from '../src/server/vercel'

export const config = {
  runtime: 'edge'
}

export default app

