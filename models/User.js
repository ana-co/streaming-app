import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const UserSchema = new mongoose.Schema({
  nonce: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
    // validate: {
    //   validator: validator.isAddress,
    //   message: 'Please provide a valid address',
    // },
    unique: true,
  },
});

UserSchema.methods.createJWT = function () {
  return jwt.sign(
    {
      _id: this._id,
      address: this.address,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_LIFETIME }
  );
};

export default mongoose.model('user', UserSchema);
