import express from 'express';
import fileUpload from 'express-fileupload';
import cors from 'cors';
import dotenv from 'dotenv';

import path from 'path';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import connectMongoDB from './db/mongo_connect.js';
import connectPostgresDB from './db/pg_connect.js';

dotenv.config();

const app = express();

app.use(express.json());
app.use(fileUpload());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get('/', (req, res) => {
  //   res.json({ msg: 'NODE WELCOME!' });
  res.sendFile(path.join(__dirname, '/index.html'));
});

import mediaRouter from './routes/api/media.js';
import authRouter from './routes/api/metamaskAuth.js';

app.use('/api/media', mediaRouter);
app.use('/api/auth', authRouter);

const port = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectMongoDB();
    await connectPostgresDB();
    app.listen(port, () => {
      console.log(`Server is listening on port ${port}...`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
