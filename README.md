# Payroll Optimizer 💰

A modern, full-stack payroll and job cost optimization application built with React and Supabase. Track employee time, manage job costs, and optimize payroll processes with real-time updates and comprehensive reporting.

## 🌟 Features

### Core Functionality
- **Time Tracking**: Start/stop timer with automatic duration calculation
- **Manual Entry**: Add time entries manually with date/time selection
- **Job Management**: Track time against specific job addresses
- **CSI Division Tracking**: Categorize work by construction divisions
- **Multi-User Support**: Role-based access (Admin/User)
- **Real-time Updates**: Live data synchronization across sessions

### Admin Features
- **Dashboard Analytics**: View all users' time entries and statistics
- **User Management**: Create and manage user accounts
- **CSI Task Management**: Add, edit, and delete CSI divisions
- **Data Export**: Export reports in multiple formats
- **Bulk Operations**: Clear all data with admin privileges

### Reporting System
- **Multiple Formats**: PDF, CSV, and JSON export options
- **Flexible Filtering**: By date range, user, job address, and CSI division
- **Summary Statistics**: Total hours, costs, and breakdowns
- **Print-Friendly**: Optimized report layouts for printing

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0.0 or higher
- npm or yarn
- Supabase account (free tier works)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/payroll-optimizer.git
cd payroll-optimizer
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Update `.env` with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Run the development server:
```bash
npm run dev
```

Visit `http://localhost:5173` to see the application.

## 📱 Mobile Support

The application is fully responsive and includes PWA capabilities:

### Installation on Mobile

#### iOS (Safari)
1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. Tap "Add"

#### Android (Chrome)
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Select "Install app" or "Add to Home Screen"
4. Tap "Install"

### Mobile Features
- Offline capability with service worker
- Touch-optimized interface
- Responsive navigation
- Pull-to-refresh prevention
- Home screen installation

## 🗄️ Database Schema

### Tables

#### users
- `id` (UUID, Primary Key)
- `username` (Text, Unique)
- `password_hash` (Text)
- `name` (Text)
- `role` (Text: 'admin' or 'user')
- `created_at` (Timestamp)

#### time_entries
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `start_time` (Time)
- `end_time` (Time)
- `duration` (Integer - seconds)
- `job_address` (Text)
- `csi_division` (Text)
- `notes` (Text)
- `date` (Date)
- `manual` (Boolean)
- `created_at` (Timestamp)

#### job_addresses
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `address` (Text)
- `created_at` (Timestamp)

#### csi_tasks
- `id` (UUID, Primary Key)
- `name` (Text, Unique)
- `created_at` (Timestamp)

## 🔒 Security

### Row Level Security (RLS)
All tables are protected with RLS policies:
- Users can only see and modify their own data
- Admins have full access to all data
- Public registration is disabled by default

### Authentication
- Password hashing with bcrypt
- Session-based authentication
- Secure token storage

## 🛠️ Development

### Tech Stack
- **Frontend**: React 18, Vite, Lucide Icons
- **Backend**: Supabase (PostgreSQL)
- **Styling**: CSS Variables, Responsive Design
- **PWA**: Service Worker, Web App Manifest

### Project Structure
```
payroll-optimizer/
├── src/
│   ├── components/      # React components
│   ├── lib/            # API and utilities
│   ├── App.jsx         # Main app component
│   ├── App.css         # Global styles
│   └── main.jsx        # Entry point
├── public/             # Static assets
├── database-schema.sql # Database setup
└── package.json        # Dependencies
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🚀 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Manual Deployment
1. Build the project:
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting service

## 📊 Features in Detail

### Time Entry Management
- Start/stop timer with real-time duration tracking
- Manual entry with date/time pickers
- Edit existing entries
- Bulk delete operations
- Automatic time calculation

### Job Address System
- Pre-configured job addresses per user
- Quick selection dropdown
- Add new addresses on the fly
- Delete unused addresses

### CSI Division Tracking
- Industry-standard construction divisions
- Customizable task list
- Usage statistics
- Time breakdown by division

### Reporting Capabilities
- Date range filtering
- User-based filtering (admin only)
- Multiple export formats
- Summary statistics
- Detailed breakdowns

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with React and Supabase
- Icons by Lucide
- Hosted on Vercel

---

**Payroll Optimizer** - Built for modern construction and project management workflows with enterprise-grade database backend. 💰 📊
