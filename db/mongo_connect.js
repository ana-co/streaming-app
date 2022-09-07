import mongoose from 'mongoose';
import mongodb, { MongoClient } from 'mongodb';
import { createMongoDb } from './index.js';

const connectDB = async () => {
  mongoose.connect(process.env.MONGO_URL);
  // const mongoClient = await mongodb.MongoClient.connect(process.env.MONGO_URL);
  const mongoClient = new MongoClient(process.env.MONGO_URL);
  await mongoClient.connect();
  createMongoDb(mongoClient);
  console.log('MongoDb Connected');
};

export default connectDB;
