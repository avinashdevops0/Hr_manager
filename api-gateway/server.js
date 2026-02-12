const express = require('express');
const cors = require('cors');
const proxy = require('express-http-proxy');
const morgan = require('morgan');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Serve static files
app.use(express.static('public'));

// Service routes
// app.use('/api/employees', proxy('http://localhost:3001'));
// app.use('/api/attendance', proxy('http://localhost:3002'));
// app.use('/api/leaves', proxy('http://localhost:3003'));
// app.use('/api/payroll', proxy('http://localhost:3004'));

app.use('/api/employees', proxy('http://employee-service:3001'));
app.use('/api/attendance', proxy('http://attendence-service:3002'));
app.use('/api/leaves', proxy('http://leave-service:3003'));
app.use('/api/payroll', proxy('http://payroll-service:3004'));

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'UP', 
        timestamp: new Date(),
        services: {
            // employees: 'http://localhost:3001',
            // attendance: 'http://localhost:3002',
            // leaves: 'http://localhost:3003',
            // payroll: 'http://localhost:3004'

            employees: 'http://employee-service:3001',
            attendance: 'http://attendence-service:3002',
            leaves: 'http://leave-service:3003',
            payroll: 'http://payroll-service:3004'
        }
    });
});

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});