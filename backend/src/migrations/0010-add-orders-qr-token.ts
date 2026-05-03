import { QueryInterface, DataTypes } from 'sequelize';
import { randomUUID } from 'crypto';

// Each order gets a stable, opaque QR token. Encoded into the QR; mobile
// scanner exchanges the token for an order id via /api/orders/by-qr/:token.
// Tokens are unique but not secret — the API still requires auth.
export const up = async ({ context: queryInterface }: { context: QueryInterface }) => {
  await queryInterface.addColumn('orders', 'qr_token', {
    type: DataTypes.STRING(36),
    allowNull: true, // briefly nullable so we can backfill before locking
  });

  // Backfill existing rows.
  const sequelize = queryInterface.sequelize;
  const [rows]: any = await sequelize.query(`SELECT id FROM orders WHERE qr_token IS NULL`);
  for (const r of rows) {
    await sequelize.query(`UPDATE orders SET qr_token = ? WHERE id = ?`, {
      replacements: [randomUUID(), r.id],
    });
  }

  // Now lock it down: NOT NULL + unique.
  await queryInterface.changeColumn('orders', 'qr_token', {
    type: DataTypes.STRING(36),
    allowNull: false,
  });
  await queryInterface.addIndex('orders', ['qr_token'], { unique: true, name: 'orders_qr_token_unique' });
};

export const down = async ({ context: queryInterface }: { context: QueryInterface }) => {
  await queryInterface.removeIndex('orders', 'orders_qr_token_unique');
  await queryInterface.removeColumn('orders', 'qr_token');
};
