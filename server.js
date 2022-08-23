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

import connectMongoDB from './db/mongo_connect';

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

app.get('/stream-video-mongodb', async (req, res) => {
  mongodb.MongoClient.connect(process.env.MONGO_URL, async (error, client) => {
    if (error) {
      console.log(error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
      return;
    }

    const range = req.headers.range;
    if (!range) {
      res.status(StatusCodes.BAD_REQUEST).send('Range header required');
    }

    const db = client.db('media');

    const video = await db
      .collection('fs.files')
      .findOne({ filename: 'test_video' });
    if (!video) {
      return res.status(StatusCodes.NOT_FOUND).send('Media Not Found!');
    }

    const videoSize = video.length;
    const CHUNK_SIZE = video.chunkSize;

    const start = Number(range.replace(/\D/g, ''));
    const end = Math.min(start + CHUNK_SIZE, videoSize);
    const contentLength = end - start;
    console.log(`start: ${start}, end: ${end}, range: ${range}`);
    const headers = {
      'Content-Range': `bytes ${start}-${end}/${videoSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': contentLength,
      'Content-Type': 'video/mp4',
    };

    console.log(headers);
    res.writeHead(StatusCodes.PARTIAL_CONTENT, headers);

    const bucket = new mongodb.GridFSBucket(db);
    const downloadStream = bucket.openDownloadStreamByName('test_video', {
      start,
      end,
    });

    downloadStream.pipe(res);
  });
});

// app.get('/stream-video-local', function (req, res) {
//   const range = req.headers.range;
//   if (!range) {
//     res.status(400).send('Requires Range header');
//   }

//   const videoPath = 'test_video.mp4';
//   const videoSize = fs.statSync('test_video.mp4').size;

//   const CHUNK_SIZE = 10 ** 6; // 1MB
//   const start = Number(range.replace(/\D/g, ''));
//   const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

//   const contentLength = end - start + 1;
//   const headers = {
//     'Content-Range': `bytes ${start}-${end}/${videoSize}`,
//     'Accept-Ranges': 'bytes',
//     'Content-Length': contentLength,
//     'Content-Type': 'video/mp4',
//   };
//   console.log(headers);
//   res.writeHead(StatusCodes.PARTIAL_CONTENT, headers);

//   const videoStream = fs.createReadStream(videoPath, { start, end });

//   videoStream.pipe(res);
// });

const port = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectMongoDB();
    app.listen(port, () => {
      console.log(`Server is listening on port ${port}...`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
