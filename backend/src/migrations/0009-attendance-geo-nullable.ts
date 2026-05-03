import { QueryInterface, DataTypes } from 'sequelize';

// Make attendance.is_within_radius nullable so non-geofenced check-ins (mobile
// v1) can record without lat/lng. Web flow keeps sending real coords.
export const up = async ({ context: queryInterface }: { context: QueryInterface }) => {
  await queryInterface.changeColumn('attendance', 'is_within_radius', {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: null,
  });
};

export const down = async ({ context: queryInterface }: { context: QueryInterface }) => {
  await queryInterface.changeColumn('attendance', 'is_within_radius', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
};
