import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export type StageColor = 'stone' | 'amber' | 'blue' | 'emerald' | 'violet' | 'rose';

export interface StageAttributes {
  id?: number;
  code: string;
  label_key?: string | null;
  name: string;
  description?: string | null;
  parent_id?: number | null;
  sort_order: number;
  icon: string;
  color: StageColor;
  is_initial: boolean;
  is_terminal: boolean;
  is_system: boolean;
}

class Stage extends Model<StageAttributes> implements StageAttributes {
  public id!: number;
  public code!: string;
  public label_key!: string | null;
  public name!: string;
  public description!: string | null;
  public parent_id!: number | null;
  public sort_order!: number;
  public icon!: string;
  public color!: StageColor;
  public is_initial!: boolean;
  public is_terminal!: boolean;
  public is_system!: boolean;
  public parent?: Stage;
  public children?: Stage[];
}

Stage.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    label_key: { type: DataTypes.STRING(80), allowNull: true },
    name: { type: DataTypes.STRING(80), allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: true },
    parent_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    icon: { type: DataTypes.STRING(64), allowNull: false, defaultValue: 'Circle' },
    color: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'stone' },
    is_initial: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    is_terminal: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    is_system: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { sequelize, tableName: 'stages', underscored: true }
);

Stage.belongsTo(Stage, { foreignKey: 'parent_id', as: 'parent' });
Stage.hasMany(Stage, { foreignKey: 'parent_id', as: 'children' });

export default Stage;
