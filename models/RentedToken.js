import { Sequelize } from 'sequelize';
const DataTypes = Sequelize.DataTypes;

const createRentedTokenModel = (sequelize) => {
  const RentedToken = sequelize.define(
    'rented_token',
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
      rentActive: {
        field: 'rent_active',
        type: DataTypes.BOOLEAN,
      },
      rentExpired: {
        field: 'rent_expired',
        type: DataTypes.BOOLEAN,
      },
      rentEndDate: {
        field: 'rent_end_date',
        type: DataTypes.INTEGER,
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
    },
    { timestamps: false }
  );

  RentedToken.getAll = () => {
    return RentedToken.findAll();
  };

  RentedToken.getByTokenId = (tokenId) => {
    return RentedToken.findOne({
      where: { tokenId: tokenId },
    });
  };

  return RentedToken;
};

export default createRentedTokenModel;
