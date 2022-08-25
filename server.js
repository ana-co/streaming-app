import express from 'express';

import dotenv from 'dotenv';

import { StatusCodes } from 'http-status-codes';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { createReadStream } from 'streamifier';
import fs from 'fs';

import mongodb, { ObjectId } from 'mongodb';

import connectMongoDB from './db/mongo_connect.js';
import connectPostgresDB from './db/pg_connect.js';

import fileUpload from 'express-fileupload';

dotenv.config();

const app = express();

app.use(express.json());
app.use(fileUpload());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  //   res.json({ msg: 'NODE WELCOME!' });
  res.sendFile(path.join(__dirname, '/index.html'));
});

app.post('/upload-media', (req, res) => {
  const mediaFile = req.files.mediaFile;
  const filename = mediaFile.name.split('.').slice(0, -1).join('.');
  // const fileId = uuidv4();
  mongodb.MongoClient.connect(process.env.MONGO_URL, function (error, client) {
    if (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
      return;
    }
    const db = client.db('media');
    const gfsBucket = new mongodb.GridFSBucket(db);
    const readStream = createReadStream(mediaFile.data);
    const uploadStream = gfsBucket.openUploadStream(filename);
    // ({filename: filename,
    // fileId:fileId
    // content_type: mediaFile.mimetype,
    // metadata: {
    //     user: req.user
    // } });
    readStream.pipe(uploadStream);

    // res.status(StatusCodes.OK).send(fileId);
    res.status(StatusCodes.OK).send({ mediaFileId: uploadStream.id });
  });
});

// app.get('/upload-test-video', (req, res) => {
//   mongodb.MongoClient.connect(process.env.MONGO_URL, function (error, client) {
//     if (error) {
//       res.json(error);
//       return;
//     }
//     const db = client.db('media');
//     const gfsBucket = new mongodb.GridFSBucket(db);
//     const uploadStream = gfsBucket.openUploadStream('test_video');
//     const readStream = fs.createReadStream('./test_video.mp4');
//     readStream.pipe(uploadStream);
//     res.status(StatusCodes.OK).send('Media Uploaded...');
//   });
// });

app.get('/stream-media', async (req, res) => {
  const mediaFileId = req.query.mediaFileId;
  // const mediaFileId = '6307f9c1a5f4f286184e5801';
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

    const mediaFile = await db.collection('fs.files').findOne(
      // { filename: filename }
      { _id: ObjectId(mediaFileId) }
    );
    if (!mediaFile) {
      console.log('Media not found');
      return res.status(StatusCodes.NOT_FOUND).send('Media Not Found!');
    }

    const mediaFileSize = mediaFile.length;
    const CHUNK_SIZE = mediaFile.chunkSize;
    const mediaFileName = mediaFile.filename;

    const start = Number(range.replace(/\D/g, ''));
    const end = Math.min(start + CHUNK_SIZE, mediaFileSize);
    const contentLength = end - start;
    const headers = {
      'Content-Range': `bytes ${start}-${end}/${mediaFileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': contentLength,
      'Content-Type': 'video/mp4',
    };

    res.writeHead(StatusCodes.PARTIAL_CONTENT, headers);

    const bucket = new mongodb.GridFSBucket(db);
    const downloadStream = bucket.openDownloadStreamByName(mediaFileName, {
      start,
      end,
    });

    downloadStream.pipe(res);
  });
});

// app.get('/stream-media-local', function (req, res) {
//   const range = req.headers.range;
//   if (!range) {
//     res.status(400).send('Requires Range header');
//   }

//   const videoPath = 'test_video.mp4';
//   const mediaFileSize = fs.statSync('test_video.mp4').size;

//   const CHUNK_SIZE = 10 ** 6; // 1MB
//   const start = Number(range.replace(/\D/g, ''));
//   const end = Math.min(start + CHUNK_SIZE, mediaFileSize - 1);

//   const contentLength = end - start + 1;
//   const headers = {
//     'Content-Range': `bytes ${start}-${end}/${mediaFileSize}`,
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
    await connectPostgresDB();
    app.listen(port, () => {
      console.log(`Server is listening on port ${port}...`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
