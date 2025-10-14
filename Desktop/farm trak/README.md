# FarmTrak 360 - Comprehensive Farm Management System

A full-featured web application for modern farm management, built with Node.js backend, responsive frontend, and Supabase PostgreSQL database.

## Features

### Core Functionality
- **Dashboard**: Overview of farm operations, key metrics, and recent activities
- **Farm Management**: Manage multiple farms, track farm details and resources
- **Livestock Management**: Track animals, health records, breeding, and production
- **Crop Management**: Monitor crop cycles, yields, and field management
- **Veterinary Services**: Directory of vets, appointment scheduling, and health records
- **Agrovets**: Agricultural suppliers directory and inventory management
- **Information Sharing**: Community platform for farmers to share knowledge and experiences
- **Contact Management**: Communication system for farmers, vets, and suppliers
- **Location Services**: GPS tracking and mapping for farms and livestock

### Technical Features
- **Responsive Design**: Mobile-first approach with intuitive UI
- **Dark/Light Mode**: Persistent theme toggle with user preferences
- **Authentication**: Secure JWT-based user authentication and authorization
- **REST API**: Comprehensive backend API for all farm operations
- **Real-time Updates**: Live data synchronization across devices
- **Offline Support**: Progressive Web App capabilities

## Technology Stack

### Backend
- **Node.js** with Express.js framework
- **PostgreSQL** database via Supabase
- **JWT Authentication** with bcrypt password hashing
- **RESTful API** design with proper error handling

### Frontend
- **Vanilla HTML5, CSS3, JavaScript** (no framework dependencies)
- **Responsive CSS Grid/Flexbox** layout
- **CSS Custom Properties** for theming
- **Local Storage** for theme persistence
- **Chart.js** for data visualization
- **Leaflet Maps** for location services

### Database (Supabase)
- **PostgreSQL** with real-time capabilities
- **Row Level Security (RLS)** for data protection
- **Automated backups** and scaling
- **Built-in authentication** system

### Deployment
- **Frontend**: Vercel for static hosting and CDN
- **Backend**: Railway/Vercel Functions for serverless deployment
- **Database**: Supabase managed PostgreSQL

## Project Structure

```
farmtrak-360/
├── frontend/                 # Static frontend files
│   ├── index.html           # Main application shell
│   ├── css/
│   │   ├── styles.css       # Main stylesheet
│   │   ├── dark-theme.css   # Dark mode styles
│   │   └── mobile.css       # Mobile-specific styles
│   ├── js/
│   │   ├── app.js           # Main application logic
│   │   ├── auth.js          # Authentication handlers
│   │   ├── dashboard.js     # Dashboard functionality
│   │   ├── livestock.js     # Livestock management
│   │   ├── crops.js         # Crop management
│   │   ├── vets.js          # Veterinary services
│   │   ├── agrovets.js       # Agricultural suppliers
│   │   ├── sharing.js       # Information sharing
│   │   ├── contact.js       # Contact management
│   │   ├── maps.js          # Location and mapping
│   │   └── theme.js         # Theme toggle functionality
│   └── assets/              # Images, icons, and static assets
├── backend/                 # Node.js API server
│   ├── server.js            # Main server file
│   ├── routes/              # API route handlers
│   │   ├── auth.js          # Authentication routes
│   │   ├── farms.js         # Farm management routes
│   │   ├── livestock.js     # Livestock routes
│   │   ├── crops.js         # Crop management routes
│   │   ├── vets.js          # Veterinary routes
│   │   ├── agrovets.js      # Agrovets routes
│   │   ├── sharing.js       # Information sharing routes
│   │   ├── contact.js       # Contact routes
│   │   └── location.js      # Location services routes
│   ├── models/              # Database models and queries
│   ├── middleware/          # Custom middleware (auth, validation)
│   └── scripts/             # Database setup and utilities
├── database/                # Database schemas and migrations
├── docs/                    # Documentation and API specs
├── .env                     # Environment variables
├── package.json             # Dependencies and scripts
└── vercel.json             # Vercel deployment config
```

## Getting Started

### Prerequisites
- Node.js 16+ installed
- Supabase account and project
- Git for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd farmtrak-360
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `.env` and update with your Supabase credentials
   - Configure database connection if using local PostgreSQL

4. **Database Setup**
   ```bash
   npm run setup-db
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Build for Production**
   ```bash
   npm run build
   ```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Farm Management
- `GET /api/farms` - List user's farms
- `POST /api/farms` - Create new farm
- `GET /api/farms/:id` - Get farm details
- `PUT /api/farms/:id` - Update farm
- `DELETE /api/farms/:id` - Delete farm

### Livestock Management
- `GET /api/livestock` - List livestock
- `POST /api/livestock` - Add new animal
- `GET /api/livestock/:id` - Get animal details
- `PUT /api/livestock/:id` - Update animal
- `DELETE /api/livestock/:id` - Remove animal

### Crop Management
- `GET /api/crops` - List crops
- `POST /api/crops` - Add new crop
- `GET /api/crops/:id` - Get crop details
- `PUT /api/crops/:id` - Update crop
- `DELETE /api/crops/:id` - Remove crop

### Veterinary Services
- `GET /api/vets` - List veterinarians
- `POST /api/vets/appointments` - Book appointment
- `GET /api/vets/appointments` - Get appointments

### Information Sharing
- `GET /api/sharing/posts` - Get shared posts
- `POST /api/sharing/posts` - Create new post
- `POST /api/sharing/posts/:id/comments` - Add comment

## Database Schema

### Core Tables
- **users** - User accounts and profiles
- **farms** - Farm information and settings
- **livestock** - Animal records and tracking
- **crops** - Crop management and yields
- **vets** - Veterinarian directory
- **agrovets** - Agricultural suppliers
- **shared_info** - Community posts and articles
- **contacts** - Contact management
- **locations** - GPS coordinates and mapping

## Deployment

### Vercel (Frontend)
1. Connect repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Supabase (Database)
1. Create new project in Supabase dashboard
2. Run database migrations
3. Configure authentication providers

### Backend Deployment
Deploy to Railway, Heroku, or Vercel Functions based on requirements.

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Email: support@farmtrak360.com
- Documentation: [Link to docs]
- Community Forum: [Link to forum]

---

Built with ❤️ for modern farmers and agricultural professionals.
