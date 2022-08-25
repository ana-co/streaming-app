import { Sequelize } from 'sequelize';

import { createModels } from '../models/index.js';

const connectDB = async () => {
  const sequelize = new Sequelize(process.env.PG_URL);

  createModels(sequelize);

  console.log('PostgresDb Connected');
};

export default connectDB;
