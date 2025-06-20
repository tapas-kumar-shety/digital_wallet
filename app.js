const express = require('express');
const { initDb } = require('./database');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize the database
initDb();

// Use routes
app.use('/api', routes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


// Basic dXNlcjE6cGFzc3dvcmQx        Basic dXNlcjE6cGFzc3dvcmQy

// {
//   "username": "user2",
//   "password": "password2"
// }

// {
//   "to": "user1",
//   "amt": 13000
// }

// Basic dGFwYXM6dGtzMTIz