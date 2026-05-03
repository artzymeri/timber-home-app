import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

export interface DeviceTokenAttributes {
  id?: number;
  user_id: number;
  expo_push_token: string;
  platform: string;
}

class DeviceToken extends Model<DeviceTokenAttributes> implements DeviceTokenAttributes {
  public id!: number;
  public user_id!: number;
  public expo_push_token!: string;
  public platform!: string;
}

DeviceToken.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    expo_push_token: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    platform: { type: DataTypes.STRING(16), allowNull: false },
  },
  { sequelize, tableName: 'device_tokens', underscored: true }
);

DeviceToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(DeviceToken, { foreignKey: 'user_id', as: 'devices' });

export default DeviceToken;
