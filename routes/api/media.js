import express from 'express';
import { StatusCodes } from 'http-status-codes';

import moment from 'moment';
import { createReadStream } from 'streamifier';
import mongodb, { ObjectId } from 'mongodb';

import authenticateUser from '../../middleware/auth.js';

const router = express.Router();

// @route  GET /api/media
// @desc   Stream media file by media file id
// access  Private
router.get(
  '/',
  /*authenticateUser,*/ async (req, res) => {
    const mediaFileId = req.query.mediaFileId;
    const rentExpireDate = req.query.rentExpireDate;
    // const mediaFileId = '631758e2f353743769a65d18';
    // const rentExpireDate = moment({
    //   year: 2022,
    //   month: 8,
    //   day: 6,
    //   hour: 19,
    //   minute: 40,
    // });
    if (moment().isAfter(rentExpireDate)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: 'Rent time expired' });
    }

    try {
      mongodb.MongoClient.connect(
        process.env.MONGO_URL,
        async (error, client) => {
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
          const downloadStream = bucket.openDownloadStreamByName(
            mediaFileName,
            {
              start,
              end,
            }
          );

          downloadStream.pipe(res);
        }
      );
    } catch (err) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err);
    }
  }
);

// @route    POST api/media
// @desc     Upload media file
// @access   Private
router.post('/', authenticateUser, async (req, res) => {
  const mediaFile = req.files.mediaFile;
  const filename = mediaFile.name.split('.').slice(0, -1).join('.');

  try {
    mongodb.MongoClient.connect(
      process.env.MONGO_URL,
      function (error, client) {
        if (error) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
          return;
        }
        const db = client.db('media');
        const gfsBucket = new mongodb.GridFSBucket(db);
        const readStream = createReadStream(mediaFile.data);
        const uploadStream = gfsBucket.openUploadStream(filename);

        readStream.pipe(uploadStream);

        res.status(StatusCodes.OK).send({ mediaFileId: uploadStream.id });
      }
    );
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }
});

export default router;
