import { QueryInterface, DataTypes } from 'sequelize';

export const up = async ({ context: queryInterface }: { context: QueryInterface }) => {
  await queryInterface.addColumn('roles', 'icon', {
    type: DataTypes.STRING(64),
    allowNull: false,
    defaultValue: 'UserCircle',
  });

  await queryInterface.addColumn('roles', 'default_route', {
    type: DataTypes.STRING(128),
    allowNull: false,
    defaultValue: '/admin/dashboard',
  });

  await queryInterface.addColumn('roles', 'is_system', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });

  await queryInterface.addColumn('roles', 'description', {
    type: DataTypes.STRING(255),
    allowNull: true,
  });

  await queryInterface.addColumn('users', 'must_change_password', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });

  await queryInterface.addColumn('users', 'invite_token', {
    type: DataTypes.STRING(64),
    allowNull: true,
    unique: true,
  });

  await queryInterface.addColumn('users', 'invite_token_expires_at', {
    type: DataTypes.DATE,
    allowNull: true,
  });

  await queryInterface.addColumn('users', 'invited_at', {
    type: DataTypes.DATE,
    allowNull: true,
  });
};

export const down = async ({ context: queryInterface }: { context: QueryInterface }) => {
  await queryInterface.removeColumn('users', 'invited_at');
  await queryInterface.removeColumn('users', 'invite_token_expires_at');
  await queryInterface.removeColumn('users', 'invite_token');
  await queryInterface.removeColumn('users', 'must_change_password');
  await queryInterface.removeColumn('roles', 'description');
  await queryInterface.removeColumn('roles', 'is_system');
  await queryInterface.removeColumn('roles', 'default_route');
  await queryInterface.removeColumn('roles', 'icon');
};
