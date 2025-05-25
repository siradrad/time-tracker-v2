# Time Tracker V2 🕒

A modern, responsive time tracking application built with React and Vite, featuring admin management capabilities, CSI division task tracking, Progressive Web App (PWA) functionality, and **Supabase database backend**.

## ✨ Features

### Core Functionality
- **Multi-Timer System**: Independent work, travel, and break/lunch timers with mutual exclusivity
- **User Management**: Admin and regular user roles with different capabilities
- **Time Entry Management**: Create, edit, delete, and organize time entries
- **Job Address Management**: Organize work by specific job sites
- **CSI Division Tasks**: Industry-standard construction task categorization

### Database & Backend
- **Supabase Integration**: Real PostgreSQL database backend with Row Level Security
- **Multi-User Support**: Multiple users can access the app simultaneously
- **Real-time Updates**: Live data synchronization across devices
- **Data Persistence**: Secure, scalable data storage with automatic backups
- **Authentication**: Secure login system with password hashing

### Admin Features
- **Hierarchical Dashboard**: Time entries organized by year > month > biweekly periods
- **User Management**: View all users' time entries and statistics
- **CSI Task Management**: Add, edit, and delete CSI division tasks
- **Data Management**: Clear all system data (admin only)

### Progressive Web App (PWA)
- **Offline Functionality**: Works without internet connection
- **App Installation**: Install on mobile devices and desktop
- **Push Notifications**: Ready for future notification features
- **Background Sync**: Prepared for automatic data synchronization

