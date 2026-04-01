import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import './db'; // Initialize the database

const PORT = process.env.PORT || 3000;

app.listen(PORT as number, '0.0.0.0', () => {
    console.log(`\nBody is Diet API running on http://0.0.0.0:${PORT}`);
    console.log(`   ENV: ${process.env.NODE_ENV || 'development'}\n`);
});
