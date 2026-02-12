const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hr_manager',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

// Get all attendance records
app.get('/', async (req, res) => {
    try {
        const [rows] = await promisePool.query(`
            SELECT a.*, e.first_name, e.last_name 
            FROM attendance a
            JOIN employees e ON a.employee_id = e.employee_id
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Check in
app.post('/checkin', async (req, res) => {
    const { employee_id } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().split(' ')[0];
    
    try {
        const [result] = await promisePool.query(
            'INSERT INTO attendance (employee_id, date, check_in, status) VALUES (?, ?, ?, ?)',
            [employee_id, today, currentTime, 'present']
        );
        res.status(201).json({ message: 'Checked in successfully', time: currentTime });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Already checked in today' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Check out
app.put('/checkout', async (req, res) => {
    const { employee_id } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().split(' ')[0];
    
    try {
        const [result] = await promisePool.query(
            'UPDATE attendance SET check_out = ? WHERE employee_id = ? AND date = ?',
            [currentTime, employee_id, today]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'No check-in record found for today' });
        }
        
        res.json({ message: 'Checked out successfully', time: currentTime });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get attendance by employee
app.get('/employee/:employee_id', async (req, res) => {
    try {
        const [rows] = await promisePool.query(
            'SELECT * FROM attendance WHERE employee_id = ? ORDER BY date DESC',
            [req.params.employee_id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Attendance Service running on port ${PORT}`);
});