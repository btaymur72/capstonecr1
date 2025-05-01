# Patent Map System

This project is a web application that visualizes patent data on a world map. Users can search for patents based on various criteria and view their locations on the map.

## Features

- Patent visualization on world map
- Search by patent number, keywords, applicant, region, and status
- View patent details
- Microsoft SQL Server database for data storage

## Project Structure

```
patent-map/
├── frontend/
│   ├── index.html        # Main HTML page
│   ├── styles.css        # CSS styles
│   └── app.js            # JavaScript code
├── backend/
│   ├── server.js         # Node.js Express API
│   └── package.json      # Backend dependencies
└── README.md             # This file
```

## Installation

### Requirements

- Node.js (v14 or higher)
- NPM (v6 or higher)
- Microsoft SQL Server (2017 or higher)

### Database Setup

1. Make sure you have a SQL Server instance running (the default instance used is `localhost\MSSQLSERVER01`)
2. The application will automatically create the database and tables when first run

### Backend Setup

1. Configure the database connection in `backend/server.js`:
```javascript
const dbConfig = {
    server: 'localhost\\MSSQLSERVER01',
    database: 'patent_db',
    user: 'sa',
    password: 'taymur7227',
    trustServerCertificate: true,
    options: {
        encrypt: true,
        enableArithAbort: true
    }
};
```

2. Install dependencies and start the server:
```bash
cd backend
npm install
npm start
```

### Frontend Access

After starting the backend, open the following URL in your browser:

```
http://localhost:3000
```

## API Endpoints

- `GET /api/patents`: Lists all patents
- `GET /api/patents/search?patentNo=&keywords=&applicant=&region=&status=`: Filters patents by search criteria
- `GET /api/patents/:id`: Patent details by ID
- `GET /api/patents/no/:patentNo`: Patent details by patent number
- `POST /api/patents`: Adds a new patent
- `PUT /api/patents/:id`: Updates patent information
- `DELETE /api/patents/:id`: Deletes a patent record

## Data Model

Patent data includes the following fields:

- `patentNo`: Patent number
- `keywords`: Keywords (content subject)
- `abstract`: Abstract description
- `applicationDate`: Application date
- `publicationDate`: Publication date
- `applicant`: Institution or person name
- `ipc`: International Patent Classification (IPC)
- `cpc`: International Patent Classification (CPC)
- `claims`: Claims (technical details)
- `geographicRegion`: Geographic region (for map)
- `patentStatus`: Patent status (active/inactive)
- `latitude`: Latitude (map coordinate)
- `longitude`: Longitude (map coordinate) 