// get npm dependencies
const express = require('express');
const path = require('path');
const http = require('http');
const mongoose = require('mongoose');
var cacheOpts = {
	max: Infinity,
	maxAge: 1000 // 1000 * 60 * 60 * 24 // 24h
};
require('mongoose-cache').install(mongoose, cacheOpts);

const bodyParser = require('body-parser');
const logger = require('morgan');
var compression = require('compression');

// get local dependencies
const CONFIG = require('./api/config');

// mongoose models & controllers
const User = require('./api/models/usersModel');
const Theme = require('./api/models/themesModel');
const Item = require('./api/models/itemsModel');
const Version = require('./api/models/versionsModel');

const app = express();
// Prepare mongodb connexion
mongoose.Promise = global.Promise;
mongoose.connect(CONFIG.mongoUrl);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Parsers for POST data
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Point static path to dist
app.use(express.static(path.join(__dirname, 'dist')));

// Set our api routes
var usersRoutes = require('./api/routes/usersRoutes');
var itemsRoutes = require('./api/routes/themesRoutes');
var themesRoutes = require('./api/routes/itemsRoutes');
var versionsRoutes = require('./api/routes/versionsRoutes');
usersRoutes(app);
itemsRoutes(app);
themesRoutes(app);
versionsRoutes(app);

// Catch all other routes and return the index file
app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname, 'dist/index.html'));
});

/**
 * Get port from environment and store in Express.
 */
const port = process.env.PORT || '3000';
app.set('port', port);

/**
 * Create HTTP server.
 */
const server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port, () => console.log(`API running on localhost:${port}`));

// Setting up basic middleware for all Express requests
app.use(logger('dev')); // Log requests to API using morgan

// Enable CORS from client-side
app.use(function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Credentials');
	res.header('Access-Control-Allow-Credentials', 'true');
	next();
});
