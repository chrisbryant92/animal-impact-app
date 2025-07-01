import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import dotenv from 'dotenv';
import { dbRun, dbGet, dbAll, testConnection } from './database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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
    const existingUser = await dbGet('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await dbRun(
      'INSERT INTO users (email, name, password) VALUES (?, ?, ?)',
      [email, name, hashedPassword]
    );
    
    const userId = result.lastID;

    // Generate JWT
    const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: userId, email, name }
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
    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
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
app.get('/api/dashboard', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;

    // Get user info
    const user = await dbGet('SELECT id, email, name, created_at FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get statistics
    const totalDonationsResult = await dbGet('SELECT COALESCE(SUM(amount), 0) as total FROM donations WHERE user_id = ?', [userId]);
    const conversionCountResult = await dbGet('SELECT COUNT(*) as count FROM vegan_conversions WHERE user_id = ?', [userId]);
    const mediaCountResult = await dbGet('SELECT COUNT(*) as count FROM media_shared WHERE user_id = ?', [userId]);
    const totalReachResult = await dbGet('SELECT COALESCE(SUM(reach_estimate), 0) as total FROM media_shared WHERE user_id = ?', [userId]);
    const campaignCountResult = await dbGet('SELECT COUNT(*) as count FROM campaigns WHERE user_id = ?', [userId]);

    const totalDonations = totalDonationsResult?.total || 0;
    const conversionCount = conversionCountResult?.count || 0;
    const mediaCount = mediaCountResult?.count || 0;
    const totalReach = totalReachResult?.total || 0;
    const campaignCount = campaignCountResult?.count || 0;

    // Get recent data
    const recentDonations = await dbAll('SELECT * FROM donations WHERE user_id = ? ORDER BY date DESC, created_at DESC LIMIT 10', [userId]);
    const recentConversions = await dbAll('SELECT * FROM vegan_conversions WHERE user_id = ? ORDER BY conversion_date DESC, created_at DESC LIMIT 10', [userId]);
    const recentMedia = await dbAll('SELECT * FROM media_shared WHERE user_id = ? ORDER BY date DESC, created_at DESC LIMIT 10', [userId]);
    const recentCampaigns = await dbAll('SELECT * FROM campaigns WHERE user_id = ? ORDER BY date DESC, created_at DESC LIMIT 10', [userId]);

    // Calculate animal impact (average 365 animals saved per person per year going vegan)
    const animalsImpact = conversionCount * 365;

    res.json({
      user,
      stats: {
        totalDonations,
        conversionCount,
        mediaCount,
        totalReach,
        campaignCount,
        animalsImpact
      },
      recent: {
        donations: recentDonations,
        conversions: recentConversions,
        media: recentMedia,
        campaigns: recentCampaigns
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Data entry routes
app.post('/api/donations', authenticateToken, async (req: any, res) => {
  try {
    const { organization, amount, date, notes } = req.body;
    const userId = req.user.userId;

    if (!organization || !amount || !date) {
      return res.status(400).json({ error: 'Organization, amount, and date are required' });
    }

    const result = await dbRun(
      'INSERT INTO donations (user_id, organization, amount, date, notes) VALUES (?, ?, ?, ?, ?)',
      [userId, organization, parseFloat(amount), date, notes || '']
    );
    
    res.status(201).json({ 
      message: 'Donation recorded successfully',
      id: result.lastID
    });
  } catch (error) {
    console.error('Create donation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/conversions', authenticateToken, async (req: any, res) => {
  try {
    const { person_name, conversion_date, influence_type, notes } = req.body;
    const userId = req.user.userId;

    if (!person_name || !conversion_date) {
      return res.status(400).json({ error: 'Person name and conversion date are required' });
    }

    const result = await dbRun(
      'INSERT INTO vegan_conversions (user_id, person_name, conversion_date, influence_type, notes) VALUES (?, ?, ?, ?, ?)',
      [userId, person_name, conversion_date, influence_type || '', notes || '']
    );
    
    res.status(201).json({ 
      message: 'Conversion recorded successfully',
      id: result.lastID
    });
  } catch (error) {
    console.error('Create conversion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/media', authenticateToken, async (req: any, res) => {
  try {
    const { platform, content_type, reach_estimate, date, url, notes } = req.body;
    const userId = req.user.userId;

    if (!platform || !content_type || !date) {
      return res.status(400).json({ error: 'Platform, content type, and date are required' });
    }

    const result = await dbRun(
      'INSERT INTO media_shared (user_id, platform, content_type, reach_estimate, date, url, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, platform, content_type, parseInt(reach_estimate) || 0, date, url || '', notes || '']
    );
    
    res.status(201).json({ 
      message: 'Media shared recorded successfully',
      id: result.lastID
    });
  } catch (error) {
    console.error('Create media error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/campaigns', authenticateToken, async (req: any, res) => {
  try {
    const { campaign_name, organization, participation_type, date, impact_description } = req.body;
    const userId = req.user.userId;

    if (!campaign_name || !participation_type || !date) {
      return res.status(400).json({ error: 'Campaign name, participation type, and date are required' });
    }

    const result = await dbRun(
      'INSERT INTO campaigns (user_id, campaign_name, organization, participation_type, date, impact_description) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, campaign_name, organization || '', participation_type, date, impact_description || '']
    );
    
    res.status(201).json({ 
      message: 'Campaign participation recorded successfully',
      id: result.lastID
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await testConnection();
    const stats = {
      status: 'healthy',
      database: 'connected',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      }
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      database: 'disconnected', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const __dirname = path.dirname(new URL(import.meta.url).pathname);
  app.use(express.static(path.join(__dirname, 'dist')));
  
  // Handle React routing
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Start server
async function startServer() {
  try {
    // Test database connection before starting server
    await testConnection();
    console.log('✅ Database connection verified');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Dashboard: http://localhost:${PORT}`);
      console.log(`🔗 API: http://localhost:${PORT}/api`);
      console.log(`🗄️ Database: SQLite (animal_impact.db)`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});

startServer();