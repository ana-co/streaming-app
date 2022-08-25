import createRentedTokenModel from './RentedToken.js';

const models = {};

const createModels = (sequelize) => {
  models['RentedToken'] = createRentedTokenModel(sequelize);
};

export { createModels };

export default models;
