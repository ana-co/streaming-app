const DB = {};

const createMongoDb = (mongoClient) => {
  DB['mongoClient'] = mongoClient;
};

export { createMongoDb };

export default DB;
