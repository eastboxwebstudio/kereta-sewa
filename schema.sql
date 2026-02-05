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
  status TEXT DEFAULT 'Pending', -- Pending, Confirmed, Completed, Cancelled
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(car_id) REFERENCES cars(id)
);

-- Data Demo Lengkap
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
