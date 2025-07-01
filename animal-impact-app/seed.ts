import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('animal_impact.db');

async function seedDatabase() {
  try {
    // Check if demo user already exists
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get('johndoe@gmail.com');
    
    if (!existingUser) {
      // Create demo user
      const hashedPassword = await bcrypt.hash('password123', 10);
      const result = db.prepare('INSERT INTO users (email, name, password) VALUES (?, ?, ?)').run(
        'johndoe@gmail.com',
        'John Doe',
        hashedPassword
      );
      
      const userId = result.lastInsertRowid;
      console.log('Demo user created with ID:', userId);
      
      // Add some sample data
      const today = new Date().toISOString().split('T')[0];
      const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Sample donations
      db.prepare('INSERT INTO donations (user_id, organization, amount, date, notes) VALUES (?, ?, ?, ?, ?)').run(
        userId, 'Animal Sanctuary Fund', 200, today, 'Monthly donation'
      );
      db.prepare('INSERT INTO donations (user_id, organization, amount, date, notes) VALUES (?, ?, ?, ?, ?)').run(
        userId, 'Wildlife Protection Org', 150, lastMonth, 'One-time donation'
      );
      db.prepare('INSERT INTO donations (user_id, organization, amount, date, notes) VALUES (?, ?, ?, ?, ?)').run(
        userId, 'Farm Animal Welfare', 100, lastMonth, 'Monthly donation'
      );
      
      // Sample vegan conversions
      db.prepare('INSERT INTO vegan_conversions (user_id, person_name, conversion_date, influence_type, notes) VALUES (?, ?, ?, ?, ?)').run(
        userId, 'Alice Smith', lastMonth, 'Documentary sharing', 'Showed Dominion documentary'
      );
      db.prepare('INSERT INTO vegan_conversions (user_id, person_name, conversion_date, influence_type, notes) VALUES (?, ?, ?, ?, ?)').run(
        userId, 'Bob Johnson', lastMonth, 'Restaurant visit', 'Took to vegan restaurant'
      );
      
      // Sample media shared
      db.prepare('INSERT INTO media_shared (user_id, platform, content_type, reach_estimate, date, url, notes) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        userId, 'Facebook', 'Video', 500, today, '', 'Farm animal video'
      );
      db.prepare('INSERT INTO media_shared (user_id, platform, content_type, reach_estimate, date, url, notes) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        userId, 'Instagram', 'Story', 200, today, '', 'Vegan meal photo'
      );
      
      // Sample campaigns
      db.prepare('INSERT INTO campaigns (user_id, campaign_name, organization, participation_type, date, impact_description) VALUES (?, ?, ?, ?, ?, ?)').run(
        userId, 'Factory Farm Ban', 'Animal Justice League', 'Petition signing', lastMonth, 'Helped gather 1000 signatures'
      );
      
      console.log('Sample data added for demo user');
    } else {
      console.log('Demo user already exists');
    }
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    db.close();
  }
}

seedDatabase();