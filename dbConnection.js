import * as mysql from 'mysql2/promise';

const dbConfigLocal = {
  host: "localhost",
  user: "adbmin",
  password: "AbI35RicV5LSHm1A",
  database: "wordlist",
  multipleStatements: false,
  namedPlaceholders: true,
  connectionLimit: 10,
};

const dbConfigOnline = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DBNAME,
  multipleStatements: false,
  namedPlaceholders: true,
  connectionLimit: 5,
};

const dbConfig = process.env.IS_ONLINE ? dbConfigOnline : dbConfigLocal;

const db = await mysql.createPool(dbConfig);

export default db;