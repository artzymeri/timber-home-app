import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Stage from './Stage';

/**
 * Legacy stage codes — kept for backwards compatibility with the orders.status ENUM
 * column, which is still populated alongside stage_id during the PR-A → PR-B transition.
 * New code paths should use Stage rows + Stage.code instead.
 */
export const LEGACY_ORDER_STAGES = [
  'ESTIMATE',
  'MEASUREMENT',
  'DESIGN_APPROVAL',
  'CUTTING',
  'CNC',
  'FINISHING',
  'PACKING',
  'INSTALLATION',
  'COMPLETED',
] as const;

export type LegacyOrderStage = (typeof LEGACY_ORDER_STAGES)[number];

export interface OrderAttributes {
  id?: number;
  client_name: string;
  client_email: string;
  client_phone: string;
  address: string;
  status?: LegacyOrderStage;
  stage_id: number;
  assigned_to?: number | null;
  total_amount?: number;
  notes?: string;
  qr_token?: string;
}

class Order extends Model<OrderAttributes> implements OrderAttributes {
  public id!: number;
  public client_name!: string;
  public client_email!: string;
  public client_phone!: string;
  public address!: string;
  public status!: LegacyOrderStage;
  public stage_id!: number;
  public assigned_to!: number | null;
  public total_amount!: number;
  public notes!: string;
  public qr_token!: string;
  public stage?: Stage;
}

Order.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    client_name: { type: DataTypes.STRING(150), allowNull: false },
    client_email: { type: DataTypes.STRING(255), allowNull: true },
    client_phone: { type: DataTypes.STRING(30), allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: false },
    status: {
      type: DataTypes.ENUM(...LEGACY_ORDER_STAGES),
      allowNull: false,
      defaultValue: 'ESTIMATE',
    },
    stage_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    assigned_to: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    total_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: true, defaultValue: 0 },
    notes: { type: DataTypes.TEXT, allowNull: true },
    qr_token: { type: DataTypes.STRING(36), allowNull: false, unique: true },
  },
  { sequelize, tableName: 'orders', underscored: true }
);

Order.belongsTo(Stage, { foreignKey: 'stage_id', as: 'stage' });
Stage.hasMany(Order, { foreignKey: 'stage_id', as: 'orders' });

export default Order;