### Technical Features
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Dual Storage Modes**: localStorage (development) or Supabase (production)
- **Modern UI**: Clean, professional interface with accessibility features
- **Real-time Updates**: Live timer updates and instant data persistence

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm/yarn
- Supabase account (for database mode) - [Sign up here](https://supabase.com)

### Development Setup
```bash
# Clone the repository
git clone [your-repository-url]
cd time-tracker-v2

# Install dependencies
npm install

# Start development server (localStorage mode)
npm run dev
```

Visit `http://localhost:3000` to access the application.

### Database Setup (Recommended for Production)

For full database functionality with Supabase:

1. **Follow the Setup Guide**: See `SUPABASE_SETUP.md` for complete instructions
2. **Quick Setup**:
   ```bash
   # Create environment file
   cp .env.example .env
   
   # Add your Supabase credentials to .env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. **Run the database schema** in your Supabase SQL editor
4. **Switch to database mode** by updating imports in `src/lib/supabase.js`

### Test Accounts
- **Admin**: admin@timetracker.app / admin123
- **Stacy**: stacy@timetracker.app / stacy123
- **Jeremy**: jeremy@timetracker.app / jeremy123  
- **Humberto**: humberto@timetracker.app / humberto123
- **Enrique**: enrique@timetracker.app / enrique123
- **Drew**: drew@timetracker.app / drew123
- **Enrique Sr**: enriquesr@timetracker.app / enriquesr123
- **Karen**: karen@timetracker.app / karen123
- **Anthony**: anthony@timetracker.app / anthony123
- **Angela**: angela@timetracker.app / angela123

## 📊 Storage Modes

### localStorage Mode (Default)
- **Use Case**: Development, testing, single-user scenarios
- **Data Storage**: Browser localStorage
- **Limitations**: Single device, data lost on browser clear
- **Advantages**: No setup required, works offline

### Supabase Database Mode (Recommended)
- **Use Case**: Production, multi-user, team environments
- **Data Storage**: PostgreSQL database via Supabase
- **Features**: Multi-user, real-time sync, secure, scalable
- **Setup Required**: See `SUPABASE_SETUP.md`

## 📱 PWA Installation

### For End Users

#### On Mobile (iOS/Android)
1. Open the app in your mobile browser
2. Look for the "Install" prompt or "Add to Home Screen" option
3. Tap "Install" to add the app to your device
4. Access like any native app from your home screen

#### On Desktop (Chrome, Edge, Safari)
1. Look for the install icon in the address bar
2. Click "Install Time Tracker V2"
3. Use like a desktop application

### App Icons Setup
1. Open `generate-icons.html` in your browser
2. Download the generated `icon-192.png` and `icon-512.png`
3. Place them in the `public/` folder
4. Rebuild the application

## 🛠 Development & Deployment

### Build for Production
```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

### Deployment Options

#### Option 1: Static Hosting (Recommended)
**Netlify (Easiest)**
1. Run `npm run build`
2. Drag the `dist` folder to netlify.com
3. Get instant live URL
4. Add environment variables in Netlify dashboard

**Vercel**
1. Connect your GitHub repository
2. Add environment variables in Vercel dashboard
3. Automatic deployment on every push

**GitHub Pages**
1. Build the project: `npm run build`
2. Deploy the `dist` folder to GitHub Pages
3. Configure environment variables for production

#### Option 2: Traditional Web Hosting
Upload the contents of the `dist` folder to any web server that serves static files.

### PWA Features Configuration
- **Manifest**: `public/manifest.json` - App metadata and installation behavior
- **Service Worker**: `public/sw.js` - Offline functionality and caching
- **Icons**: `public/icon-*.png` - App icons for different screen sizes

## 🗃️ Database Schema

When using Supabase mode, the application creates these tables:

- **users**: Team member accounts with roles and authentication
- **time_entries**: All time tracking records with duration and metadata  
- **job_addresses**: Work site locations per user
- **csi_tasks**: Construction industry task categories (shared)

### Security Features
- **Row Level Security (RLS)**: Users can only access their own data
- **Admin Override**: Admin users can view all data for management
- **Password Hashing**: Secure bcrypt password storage
- **Environment Variables**: API keys stored securely

## 📁 Project Structure

```
time-tracker-v2/
├── public/
│   ├── manifest.json          # PWA manifest for app installation
│   ├── sw.js                  # Service worker for offline functionality
│   ├── icon-192.png          # App icon (192x192)
│   └── icon-512.png          # App icon (512x512)
├── src/
│   ├── components/
│   │   ├── Login.jsx         # Authentication component
│   │   ├── TimeTracker.jsx   # Main timer interface
│   │   ├── Dashboard.jsx     # Admin/user dashboard
│   │   ├── TimeEntries.jsx   # Time entry management
│   │   ├── JobAddresses.jsx  # Job site management
│   │   └── CSITasks.jsx      # CSI division management
│   ├── lib/
│   │   ├── supabase.js       # Main API export (configurable)
│   │   ├── supabase-config.js # Supabase configuration
│   │   └── supabase-real.js  # Database implementation
│   ├── App.jsx               # Main application component
│   ├── App.css               # Global styles and design system
│   └── main.jsx              # Application entry point
├── database-schema.sql        # Supabase database schema
├── SUPABASE_SETUP.md         # Database setup instructions
├── generate-icons.html        # Icon generator utility
├── vite.config.js            # Build configuration
└── package.json              # Dependencies and scripts
```

## 🔧 Technology Stack

- **Frontend**: React 18 + Vite
- **Styling**: CSS Custom Properties + Responsive Design
- **Icons**: Lucide React
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Storage**: LocalStorage (dev) / Supabase (prod)
- **Authentication**: Custom with bcrypt password hashing
- **PWA**: Service Worker + Web App Manifest
- **Build**: Vite with optimized production builds

## 🎯 Usage Guidelines

### For Regular Users
1. **Login** with your credentials
2. **Start Timer** by selecting job address and CSI task
3. **Use Quick Timers** for travel and breaks (mutually exclusive with work timer)
4. **View Time Entries** to see your recorded time
5. **Manage Job Addresses** for your work sites

### For Administrators
1. **Dashboard** shows all users' time entries in hierarchical organization
2. **CSI Tasks** management for system-wide task categories
3. **User Management** through time entries view
4. **Data Management** capabilities including system reset

### Timer Rules
- **Work Timer**: Primary timer, disables travel/break timers when active
- **Travel Timer**: For travel time, pauses break timer if active
- **Break Timer**: For breaks/lunch, pauses travel timer if active
- **Mutual Exclusivity**: Only one timer can run at a time

## 🔄 Migration Path

### From localStorage to Database

1. **Export Current Data** (if needed):
   ```javascript
   // In browser console:
   const data = JSON.parse(localStorage.getItem('timeTracker_users') || '{}')
   console.log(JSON.stringify(data, null, 2))
   ```

2. **Set Up Supabase**: Follow `SUPABASE_SETUP.md`

3. **Switch Modes**: Update `src/lib/supabase.js` imports

4. **Test & Validate**: Verify all functionality works with database

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit changes: `git commit -m 'Add feature description'`
5. Push to branch: `git push origin feature-name`
6. Open a Pull Request

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team.

**Database Setup Help**: See `SUPABASE_SETUP.md` for detailed instructions.

---

**Time Tracker V2** - Built for modern construction and project management workflows with enterprise-grade database backend. 🏗️ 💾 