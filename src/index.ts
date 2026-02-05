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
 * POST /api/admin/reset
 * Force Reset Database Schema (Fixes 'no column named category' error)
 */
app.post('/api/admin/reset', adminAuth, async (c) => {
  try {
    // Execute the full schema directly
    await c.env.DB.exec(`
      DROP TABLE IF EXISTS cars;
      DROP TABLE IF EXISTS bookings;

      CREATE TABLE cars (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'Sedan',
        image_url TEXT NOT NULL,
        price_per_day REAL NOT NULL,
        transmission TEXT CHECK(transmission IN ('Auto', 'Manual')) NOT NULL,
        status TEXT DEFAULT 'Available'
      );

      CREATE TABLE bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        car_id INTEGER NOT NULL,
        car_name TEXT NOT NULL,
        customer_name TEXT, 
        customer_phone TEXT,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        total_days INTEGER NOT NULL,
        total_price REAL NOT NULL,
        status TEXT DEFAULT 'Pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(car_id) REFERENCES cars(id)
      );

      INSERT INTO cars (name, category, image_url, price_per_day, transmission, status) VALUES 
      ('Perodua Axia 1.0 G', 'Ekonomi', 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=400&q=80', 80.00, 'Auto', 'Available'),
      ('Proton Saga Premium', 'Sedan', 'https://images.unsplash.com/photo-1626847037657-fd3622613ce3?auto=format&fit=crop&w=400&q=80', 90.00, 'Auto', 'Available'),
      ('Perodua Myvi 1.5 AV', 'Compact', 'https://images.unsplash.com/photo-1593182440959-9d5165b29b59?auto=format&fit=crop&w=400&q=80', 120.00, 'Auto', 'Available'),
      ('Perodua Bezza X', 'Sedan', 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=400&q=80', 100.00, 'Auto', 'Available'),
      ('Perodua Alza 1.5 AV', 'MPV', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=400&q=80', 180.00, 'Auto', 'Available'),
      ('Proton X50 Flagship', 'SUV', 'https://images.unsplash.com/photo-1533473359331-0135ef1bcfb0?auto=format&fit=crop&w=400&q=80', 250.00, 'Auto', 'Booked'),
      ('Honda City Hatchback', 'Compact', 'https://images.unsplash.com/photo-1503376763036-066120622c74?auto=format&fit=crop&w=400&q=80', 200.00, 'Auto', 'Available'),
      ('Toyota Vios G', 'Sedan', 'https://images.unsplash.com/photo-1623869675781-804f75ad957f?auto=format&fit=crop&w=400&q=80', 220.00, 'Auto', 'Available'),
      ('Toyota Veloz', 'MPV', 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=400&q=80', 300.00, 'Auto', 'Available'),
      ('Perodua Aruz', 'SUV', 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=400&q=80', 230.00, 'Auto', 'Booked'),
      ('Proton Persona', 'Sedan', 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=400&q=80', 130.00, 'Auto', 'Available'),
      ('Honda HR-V', 'SUV', 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=400&q=80', 350.00, 'Auto', 'Available');
    `)
    return c.json({ success: true })
  } catch (e: any) {
    console.error("Reset failed", e)
    return c.json({ success: false, error: e.message }, 500)
  }
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
  try {
    const body = await c.req.json()
    const { name, category, image_url, price_per_day, transmission, status } = body
    
    // Ensure price is a number and provide defaults
    const price = parseFloat(price_per_day)
    const carStatus = status || 'Available'

    const res = await c.env.DB.prepare(`
      INSERT INTO cars (name, category, image_url, price_per_day, transmission, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(name, category, image_url, price, transmission, carStatus).run()
    
    return c.json({ success: true, id: res.meta.last_row_id })
  } catch (e: any) {
    console.error("Error adding car:", e)
    return c.json({ success: false, error: e.message }, 500)
  }
})

/**
 * PUT /api/admin/cars/:id
 * Update car details/status
 */
app.put('/api/admin/cars/:id', adminAuth, async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const { name, category, image_url, price_per_day, transmission, status } = body
    
    const price = parseFloat(price_per_day)

    await c.env.DB.prepare(`
      UPDATE cars 
      SET name=?, category=?, image_url=?, price_per_day=?, transmission=?, status=?
      WHERE id=?
    `).bind(name, category, image_url, price, transmission, status, id).run()

    return c.json({ success: true })
  } catch (e: any) {
    console.error("Error updating car:", e)
    return c.json({ success: false, error: e.message }, 500)
  }
})

/**
 * DELETE /api/admin/cars/:id
 * Remove a car
 */
app.delete('/api/admin/cars/:id', adminAuth, async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare("DELETE FROM cars WHERE id=?").bind(id).run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// Serve static assets
app.get('/*', (c) => {
  return c.env.ASSETS.fetch(c.req.raw)
})

export default app