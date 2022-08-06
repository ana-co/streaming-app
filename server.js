import express from 'express';

import dotenv from 'dotenv';

import { StatusCodes } from 'http-status-codes';
import path from 'path';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import fs from 'fs';
import mongodb from 'mongodb';

import connectDB from './db/connect.js';

dotenv.config();

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  //   res.json({ msg: 'NODE WELCOME!' });
  res.sendFile(path.join(__dirname, '/index.html'));
});

app.get('/upload-test-video', (req, res) => {
  mongodb.MongoClient.connect(process.env.MONGO_URL, function (error, client) {
    if (error) {
      res.json(error);
      return;
    }
    const db = client.db('media');
    const gfsBucket = new mongodb.GridFSBucket(db);
    const uploadStream = gfsBucket.openUploadStream('test_video');
    const readStream = fs.createReadStream('./test_video.mp4');
    readStream.pipe(uploadStream);
    res.status(StatusCodes.OK).send('Media Uploaded...');
  });
});

app.get('/watch-test-video', (req, res) => {
  mongodb.MongoClient.connect(process.env.MONGO_URL, function (error, client) {
    if (error) {
      res.status(500).json(error);
      return;
    }

    const range = req.headers.range;
    if (!range) {
      res.status(StatusCodes.BAD_REQUEST).send('Range header required');
    }

    const db = client.db('media');

    db.collection('fs.files').findOne({}, (err, video) => {
      if (!video) {
        res.status(StatusCodes.NOT_FOUND).send('Media Not Found!');
        return;
      }

      const videoSize = video.length;

      const start = Number(range.replace(/\D/g, ''));
      const end = videoSize - 1;

      const contentLength = end - start + 1;

      const headers = {
        'Content-Range': `bytes ${start}-${end}/${videoSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': contentLength,
        'Content-Type': 'video/mp4',
      };

      res.writeHead(StatusCodes.PARTIAL_CONTENT, headers);

      const bucket = new mongodb.GridFSBucket(db);
      const downloadStream = bucket.openDownloadStreamByName('test_video', {
        start,
      });

      downloadStream.pipe(res);
    });
  });
});

const port = process.env.PORT || 5000;

const start = async () => {
  try {
    // await connectDB();
    app.listen(port, () => {
      console.log(`Server is listening on port ${port}...`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
