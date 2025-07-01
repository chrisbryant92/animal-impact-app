# Animal Impact App - Full Stack with SQLite Database

A complete full-stack web application for tracking your contribution to animal welfare causes, now powered by a robust SQLite database for persistent data storage.

## ✨ Features

### 🔐 **Secure User Authentication**
- JWT-based authentication with secure password hashing
- User registration and login with persistent sessions
- Protected routes and API endpoints

### 📊 **Impact Tracking Dashboard**
- **Charitable Donations**: Track contributions to animal welfare organizations
- **Vegan Conversions**: Record people you've influenced to go vegan
- **Media Advocacy**: Log social media posts and content shared for animal rights
- **Campaign Participation**: Document involvement in animal welfare campaigns

### 🧮 **Automatic Impact Calculation**
- Real-time calculation of animals saved based on vegan conversions
- Statistical analysis of total impact across all categories
- Comprehensive metrics and progress tracking

### 💾 **Persistent Data Storage**
- SQLite database with proper schema design and indexes
- Full ACID compliance for data integrity
- Automatic database initialization and migration
- Rich sample data for demo purposes

## 🛠 Technology Stack

### Frontend
- **React 19** with TypeScript for type safety
- **React Router** for client-side navigation
- **Tailwind CSS** for modern, responsive styling
- **Vite** for fast development and optimized builds

### Backend
- **Express.js** with TypeScript for the REST API
- **SQLite3** for reliable, file-based database storage
- **bcryptjs** for secure password hashing
- **JWT** for stateless authentication
- **Express Rate Limiting** for security

### Security Features
- Password hashing with bcrypt (10 rounds)
- JWT tokens with configurable expiration
- Rate limiting (100 requests per 15 minutes per IP)
- CORS protection
- Input validation and sanitization
- SQL injection prevention with parameterized queries

## 🚀 Quick Start

### 1. Install Dependencies
```bash
bun install
```

### 2. Initialize Database
```bash
bun run database.ts
```

### 3. Start Development
```bash
# Start both backend and frontend in development mode
bun run dev

# Or start them separately:
bun run server:dev  # Backend on port 3001
bun run frontend:dev  # Frontend on port 3000
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/health

## 🎮 Demo Account

The application comes with a pre-loaded demo account containing realistic sample data:

**Login Credentials:**
- **Email**: johndoe@gmail.com
- **Password**: password123

**Sample Data Includes:**
- **$650** in total donations across 5 organizations
- **8 vegan conversions** (≈ 2,920 animals saved annually)
- **6 social media posts** reaching 3,200+ people
- **5 campaign participations** including petition signing and protests

## 📂 Database Schema

### Tables
- **users**: User accounts with authentication data
- **donations**: Charitable contribution records
- **vegan_conversions**: People influenced to go vegan
- **media_shared**: Social media advocacy content
- **campaigns**: Animal welfare campaign participation

### Indexes
- Optimized queries with foreign key indexes
- Fast lookups for user-specific data

## 🔧 Configuration

### Environment Variables (.env)
```bash
# Database Configuration
DATABASE_FILE=animal_impact.db

# Application Configuration
PORT=3001
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### Scripts
```bash
bun run dev          # Start full development environment
bun run build        # Build for production
bun run start        # Start production server
bun run server:dev   # Development backend only
bun run frontend:dev # Development frontend only
```

## 📊 API Endpoints

### Authentication
- `POST /api/register` - Create new user account
- `POST /api/login` - User authentication

### Dashboard
- `GET /api/dashboard` - Get user statistics and recent activity

### Data Entry
- `POST /api/donations` - Record new donation
- `POST /api/conversions` - Record vegan conversion
- `POST /api/media` - Record media sharing
- `POST /api/campaigns` - Record campaign participation

### System
- `GET /api/health` - Database and system health check

## 🏗 Production Deployment

### Build for Production
```bash
bun run build
bun run start
```

### Environment Setup
1. Set strong JWT secret in production
2. Configure proper CORS origins
3. Set up HTTPS with reverse proxy
4. Enable database backups
5. Configure rate limiting based on traffic

### Database Backup
```bash
# SQLite database file location
./animal_impact.db

# Backup command
cp animal_impact.db animal_impact_backup_$(date +%Y%m%d).db
```

## 🐘 Why SQLite?

SQLite was chosen for this application because:

- **Zero Configuration**: No server setup required
- **ACID Compliant**: Full transaction support
- **Highly Reliable**: Battle-tested in production
- **Portable**: Single file database
- **Performance**: Excellent for read-heavy workloads
- **Embedded**: Perfect for self-contained applications

## 💡 Animal Impact Calculations

The application uses research-based estimates:

- **Vegan Impact**: Each person going vegan saves approximately 365 animals per year
- **Donation Tracking**: Monitor financial contributions to maximize impact
- **Reach Metrics**: Track social media advocacy effectiveness
- **Campaign Results**: Document collective action participation

## 🔮 Future Enhancements

- **Data Visualization**: Interactive charts and graphs
- **Export Functionality**: PDF reports and CSV exports
- **Social Features**: Share achievements and compare impact
- **Mobile App**: React Native companion app
- **Integration APIs**: Connect with donation platforms
- **Advanced Analytics**: Trend analysis and projections

## 🐾 Contributing

This application demonstrates best practices for:
- Full-stack TypeScript development
- Secure authentication implementation
- Database design and optimization
- RESTful API architecture
- Modern React patterns
- Production-ready configurations

## 📄 License

Open source - feel free to use this as a foundation for your own animal welfare applications!

---

*Track your impact. Save more animals. Make a difference.* 🐾