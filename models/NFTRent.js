import { Sequelize, Op } from 'sequelize';
const DataTypes = Sequelize.DataTypes;
const createNFTRentModel = (sequelize) => {
  const NFTRent = sequelize.define(
    'nft_rent',
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      tokenId: {
        field: 'token_id',
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },

      mainRenter: {
        field: 'main_renter',
        type: DataTypes.STRING,
        allowNull: false,
      },
      rentStatus: {
        field: 'rent_status',
        type: DataTypes.STRING,
      },
      renterAccounts: {
        field: 'renter_accounts',
        allowNull: false,
        type: DataTypes.STRING,
      },
    },
    { timestamps: false }
  );

  NFTRent.getAll = () => {
    return NFTRent.findAll();
  };

  NFTRent.getByTokenIdAndRentStatus = (tokenId, rentStatus) => {
    return NFTRent.findOne({
      attributes: ['renterAccounts'],
      where: {
        tokenId: tokenId,
        rentStatus: rentStatus,
        // renterAccounts: {
        //   [Op.like]: `%${account_address}%`,
        // },
      },
    });
  };

  return NFTRent;
};

export default createNFTRentModel;
