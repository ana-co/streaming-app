import pg from 'pg';
const { Client } = pg;

// import dotenv from 'dotenv';
// dotenv.config();

const connectDb = () => {
  try {
    const client = new Client({
      user: process.env.PG_USER,
      host: process.env.PG_HOST,
      database: process.env.PG_DATABASE,
      password: process.env.PG_PASSWORD,
      port: 5432,
      ssl: { rejectUnauthorized: false },
    });
  
    await client.connect();
  
    console.log('Connected to Postgresql!');
  
    const res = await client.query('SELECT * FROM nftitem');
    console.log(res);
    await client.end(); 

  } catch (error) {
    console.log(error);
  }
  
}