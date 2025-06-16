const express = require('express');
const { Pool } = require('pg');
const app = express();

// Database configuration
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "feedback_db",
  password: "tanmay",
  port: 5432,
});

// Hardcoded admin credentials (for demo only)
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123"; // Change this in production!

// Simple authentication storage (in-memory, resets on server restart)
let authenticatedUsers = {};

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Set view engine
app.set('view engine', 'ejs');

// Authentication middleware
const requireAuth = (req, res, next) => {
  const authToken = req.query.auth || req.headers['x-auth-token'];
  
  if (authToken && authenticatedUsers[authToken]) {
    return next();
  }
  res.redirect('/login');
};

// Routes
app.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM feedback ORDER BY submitted_at DESC');
    res.render('dashboard', { 
      feedbacks: result.rows,
      authToken: req.query.auth // Pass the auth token to the view
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    // Generate a simple auth token (not secure for production)
    const authToken = Math.random().toString(36).substring(2, 15);
    authenticatedUsers[authToken] = true;
    
    // Redirect with auth token in query string
    res.redirect(`/?auth=${authToken}`);
  } else {
    res.render('login', { error: 'Invalid credentials' });
  }
});

app.get('/logout', (req, res) => {
  const authToken = req.query.auth;
  if (authToken) {
    delete authenticatedUsers[authToken];
  }
  res.redirect('/login');
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Admin panel running on http://localhost:${PORT}`);
});