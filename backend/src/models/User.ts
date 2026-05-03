import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Role from './Role';

export interface UserAttributes {
  id?: number;
  name: string;
  email: string;
  password_hash: string;
  role_id: number;
  must_change_password?: boolean;
  invite_token?: string | null;
  invite_token_expires_at?: Date | null;
  invited_at?: Date | null;
}

class User extends Model<UserAttributes> implements UserAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public password_hash!: string;
  public role_id!: number;
  public must_change_password!: boolean;
  public invite_token!: string | null;
  public invite_token_expires_at!: Date | null;
  public invited_at!: Date | null;
  public role?: Role;
}

User.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    role_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    must_change_password: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    invite_token: { type: DataTypes.STRING(64), allowNull: true, unique: true },
    invite_token_expires_at: { type: DataTypes.DATE, allowNull: true },
    invited_at: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, tableName: 'users', underscored: true }
);

User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

export default User;
