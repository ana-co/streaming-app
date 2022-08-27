import express from 'express';

import { StatusCodes } from 'http-status-codes';

import {
  bufferToHex,
  toBuffer,
  hashPersonalMessage,
  fromRpcSig,
  ecrecover,
  publicToAddress,
} from 'ethereumjs-util';

import User from '../../models/User.js';

const router = express.Router();

// @route  GET /api/auth/:address/nonce
// @desc   Get nonce for user address
// access  Public
router.get('/:address/nonce', async (req, res) => {
  const walletAddress = req.params.address;

  const userFields = {};
  userFields.address = walletAddress;
  userFields.nonce = Math.floor(Math.random() * 1000000);

  let user = await User.findOneAndUpdate(
    { address: walletAddress },
    { $set: userFields },
    { new: true, upsert: true }
  );

  res.status(StatusCodes.OK).json({ user });
});

// @route  POST /api/auth/:address/signature
// @desc   Verify the signature and generate jwt token
// access  Public
router.post('/:address/signature', async (req, res) => {
  const walletAddress = req.params.address;
  const metamaskSignature = req.body.signature;

  try {
    const user = await User.findOne({
      address: walletAddress,
    });

    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .send({ msg: 'User with this Address Does not Exist' });
    }

    const nonceMessageToHex = bufferToHex(
      Buffer.from(`You are signing with one-time nonce: ${user.nonce}`)
    );
    const nonceMessageHash = hashPersonalMessage(toBuffer(nonceMessageToHex));

    const signatureParams = fromRpcSig(toBuffer(metamaskSignature));

    const publicKey = ecrecover(
      nonceMessageHash,
      signatureParams.v,
      signatureParams.r,
      signatureParams.s
    );

    const recoveredAddress = bufferToHex(publicToAddress(publicKey));

    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(StatusCodes.UNAUTHORIZED).send('Invalid credentials');
    }

    user.nonce = Math.floor(Math.random() * 1000000);
    await user.save();

    const token = user.createJWT();

    res.status(StatusCodes.OK).json({
      token: `Bearer ${token}`,
    });
  } catch (err) {
    console.log(`Error: ${err}`);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err);
  }
});

export default router;
