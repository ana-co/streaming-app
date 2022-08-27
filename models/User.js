import mongoose from 'mongoose';

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

export default mongoose.model('user', UserSchema);
