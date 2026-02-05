import { Hono } from 'hono'
import { cors } from 'hono/cors'

// Define the shape of our Cloudflare bindings
type Bindings = {
  DB: D1Database
  ASSETS: Fetcher
  ADMIN_PASSWORD?: string // Set this in Cloudflare secrets later. Default is "admin123"
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS
app.use('/api/*', cors())

// --- Public Endpoints ---

/**
 * GET /api/cars
 * Fetch all cars
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
 * POST /api/bookings
 * Save a new booking request before redirecting to WhatsApp
 */
app.post('/api/bookings', async (c) => {
  const body = await c.req.json()
  const { car_id, car_name, start_date, end_date, total_days, total_price } = body

  try {
    const res = await c.env.DB.prepare(`
      INSERT INTO bookings (car_id, car_name, start_date, end_date, total_days, total_price)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(car_id, car_name, start_date, end_date, total_days, total_price).run()

    return c.json({ success: true, id: res.meta.last_row_id })
  } catch (e) {
    console.error(e)
    return c.json({ error: 'Failed to create booking' }, 500)
  }
})

// --- Admin Endpoints ---

// Simple Middleware for Admin Auth
const adminAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization')
  // In production, use c.env.ADMIN_PASSWORD. Defaulting to 'admin123' for demo.
  const password = c.env.ADMIN_PASSWORD || 'admin123'
  
  if (authHeader !== `Bearer ${password}`) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
}

/**
 * POST /api/login
 * Verify admin password
 */
app.post('/api/login', async (c) => {
  const { password } = await c.req.json()
  const correctPassword = c.env.ADMIN_PASSWORD || 'admin123'

  if (password === correctPassword) {
    return c.json({ success: true, token: correctPassword })
  }
  return c.json({ success: false }, 401)
})

/**
 * GET /api/admin/bookings
 * List all bookings
 */
app.get('/api/admin/bookings', adminAuth, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM bookings ORDER BY created_at DESC"
  ).all()
  return c.json(results)
})

/**
 * POST /api/admin/cars
 * Add a new car
 */
app.post('/api/admin/cars', adminAuth, async (c) => {
  const body = await c.req.json()
  const { name, category, image_url, price_per_day, transmission } = body
  
  await c.env.DB.prepare(`
    INSERT INTO cars (name, category, image_url, price_per_day, transmission, status)
    VALUES (?, ?, ?, ?, ?, 'Available')
  `).bind(name, category, image_url, price_per_day, transmission).run()
  
  return c.json({ success: true })
})

/**
 * PUT /api/admin/cars/:id
 * Update car details/status
 */
app.put('/api/admin/cars/:id', adminAuth, async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const { name, category, image_url, price_per_day, transmission, status } = body

  await c.env.DB.prepare(`
    UPDATE cars 
    SET name=?, category=?, image_url=?, price_per_day=?, transmission=?, status=?
    WHERE id=?
  `).bind(name, category, image_url, price_per_day, transmission, status, id).run()

  return c.json({ success: true })
})

/**
 * DELETE /api/admin/cars/:id
 * Remove a car
 */
app.delete('/api/admin/cars/:id', adminAuth, async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare("DELETE FROM cars WHERE id=?").bind(id).run()
  return c.json({ success: true })
})

// Serve static assets
app.get('/*', (c) => {
  return c.env.ASSETS.fetch(c.req.raw)
})

export default app