const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3004;

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

// Get all payroll records
app.get('/', async (req, res) => {
    try {
        const [rows] = await promisePool.query(`
            SELECT p.*, e.first_name, e.last_name, e.department 
            FROM payroll p
            JOIN employees e ON p.employee_id = e.employee_id
            ORDER BY p.year DESC, p.month DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Generate payroll
app.post('/generate', async (req, res) => {
    const { employee_id, month, year, basic_salary, allowances, deductions } = req.body;
    const net_salary = basic_salary + allowances - deductions;
    
    try {
        const [result] = await promisePool.query(
            'INSERT INTO payroll (employee_id, month, year, basic_salary, allowances, deductions, net_salary) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [employee_id, month, year, basic_salary, allowances, deductions, net_salary]
        );
        res.status(201).json({ 
            id: result.insertId, 
            employee_id, 
            month, 
            year, 
            net_salary,
            status: 'pending' 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Process payment
app.put('/:id/pay', async (req, res) => {
    const payment_date = new Date().toISOString().split('T')[0];
    
    try {
        const [result] = await promisePool.query(
            'UPDATE payroll SET status = ?, payment_date = ? WHERE id = ?',
            ['paid', payment_date, req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Payroll record not found' });
        }
        
        res.json({ message: 'Payment processed successfully', payment_date });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get payroll by employee
app.get('/employee/:employee_id', async (req, res) => {
    try {
        const [rows] = await promisePool.query(
            'SELECT * FROM payroll WHERE employee_id = ? ORDER BY year DESC, month DESC',
            [req.params.employee_id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Payroll Service running on port ${PORT}`);
});