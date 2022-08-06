import mongoose from 'mongoose';

const NFTMediaSchema = new mongoose.Schema(
  {
    media: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model('nftmedia', NFTMediaSchema);
