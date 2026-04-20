require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');

// Connect Database
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // For demo purposes
        methods: ['GET', 'POST', 'PUT']
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Socket.io injection middleware
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Serve frontend static files
app.use(express.static('public'));

// Routes
// TODO: Define routes here
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));

// Socket.io Connection
io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
