import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export interface RoleAttributes {
  id?: number;
  role_name: string;
  permissions: string[];
  allowed_pages: string[];
  icon: string;
  default_route: string;
  is_system: boolean;
  description?: string | null;
}

class Role extends Model<RoleAttributes> implements RoleAttributes {
  public id!: number;
  public role_name!: string;
  public permissions!: string[];
  public allowed_pages!: string[];
  public icon!: string;
  public default_route!: string;
  public is_system!: boolean;
  public description!: string | null;
}

Role.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    role_name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    permissions: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    allowed_pages: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    icon: { type: DataTypes.STRING(64), allowNull: false, defaultValue: 'UserCircle' },
    default_route: { type: DataTypes.STRING(128), allowNull: false, defaultValue: '/admin/dashboard' },
    is_system: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    description: { type: DataTypes.STRING(255), allowNull: true },
  },
  { sequelize, tableName: 'roles', underscored: true }
);

export default Role;
