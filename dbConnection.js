import * as mysql from 'mysql2/promise';

import * as dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DBNAME,
  port: process.env.DB_PORT,
  multipleStatements: false,
  namedPlaceholders: true,
  connectionLimit: 4,
};

const db = await mysql.createPool(dbConfig);
console.log('db connected:', dbConfig.host);

export default db;