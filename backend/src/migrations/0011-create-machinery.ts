import { QueryInterface, DataTypes } from 'sequelize';

export const up = async ({ context: queryInterface }: { context: QueryInterface }) => {
  await queryInterface.createTable('machinery', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    type: { type: DataTypes.STRING(80), allowNull: false },
    serial_number: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    location: { type: DataTypes.STRING(120), allowNull: true },
    status: {
      type: DataTypes.ENUM('operational', 'idle', 'maintenance', 'error'),
      allowNull: false,
      defaultValue: 'idle',
    },
    error_message: { type: DataTypes.TEXT, allowNull: true },
    last_service_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });

  await queryInterface.addIndex('machinery', ['status']);
};

export const down = async ({ context: queryInterface }: { context: QueryInterface }) => {
  await queryInterface.dropTable('machinery');
};
