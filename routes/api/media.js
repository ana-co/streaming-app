import express from 'express';
import { StatusCodes } from 'http-status-codes';

// import moment from 'moment';
import { createReadStream } from 'streamifier';
import mongodb, { ObjectId } from 'mongodb';
import DB from '../../db/index.js';
import models from '../../models/index.js';

import authenticateUser from '../../middleware/auth.js';

const router = express.Router();

// @route    POST api/media
// @desc     Upload media file
// @access   Private
router.post('/', authenticateUser, async (req, res) => {
  const mediaFile = req.files.mediaFile;
  const filename = mediaFile.name.split('.').slice(0, -1).join('.');

  try {
    const client = DB.mongoClient;
    const db = client.db('media');
    const gfsBucket = new mongodb.GridFSBucket(db);
    const readStream = createReadStream(mediaFile.data);
    const uploadStream = gfsBucket.openUploadStream(filename);

    readStream.pipe(uploadStream);

    res.status(StatusCodes.OK).send({ mediaFileId: uploadStream.id });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }
});

// @route  GET /api/media
// @desc   Stream media file by media file id
// access  Private
router.get('/', authenticateUser, async (req, res) => {
  const mediaFileId = req.query.mediaFileId;
  // const rentExpireDate = req.query.rentExpireDate;
  // const mediaFileId = '631758e2f353743769a65d18';
  // const rentExpireDate = moment({
  //   year: 2022,
  //   month: 8,
  //   day: 6,
  //   hour: 19,
  //   minute: 40,
  // });
  // console.log(`rentExpireDate: ${rentExpireDate}`);
  // if (rentExpireDate && moment().isAfter(rentExpireDate)) {
  //   return res
  //     .status(StatusCodes.BAD_REQUEST)
  //     .json({ message: 'Rent time expired' });
  // }
  const accessResponse = await getNFTUserAccess(req.user.address, mediaFileId);
  if (!accessResponse.success) {
    console.log(accessResponse.message);
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: accessResponse.message });
  }

  try {
    const client = DB.mongoClient;
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
      'Content-Range': `bytes ${start}-${end - 1}/${mediaFileSize}`,
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
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err);
  }
});

const getNFTUserAccess = async (userAddress, mediaFileId) => {
  const noAccessResponse = {
    success: false,
    message: 'User does not have access to the requested token!',
  };

  const nftItem = await models.NFTItem.getByMediaFileId(mediaFileId);
  if (!nftItem) {
    return {
      success: false,
      message: 'Requested Token Not Found',
    };
  }

  const isOwner =
    nftItem.accountAddress && nftItem.accountAddress === userAddress;

  const rentedToken = await models.NFTRent.getByTokenIdAndRentStatus(
    nftItem.tokenId,
    'RENTED'
  );

  if (!isOwner && !rentedToken) {
    return noAccessResponse;
  }

  if (isOwner) {
    if (rentedToken) {
      return {
        success: false,
        message: 'Requested token is rented right now',
      };
    } else {
      return {
        success: true,
        message: 'NFT Owner',
      };
    }
  } else if (rentedToken) {
    if (rentedToken.renterAccounts.includes(userAddress)) {
      return {
        success: true,
        message: 'NFT Renter',
      };
    } else {
      noAccessResponse;
    }
  }
};

export default router;
