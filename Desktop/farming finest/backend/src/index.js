require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const animalsRoutes = require('./routes/animals');
const vetsRoutes = require('./routes/vets');
const cropsRoutes = require('./routes/crops');
const feedsRoutes = require('./routes/feeds');
const agrovetsRoutes = require('./routes/agrovets');
const salesRoutes = require('./routes/sales');
const uploadRoutes = require('./routes/upload');
const cors = require('cors');

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5000', 'http://127.0.0.1:5000'],
  credentials: true
}));

// Middleware
app.use(bodyParser.json());
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/animals', animalsRoutes);
app.use('/api/vets', vetsRoutes);
app.use('/api/crops', cropsRoutes);
app.use('/api/feeds', feedsRoutes);
app.use('/api/agrovets', agrovetsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/', (req, res) => res.json({ service: 'farming-finest-backend', status: 'ok' }));

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Server running on port ${port}`));
