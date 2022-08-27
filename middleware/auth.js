import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';

const authenticateUserWithToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer')) {
    return res.status(StatusCodes.UNAUTHORIZED).send('Authentication Invalid!');
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { _id: payload._id, address: payload.address };
    next();
  } catch (error) {
    return res.status(StatusCodes.UNAUTHORIZED).send('Authentication Invalid!');
  }
};

export default authenticateUserWithToken;
