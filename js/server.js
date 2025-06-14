const express = require('express');
const mssql = require('mssql');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const dbConfig = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    trustedConnection: true
  }
};

// Initialize database tables
async function initializeDatabase() {
  try {
    const pool = await mssql.connect(dbConfig);
    
    // Create Customers table if it doesn't exist
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Customers' AND xtype='U')
      CREATE TABLE Customers (
        CustomerID INT PRIMARY KEY IDENTITY(1,1),
        Name NVARCHAR(255) NOT NULL,
        Email NVARCHAR(255),
        Phone NVARCHAR(20),
        CreatedAt DATETIME DEFAULT GETDATE()
      )
    `);
    
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();

// API endpoint to save customer information
app.post('/api/customer', async (req, res) => {
  const { name, email, phone } = req.body;

  try {
    const pool = await mssql.connect(dbConfig);
    const result = await pool.request()
      .input('Name', mssql.NVarChar, name)
      .input('Email', mssql.NVarChar, email)
      .input('Phone', mssql.NVarChar, phone)
      .query(`
        INSERT INTO Customers (Name, Email, Phone)
        VALUES (@Name, @Email, @Phone)
      `);

    if (result.rowsAffected[0] === 1) {
      res.status(201).json({ message: 'Customer information saved successfully' });
    } else {
      res.status(500).json({ error: 'Failed to save customer information' });
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      error: 'Error saving customer information',
      details: error.message 
    });
  }
});

const PORT = process.env.PORT || 5500;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
