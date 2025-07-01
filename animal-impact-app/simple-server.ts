import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const DB_FILE = 'data.json';

// Simple JSON database
interface User {
  id: number;
  email: string;
  name: string;
  password: string;
  created_at: string;
}

interface Donation {
  id: number;
  user_id: number;
  organization: string;
  amount: number;
  date: string;
  notes: string;
  created_at: string;
}

interface Conversion {
  id: number;
  user_id: number;
  person_name: string;
  conversion_date: string;
  influence_type: string;
  notes: string;
  created_at: string;
}

interface Media {
  id: number;
  user_id: number;
  platform: string;
  content_type: string;
  reach_estimate: number;
  date: string;
  url: string;
  notes: string;
  created_at: string;
}

interface Campaign {
  id: number;
  user_id: number;
  campaign_name: string;
  organization: string;
  participation_type: string;
  date: string;
  impact_description: string;
  created_at: string;
}

interface Database {
  users: User[];
  donations: Donation[];
  conversions: Conversion[];
  media: Media[];
  campaigns: Campaign[];
  lastId: number;
}

// Initialize database
let db: Database;

function loadDatabase(): Database {
  if (existsSync(DB_FILE)) {
    try {
      const data = readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading database:', error);
    }
  }
  
  // Create default database with demo user
  return {
    users: [],
    donations: [],
    conversions: [],
    media: [],
    campaigns: [],
    lastId: 0
  };
}

function saveDatabase() {
  try {
    writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

// Load initial data
db = loadDatabase();

// Initialize with demo data if empty
async function initializeDemoData() {
  if (db.users.length === 0) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const demoUser: User = {
      id: ++db.lastId,
      email: 'johndoe@gmail.com',
      name: 'John Doe',
      password: hashedPassword,
      created_at: new Date().toISOString()
    };
    
    db.users.push(demoUser);
    
    const today = new Date().toISOString().split('T')[0];
    const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Sample donations
    db.donations.push({
      id: ++db.lastId,
      user_id: demoUser.id,
      organization: 'Animal Sanctuary Fund',
      amount: 200,
      date: today,
      notes: 'Monthly donation',
      created_at: new Date().toISOString()
    });
    
    db.donations.push({
      id: ++db.lastId,
      user_id: demoUser.id,
      organization: 'Wildlife Protection Org',
      amount: 150,
      date: lastMonth,
      notes: 'One-time donation',
      created_at: new Date().toISOString()
    });
    
    db.donations.push({
      id: ++db.lastId,
      user_id: demoUser.id,
      organization: 'Farm Animal Welfare',
      amount: 100,
      date: lastMonth,
      notes: 'Monthly donation',
      created_at: new Date().toISOString()
    });
    
    // Sample conversions
    db.conversions.push({
      id: ++db.lastId,
      user_id: demoUser.id,
      person_name: 'Alice Smith',
      conversion_date: lastMonth,
      influence_type: 'Documentary sharing',
      notes: 'Showed Dominion documentary',
      created_at: new Date().toISOString()
    });
    
    db.conversions.push({
      id: ++db.lastId,
      user_id: demoUser.id,
      person_name: 'Bob Johnson',
      conversion_date: lastMonth,
      influence_type: 'Restaurant visit',
      notes: 'Took to vegan restaurant',
      created_at: new Date().toISOString()
    });
    
    // Sample media
    db.media.push({
      id: ++db.lastId,
      user_id: demoUser.id,
      platform: 'Facebook',
      content_type: 'Video',
      reach_estimate: 500,
      date: today,
      url: '',
      notes: 'Farm animal video',
      created_at: new Date().toISOString()
    });
    
    db.media.push({
      id: ++db.lastId,
      user_id: demoUser.id,
      platform: 'Instagram',
      content_type: 'Story',
      reach_estimate: 200,
      date: today,
      url: '',
      notes: 'Vegan meal photo',
      created_at: new Date().toISOString()
    });
    
    // Sample campaigns
    db.campaigns.push({
      id: ++db.lastId,
      user_id: demoUser.id,
      campaign_name: 'Factory Farm Ban',
      organization: 'Animal Justice League',
      participation_type: 'Petition signing',
      date: lastMonth,
      impact_description: 'Helped gather 1000 signatures',
      created_at: new Date().toISOString()
    });
    
    saveDatabase();
    console.log('Demo data initialized');
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Auth middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/api/register', async (req, res) => {
  try {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = db.users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser: User = {
      id: ++db.lastId,
      email,
      name,
      password: hashedPassword,
      created_at: new Date().toISOString()
    };
    
    db.users.push(newUser);
    saveDatabase();

    // Generate JWT
    const token = jwt.sign({ userId: newUser.id, email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: newUser.id, email: newUser.email, name: newUser.name }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user
    const user = db.users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Dashboard data route
app.get('/api/dashboard', authenticateToken, (req: any, res) => {
  try {
    const userId = req.user.userId;

    // Get user info
    const user = db.users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get statistics
    const userDonations = db.donations.filter(d => d.user_id === userId);
    const userConversions = db.conversions.filter(c => c.user_id === userId);
    const userMedia = db.media.filter(m => m.user_id === userId);
    const userCampaigns = db.campaigns.filter(c => c.user_id === userId);
    
    const totalDonations = userDonations.reduce((sum, d) => sum + d.amount, 0);
    const conversionCount = userConversions.length;
    const mediaCount = userMedia.length;
    const totalReach = userMedia.reduce((sum, m) => sum + m.reach_estimate, 0);
    const campaignCount = userCampaigns.length;

    // Calculate animal impact (average 365 animals saved per person per year going vegan)
    const animalsImpact = conversionCount * 365;

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      stats: {
        totalDonations,
        conversionCount,
        mediaCount,
        totalReach,
        campaignCount,
        animalsImpact
      },
      recent: {
        donations: userDonations.slice(0, 10).reverse(),
        conversions: userConversions.slice(0, 10).reverse(),
        media: userMedia.slice(0, 10).reverse(),
        campaigns: userCampaigns.slice(0, 10).reverse()
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Data entry routes
app.post('/api/donations', authenticateToken, (req: any, res) => {
  try {
    const { organization, amount, date, notes } = req.body;
    const userId = req.user.userId;

    if (!organization || !amount || !date) {
      return res.status(400).json({ error: 'Organization, amount, and date are required' });
    }

    const donation: Donation = {
      id: ++db.lastId,
      user_id: userId,
      organization,
      amount: parseFloat(amount),
      date,
      notes: notes || '',
      created_at: new Date().toISOString()
    };
    
    db.donations.push(donation);
    saveDatabase();
    
    res.status(201).json({ 
      message: 'Donation recorded successfully',
      id: donation.id
    });
  } catch (error) {
    console.error('Create donation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Initialize demo data and start server
initializeDemoData().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  saveDatabase();
  process.exit(0);
});