const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL Connection
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'hr-db',
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'adminpassword',
    database: process.env.DB_NAME || 'hr_manager',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

// Routes

// Get all employees
app.get('/', async (req, res) => {
    try {
        const [rows] = await promisePool.query('SELECT * FROM employees');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get employee by ID
app.get('/:id', async (req, res) => {
    try {
        const [rows] = await promisePool.query('SELECT * FROM employees WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create employee
app.post('/', async (req, res) => {
    const { employee_id, first_name, last_name, email, phone, department, position, hire_date, salary } = req.body;
    
    try {
        const [result] = await promisePool.query(
            'INSERT INTO employees (employee_id, first_name, last_name, email, phone, department, position, hire_date, salary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [employee_id, first_name, last_name, email, phone, department, position, hire_date, salary]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update employee
app.put('/:id', async (req, res) => {
    const { first_name, last_name, email, phone, department, position, salary, status } = req.body;
    
    try {
        const [result] = await promisePool.query(
            'UPDATE employees SET first_name = ?, last_name = ?, email = ?, phone = ?, department = ?, position = ?, salary = ?, status = ? WHERE id = ?',
            [first_name, last_name, email, phone, department, position, salary, status, req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        
        res.json({ message: 'Employee updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete employee
app.delete('/:id', async (req, res) => {
    try {
        const [result] = await promisePool.query('DELETE FROM employees WHERE id = ?', [req.params.id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        
        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Employee Service running on port ${PORT}`);
});