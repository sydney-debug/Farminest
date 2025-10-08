# Farm360 Pro - Farm Management System

A comprehensive web application for farmers to manage their livestock, crops, produce, sales, and connect with veterinarians.

## Features

### 👩‍🌾 Farmer Features
- **Dashboard Overview**: Key metrics including total animals, crops, sales, and outstanding debts
- **Animal Management**: Complete CRUD operations for livestock with tracking of calves, pregnancies, and feeding records
- **Crop Management**: Track planting, growth progress, and harvest yields
- **Produce & Sales Tracking**: Record farm produce and manage customer sales with profit/loss summaries
- **Customer & Payment Records**: Manage customer database and track payments with automated debt calculations
- **Health Records**: Maintain veterinary visit history and vaccination schedules
- **Veterinarian Directory**: Find and connect with nearby vets with Google Maps integration

### 🩺 Veterinarian Features
- **Vet Registration/Login**: Separate authentication system for veterinarians
- **Vet Dashboard**: View assigned animals and manage health cases
- **Health Record Management**: Add diagnoses, treatments, and prescriptions

### 🧠 System Features
- **JWT Authentication**: Secure login system for both farmers and veterinarians
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Notifications**: Alerts for feeding times, appointments, and payments
- **Data Visualization**: Charts and graphs for farm analytics
- **Google Maps Integration**: Location-based veterinarian search

## Tech Stack

### Frontend
- **HTML5**: Semantic markup with responsive design
- **CSS3**: Modern styling with CSS Grid and Flexbox
- **Vanilla JavaScript**: No frameworks, pure JavaScript for maximum performance
- **Google Maps API**: For veterinarian location mapping

### Backend
- **Node.js**: Server-side JavaScript runtime
- **Express.js**: Web application framework
- **PostgreSQL**: Robust relational database
- **JWT**: JSON Web Tokens for authentication
- **bcrypt**: Password hashing for security

### Deployment
- **Frontend**: Netlify (static site hosting)
- **Backend & Database**: Supabase (PostgreSQL hosting with built-in auth)

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v13 or higher)
- Git

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd farm360-pro/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` file with your configuration:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=farm360_pro
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password

   # JWT Secret (change this in production!)
   JWT_SECRET=your-super-secret-jwt-key-change-in-production

   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:3000
   ```

4. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb farm360_pro

   # Run database migrations
   psql -d farm360_pro -f database_schema.sql
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## Deployment

### Frontend (Netlify)

1. **Build the frontend**
   ```bash
   cd frontend
   # No build process needed for static files
   ```

2. **Deploy to Netlify**
   - Connect your Git repository to Netlify
   - Set build command: (leave empty)
   - Set publish directory: `frontend/`
   - Add environment variables if needed

### Backend & Database (Supabase)

1. **Create Supabase project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project

2. **Database Setup**
   - Go to SQL Editor in Supabase dashboard
   - Run the contents of `database_schema.sql`

3. **Environment Variables**
   Update your `.env` file with Supabase credentials:
   ```env
   DB_HOST=db.your-project.supabase.co
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=your-supabase-password

   NODE_ENV=production
   FRONTEND_URL=https://your-netlify-site.netlify.app
   ```

4. **Deploy Backend**
   - Deploy your Node.js app to a hosting service (Heroku, DigitalOcean, etc.)
   - Update CORS settings in `server.js` for your production domain

## Usage

### For Farmers

1. **Register/Login**: Create an account as a farmer
2. **Add Animals**: Start by adding your livestock with details like breed, age, weight
3. **Track Crops**: Add your crops and monitor their growth stages
4. **Record Sales**: Track produce sales and customer payments
5. **Manage Health**: Keep records of veterinary visits and vaccinations

### For Veterinarians

1. **Register**: Sign up with your clinic details and specialization
2. **View Dashboard**: See assigned animals and upcoming appointments
3. **Manage Cases**: Add health records, diagnoses, and treatments

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Dashboard Endpoints
- `GET /api/dashboard/overview` - Get dashboard statistics
- `GET /api/dashboard/animal-stats` - Get animal statistics
- `GET /api/dashboard/crop-stats` - Get crop statistics
- `GET /api/dashboard/financial-summary` - Get financial summary

### Animal Management
- `GET /api/animals` - Get all animals
- `POST /api/animals` - Create new animal
- `GET /api/animals/:id` - Get animal by ID
- `PUT /api/animals/:id` - Update animal
- `DELETE /api/animals/:id` - Delete animal

### Crop Management
- `GET /api/crops` - Get all crops
- `POST /api/crops` - Create new crop
- `PUT /api/crops/:id` - Update crop
- `DELETE /api/crops/:id` - Delete crop

### Sales & Customers
- `GET /api/sales/customers` - Get all customers
- `POST /api/sales/customers` - Create customer
- `GET /api/sales` - Get all sales
- `POST /api/sales` - Create sale record

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Stateless token-based auth
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Joi schema validation
- **CORS Protection**: Configurable cross-origin requests
- **Helmet Security**: HTTP security headers

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Email: support@farm360pro.com
- Documentation: [Link to docs]

## Changelog

### v1.0.0
- Initial release
- Complete farm management system
- Farmer and veterinarian dashboards
- Mobile-responsive design
- PostgreSQL database integration
