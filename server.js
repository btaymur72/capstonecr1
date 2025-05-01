// Import Express and required modules
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sql = require('mssql'); // Microsoft SQL Server

// Create Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Set up middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('../frontend'));

// SQL Server Database connection configuration
const dbConfig = {
    server: 'Server=localhost\MSSQLSERVER01;Database=master;Trusted_Connection=True;',
    database: 'test1', // We'll use a specific database for our app
    user: 'DESKTOP-S1GPD9K\BT', // Change if you're using a different user
    password: 'taymur7227',
    trustServerCertificate: true, // For development only, not recommended for production
    options: {
        encrypt: true, // For secure connections
        enableArithAbort: true
    }
};

// Global database connection pool
let pool;

// Initialize database connection
async function initializeDatabase() {
    try {
        pool = await sql.connect(dbConfig);
        console.log('Connected to SQL Server database');
        await createPatentTable();
    } catch (error) {
        console.error('Database initialization error:', error);
    }
}

// Create patent table
async function createPatentTable() {
    try {
        const createTableSQL = `
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'patents')
        BEGIN
            CREATE TABLE patents (
                id INT IDENTITY(1,1) PRIMARY KEY,
                patentNo NVARCHAR(50) NOT NULL UNIQUE,
                keywords NVARCHAR(MAX),
                abstract NVARCHAR(MAX),
                applicationDate NVARCHAR(20),
                publicationDate NVARCHAR(20),
                applicant NVARCHAR(100),
                ipc NVARCHAR(50),
                cpc NVARCHAR(50),
                claims NVARCHAR(MAX),
                geographicRegion NVARCHAR(20),
                patentStatus NVARCHAR(20),
                latitude FLOAT,
                longitude FLOAT
            )
        END
        `;
        await pool.request().query(createTableSQL);
        console.log('Patent table created or already exists');
    } catch (error) {
        console.error('Error creating patent table:', error);
        throw error;
    }
}

// API Endpoints

