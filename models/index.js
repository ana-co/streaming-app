import createRentedTokenModel from './RentedToken.js';
import createNFTItemModel from './NFTItem.js';
import createNFTRentModel from './NFTRent.js';

const models = {};

const createModels = (sequelize) => {
  models['RentedToken'] = createRentedTokenModel(sequelize);
  models['NFTItem'] = createNFTItemModel(sequelize);
  models['NFTRent'] = createNFTRentModel(sequelize);
};

export { createModels };

export default models;
