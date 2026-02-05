DROP TABLE IF EXISTS cars;

CREATE TABLE cars (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  price_per_day REAL NOT NULL,
  transmission TEXT CHECK(transmission IN ('Auto', 'Manual')) NOT NULL,
  status TEXT DEFAULT 'Available'
);

-- Dummy Data (Malaysian Context)
INSERT INTO cars (name, image_url, price_per_day, transmission, status) VALUES 
('Perodua Axia 1.0 G', 'https://picsum.photos/seed/axia/400/250', 80.00, 'Auto', 'Available'),
('Perodua Myvi 1.5 AV', 'https://picsum.photos/seed/myvi/400/250', 120.00, 'Auto', 'Available'),
('Perodua Bezza X', 'https://picsum.photos/seed/bezza/400/250', 100.00, 'Auto', 'Available'),
('Honda City Hatchback', 'https://picsum.photos/seed/city/400/250', 200.00, 'Auto', 'Booked'),
('Proton X50', 'https://picsum.photos/seed/x50/400/250', 250.00, 'Auto', 'Available');
