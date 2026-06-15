const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');

const app = express();
app.set('query parser', function (str) { return require('qs').parse(str, { allowPrototypes: false }); });
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Serve Frontend (if needed in production)
app.use(express.static(path.join(__dirname, '../frontend')));

app.listen(PORT, () => {
  console.log(`PatternWise server running on http://localhost:${PORT}`);
});
