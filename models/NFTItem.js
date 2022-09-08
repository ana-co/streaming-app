import { Sequelize } from 'sequelize';
const DataTypes = Sequelize.DataTypes;

const createNFTItemModel = (sequelize) => {
  const NFTItem = sequelize.define(
    'nft_item',
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
        unique: true,
        type: DataTypes.BIGINT,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      accountAddress: {
        field: 'account_address',
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      mediaExternalUrl: {
        field: 'media_external_url',
        unique: true,
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      description: {
        type: DataTypes.STRING,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      price: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      rentPrice: {
        field: 'rent_price',
        type: DataTypes.BIGINT,
      },
      rentDuration: {
        field: 'rent_duration',
        type: DataTypes.BIGINT,
      },
      videoDuration: {
        field: 'video_duration',
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      auctionStepPrice: {
        field: 'auction_step_price',
        type: DataTypes.INTEGER,
      },
      auctionStepTime: {
        field: 'auction_step_time',
        type: DataTypes.BIGINT,
      },

      nextAuctionStepTime: {
        field: 'next_auction_step_time',
        type: DataTypes.BIGINT,
      },
    },
    { timestamps: false }
  );

  NFTItem.getAll = () => {
    return NFTItem.findAll();
  };

  NFTItem.getByMediaFileId = (mediaFileId) => {
    return NFTItem.findOne({
      attributes: ['accountAddress', 'tokenId'],
      where: { mediaExternalUrl: mediaFileId },
    });
  };

  return NFTItem;
};

export default createNFTItemModel;