app.get('/api/patents', async (req, res) => {
    try {
        const result = await pool.request().query('SELECT * FROM patents');
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching patents:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/patents/search', async (req, res) => {
    const { patentNo, keywords, applicant, region, status } = req.query;
    let sqlQuery = 'SELECT * FROM patents WHERE 1=1';
    const request = pool.request();

    if (patentNo) {
        sqlQuery += ' AND patentNo LIKE @patentNo';
        request.input('patentNo', sql.NVarChar, `%${patentNo}%`);
    }
    if (keywords) {
        sqlQuery += ' AND keywords LIKE @keywords';
        request.input('keywords', sql.NVarChar, `%${keywords}%`);
    }
    if (applicant) {
        sqlQuery += ' AND applicant LIKE @applicant';
        request.input('applicant', sql.NVarChar, `%${applicant}%`);
    }
    if (region) {
        sqlQuery += ' AND geographicRegion = @region';
        request.input('region', sql.NVarChar, region);
    }
    if (status) {
        sqlQuery += ' AND patentStatus = @status';
        request.input('status', sql.NVarChar, status);
    }

    try {
        const result = await request.query(sqlQuery);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error searching patents:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/patents/:id', async (req, res) => {
    try {
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM patents WHERE id = @id');
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Patent not found' });
        }
        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Error fetching patent by ID:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/patents/no/:patentNo', async (req, res) => {
    try {
        const result = await pool.request()
            .input('patentNo', sql.NVarChar, req.params.patentNo)
            .query('SELECT * FROM patents WHERE patentNo = @patentNo');
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Patent not found' });
        }
        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Error fetching patent by number:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/patents', async (req, res) => {
    const {
        patentNo, keywords, abstract, applicationDate, publicationDate,
        applicant, ipc, cpc, claims, geographicRegion, patentStatus,
        latitude, longitude
    } = req.body;

    if (!patentNo) {
        return res.status(400).json({ error: 'Patent number is required' });
    }

    try {
        const request = pool.request();
        request.input('patentNo', sql.NVarChar, patentNo);
        request.input('keywords', sql.NVarChar, keywords);
        request.input('abstract', sql.NVarChar, abstract);
        request.input('applicationDate', sql.NVarChar, applicationDate);
        request.input('publicationDate', sql.NVarChar, publicationDate);
        request.input('applicant', sql.NVarChar, applicant);
        request.input('ipc', sql.NVarChar, ipc);
        request.input('cpc', sql.NVarChar, cpc);
        request.input('claims', sql.NVarChar, claims);
        request.input('geographicRegion', sql.NVarChar, geographicRegion);
        request.input('patentStatus', sql.NVarChar, patentStatus);
        request.input('latitude', sql.Float, latitude);
        request.input('longitude', sql.Float, longitude);

        const insertSQL = `
        INSERT INTO patents
        (patentNo, keywords, abstract, applicationDate, publicationDate, 
         applicant, ipc, cpc, claims, geographicRegion, patentStatus, 
         latitude, longitude)
        VALUES
        (@patentNo, @keywords, @abstract, @applicationDate, @publicationDate, 
         @applicant, @ipc, @cpc, @claims, @geographicRegion, @patentStatus, 
         @latitude, @longitude);
        SELECT SCOPE_IDENTITY() AS id;
        `;

        const result = await request.query(insertSQL);
        const id = result.recordset[0].id;

        res.json({ id, patentNo, message: 'Patent successfully added' });
    } catch (error) {
        console.error('Error adding patent:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/patents/:id', async (req, res) => {
    const {
        patentNo, keywords, abstract, applicationDate, publicationDate,
        applicant, ipc, cpc, claims, geographicRegion, patentStatus,
        latitude, longitude
    } = req.body;

    if (!patentNo) {
        return res.status(400).json({ error: 'Patent number is required' });
    }

    try {
        const request = pool.request();
        request.input('id', sql.Int, req.params.id);
        request.input('patentNo', sql.NVarChar, patentNo);
        request.input('keywords', sql.NVarChar, keywords);
        request.input('abstract', sql.NVarChar, abstract);
        request.input('applicationDate', sql.NVarChar, applicationDate);
        request.input('publicationDate', sql.NVarChar, publicationDate);
        request.input('applicant', sql.NVarChar, applicant);
        request.input('ipc', sql.NVarChar, ipc);
        request.input('cpc', sql.NVarChar, cpc);
        request.input('claims', sql.NVarChar, claims);
        request.input('geographicRegion', sql.NVarChar, geographicRegion);
        request.input('patentStatus', sql.NVarChar, patentStatus);
        request.input('latitude', sql.Float, latitude);
        request.input('longitude', sql.Float, longitude);

        const updateSQL = `
        UPDATE patents SET
        patentNo = @patentNo,
        keywords = @keywords,
        abstract = @abstract,
        applicationDate = @applicationDate,
        publicationDate = @publicationDate,
        applicant = @applicant,
        ipc = @ipc,
        cpc = @cpc,
        claims = @claims,
        geographicRegion = @geographicRegion,
        patentStatus = @patentStatus,
        latitude = @latitude,
        longitude = @longitude
        WHERE id = @id
        `;

        const result = await request.query(updateSQL);
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Patent not found' });
        }

        res.json({ id: req.params.id, patentNo, message: 'Patent successfully updated' });
    } catch (error) {
        console.error('Error updating patent:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/patents/:id', async (req, res) => {
    try {
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM patents WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Patent not found' });
        }

        res.json({ message: 'Patent successfully deleted', id: req.params.id });
    } catch (error) {
        console.error('Error deleting patent:', error);
        res.status(500).json({ error: error.message });
    }
});

// Initialize database and start server
(async () => {
    try {
        await initializeDatabase();
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
    }
})();
