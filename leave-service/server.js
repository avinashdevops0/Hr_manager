const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

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

// Get all leave requests
app.get('/', async (req, res) => {
    try {
        const [rows] = await promisePool.query(`
            SELECT l.*, e.first_name, e.last_name 
            FROM leave_requests l
            JOIN employees e ON l.employee_id = e.employee_id
            ORDER BY l.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create leave request
app.post('/', async (req, res) => {
    const { employee_id, leave_type, start_date, end_date, reason } = req.body;
    
    try {
        const [result] = await promisePool.query(
            'INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason) VALUES (?, ?, ?, ?, ?)',
            [employee_id, leave_type, start_date, end_date, reason]
        );
        res.status(201).json({ id: result.insertId, ...req.body, status: 'pending' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update leave status
app.put('/:id/status', async (req, res) => {
    const { status, approved_by } = req.body;
    
    try {
        const [result] = await promisePool.query(
            'UPDATE leave_requests SET status = ?, approved_by = ? WHERE id = ?',
            [status, approved_by, req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Leave request not found' });
        }
        
        res.json({ message: `Leave request ${status}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get leave requests by employee
app.get('/employee/:employee_id', async (req, res) => {
    try {
        const [rows] = await promisePool.query(
            'SELECT * FROM leave_requests WHERE employee_id = ? ORDER BY created_at DESC',
            [req.params.employee_id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Leave Service running on port ${PORT}`);
});