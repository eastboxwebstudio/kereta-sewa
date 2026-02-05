import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { D1Database } from '@cloudflare/workers-types'

// Define the shape of our Cloudflare bindings
type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for frontend requests
app.use('/api/*', cors())

/**
 * GET /api/cars
 * Fetch all available cars
 */
app.get('/api/cars', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM cars ORDER BY price_per_day ASC"
    ).all()
    
    return c.json(results)
  } catch (e) {
    return c.json({ error: 'Failed to fetch cars' }, 500)
  }
})

/**
 * GET /api/cars/:id
 * Fetch a specific car
 */
app.get('/api/cars/:id', async (c) => {
  const id = c.req.param('id')
  
  try {
    const car = await c.env.DB.prepare(
      "SELECT * FROM cars WHERE id = ?"
    ).bind(id).first()

    if (!car) {
      return c.json({ error: 'Car not found' }, 404)
    }

    return c.json(car)
  } catch (e) {
    return c.json({ error: 'Failed to fetch car details' }, 500)
  }
})

export default app