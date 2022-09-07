import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';

const authenticateUserWithToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  const token =
    authHeader && authHeader.startsWith('Bearer')
      ? authHeader.split(' ')[1]
      : req.query.token;

  if (!token) {
    console.log('Authentication failed, Token must be present!');
    return res.status(StatusCodes.UNAUTHORIZED).send('Authentication Invalid!');
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { _id: payload._id, address: payload.address };
    next();
  } catch (error) {
    console.log(`Authentication failed, Invalid token!`);
    return res.status(StatusCodes.UNAUTHORIZED).send('Authentication Invalid!');
  }
};

export default authenticateUserWithToken;
