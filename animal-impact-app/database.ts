import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Create database connection
const dbPath = process.env.NODE_ENV === 'production' 
  ? (process.env.DATABASE_PATH || '/app/data/animal_impact.db')
  : 'animal_impact.db';

// Ensure directory exists in production
if (process.env.NODE_ENV === 'production') {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const db = new sqlite3.Database(dbPath);

// Promisify database methods for async/await usage
const dbRun = (sql: string, params: any[] = []) => {
  return new Promise<sqlite3.RunResult>((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const dbGet = (sql: string, params: any[] = []) => {
  return new Promise<any>((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql: string, params: any[] = []) => {
  return new Promise<any[]>((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

async function initializeDatabase() {
  try {
    console.log('Creating database schema...');
    
    // Create tables
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS donations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        organization TEXT NOT NULL,
        amount REAL NOT NULL,
        date DATE NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS vegan_conversions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        person_name TEXT NOT NULL,
        conversion_date DATE NOT NULL,
        influence_type TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS media_shared (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        platform TEXT NOT NULL,
        content_type TEXT NOT NULL,
        reach_estimate INTEGER DEFAULT 0,
        date DATE NOT NULL,
        url TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        campaign_name TEXT NOT NULL,
        organization TEXT,
        participation_type TEXT NOT NULL,
        date DATE NOT NULL,
        impact_description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_donations_user_id ON donations(user_id)`);
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_conversions_user_id ON vegan_conversions(user_id)`);
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_media_user_id ON media_shared(user_id)`);
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id)`);

    console.log('Database schema created successfully!');

    // Check if demo user exists
    const demoUser = await dbGet('SELECT id FROM users WHERE email = ?', ['johndoe@gmail.com']);
    
    if (!demoUser) {
      console.log('Creating demo user...');
      
      // Create demo user
      const hashedPassword = await bcrypt.hash('password123', 10);
      const result = await dbRun(
        'INSERT INTO users (email, name, password) VALUES (?, ?, ?)',
        ['johndoe@gmail.com', 'John Doe', hashedPassword]
      );
      
      const userId = result.lastID;
      console.log('Demo user created with ID:', userId);
      
      // Add sample data
      const today = new Date().toISOString().split('T')[0];
      const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Sample donations
      await dbRun(
        'INSERT INTO donations (user_id, organization, amount, date, notes) VALUES (?, ?, ?, ?, ?)',
        [userId, 'Animal Sanctuary Fund', 200.00, today, 'Monthly donation']
      );
      await dbRun(
        'INSERT INTO donations (user_id, organization, amount, date, notes) VALUES (?, ?, ?, ?, ?)',
        [userId, 'Wildlife Protection Org', 150.00, lastMonth, 'One-time donation']
      );
      await dbRun(
        'INSERT INTO donations (user_id, organization, amount, date, notes) VALUES (?, ?, ?, ?, ?)',
        [userId, 'Farm Animal Welfare', 100.00, lastMonth, 'Monthly donation']
      );
      await dbRun(
        'INSERT INTO donations (user_id, organization, amount, date, notes) VALUES (?, ?, ?, ?, ?)',
        [userId, 'Humane Society', 75.00, twoMonthsAgo, 'Holiday donation']
      );
      await dbRun(
        'INSERT INTO donations (user_id, organization, amount, date, notes) VALUES (?, ?, ?, ?, ?)',
        [userId, 'Best Friends Animal Society', 125.00, twoMonthsAgo, 'One-time donation']
      );
      
      // Sample vegan conversions
      await dbRun(
        'INSERT INTO vegan_conversions (user_id, person_name, conversion_date, influence_type, notes) VALUES (?, ?, ?, ?, ?)',
        [userId, 'Alice Smith', lastMonth, 'Documentary sharing', 'Showed Dominion documentary']
      );
      await dbRun(
        'INSERT INTO vegan_conversions (user_id, person_name, conversion_date, influence_type, notes) VALUES (?, ?, ?, ?, ?)',
        [userId, 'Bob Johnson', lastMonth, 'Restaurant visit', 'Took to vegan restaurant']
      );
      await dbRun(
        'INSERT INTO vegan_conversions (user_id, person_name, conversion_date, influence_type, notes) VALUES (?, ?, ?, ?, ?)',
        [userId, 'Sarah Wilson', twoMonthsAgo, 'Recipe sharing', 'Shared amazing vegan recipes']
      );
      await dbRun(
        'INSERT INTO vegan_conversions (user_id, person_name, conversion_date, influence_type, notes) VALUES (?, ?, ?, ?, ?)',
        [userId, 'Mike Davis', twoMonthsAgo, 'Health discussion', 'Discussed health benefits of plant-based diet']
      );
      await dbRun(
        'INSERT INTO vegan_conversions (user_id, person_name, conversion_date, influence_type, notes) VALUES (?, ?, ?, ?, ?)',
        [userId, 'Emma Brown', twoMonthsAgo, 'Environmental facts', 'Shared environmental impact data']
      );
      await dbRun(
        'INSERT INTO vegan_conversions (user_id, person_name, conversion_date, influence_type, notes) VALUES (?, ?, ?, ?, ?)',
        [userId, 'Chris Lee', twoMonthsAgo, 'Cooking class', 'Taught vegan cooking class']
      );
      await dbRun(
        'INSERT INTO vegan_conversions (user_id, person_name, conversion_date, influence_type, notes) VALUES (?, ?, ?, ?, ?)',
        [userId, 'Jessica Taylor', twoMonthsAgo, 'Book recommendation', 'Recommended "Eating Animals" by Jonathan Safran Foer']
      );
      await dbRun(
        'INSERT INTO vegan_conversions (user_id, person_name, conversion_date, influence_type, notes) VALUES (?, ?, ?, ?, ?)',
        [userId, 'David Rodriguez', twoMonthsAgo, 'Farm sanctuary visit', 'Visited local farm sanctuary together']
      );
      
      // Sample media shared
      await dbRun(
        'INSERT INTO media_shared (user_id, platform, content_type, reach_estimate, date, url, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, 'Facebook', 'Video', 500, today, '', 'Farm animal sanctuary video']
      );
      await dbRun(
        'INSERT INTO media_shared (user_id, platform, content_type, reach_estimate, date, url, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, 'Instagram', 'Story', 200, today, '', 'Vegan meal photo']
      );
      await dbRun(
        'INSERT INTO media_shared (user_id, platform, content_type, reach_estimate, date, url, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, 'Twitter', 'Post', 150, lastMonth, '', 'Animal rights awareness tweet']
      );
      await dbRun(
        'INSERT INTO media_shared (user_id, platform, content_type, reach_estimate, date, url, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, 'LinkedIn', 'Article', 300, lastMonth, '', 'Corporate animal welfare article']
      );
      await dbRun(
        'INSERT INTO media_shared (user_id, platform, content_type, reach_estimate, date, url, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, 'TikTok', 'Video', 1200, twoMonthsAgo, '', 'Vegan recipe tutorial']
      );
      await dbRun(
        'INSERT INTO media_shared (user_id, platform, content_type, reach_estimate, date, url, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, 'YouTube', 'Video', 850, twoMonthsAgo, '', 'Documentary recommendation video']
      );
      
      // Sample campaigns
      await dbRun(
        'INSERT INTO campaigns (user_id, campaign_name, organization, participation_type, date, impact_description) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, 'Factory Farm Ban Initiative', 'Animal Justice League', 'Petition signing', lastMonth, 'Helped gather 1000 signatures for factory farming ban']
      );
      await dbRun(
        'INSERT INTO campaigns (user_id, campaign_name, organization, participation_type, date, impact_description) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, 'Wildlife Protection March', 'Wildlife Defense Fund', 'Event participation', twoMonthsAgo, 'Participated in march for wildlife corridor protection']
      );
      await dbRun(
        'INSERT INTO campaigns (user_id, campaign_name, organization, participation_type, date, impact_description) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, 'Corporate Cage-Free Campaign', 'Mercy For Animals', 'Email campaign', twoMonthsAgo, 'Sent 50 emails to corporations requesting cage-free policies']
      );
      await dbRun(
        'INSERT INTO campaigns (user_id, campaign_name, organization, participation_type, date, impact_description) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, 'Climate Action for Animals', 'Animal Agriculture Reform Initiative', 'Social media advocacy', twoMonthsAgo, 'Shared 25 posts about animal agriculture and climate change']
      );
      await dbRun(
        'INSERT INTO campaigns (user_id, campaign_name, organization, participation_type, date, impact_description) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, 'End Fur Fashion Campaign', 'PETA', 'Store protests', twoMonthsAgo, 'Participated in peaceful protests at 3 stores selling fur']
      );
      
      console.log('Sample data added for demo user');
    } else {
      console.log('Demo user already exists');
    }

    console.log('Database initialization completed successfully!');

  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Test database connection
async function testConnection() {
  try {
    const result = await dbGet('SELECT datetime("now") as now');
    console.log('Database connected successfully at:', result.now);
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

// Run initialization if this file is executed directly
if (import.meta.main) {
  testConnection()
    .then(() => initializeDatabase())
    .then(() => {
      console.log('✅ Database setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database setup failed:', error);
      process.exit(1);
    });
}

export { db, dbRun, dbGet, dbAll, initializeDatabase, testConnection };