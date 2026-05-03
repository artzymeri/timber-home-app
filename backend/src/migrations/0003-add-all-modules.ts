import { QueryInterface, DataTypes } from 'sequelize';

export const up = async ({ context: queryInterface }: { context: QueryInterface }) => {
  // Attendance / GPS Check-in/out
  await queryInterface.createTable('attendance', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
    type: { type: DataTypes.ENUM('check_in', 'check_out'), allowNull: false },
    latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    is_within_radius: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    notes: { type: DataTypes.STRING(500), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });

  // Measurements
  await queryInterface.createTable('measurements', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    order_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'orders', key: 'id' } },
    recorded_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
    room_name: { type: DataTypes.STRING(100), allowNull: false },
    dimensions: { type: DataTypes.JSON, allowNull: false, defaultValue: '{}' },
    notes: { type: DataTypes.TEXT, allowNull: true },
    photos: { type: DataTypes.JSON, allowNull: true, defaultValue: '[]' },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });

  // Design files
  await queryInterface.createTable('design_files', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    order_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'orders', key: 'id' } },
    uploaded_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
    file_name: { type: DataTypes.STRING(255), allowNull: false },
    file_url: { type: DataTypes.STRING(500), allowNull: false },
    file_type: { type: DataTypes.STRING(50), allowNull: false },
    version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    approved_by_client: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    approved_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });

  // BOM (Bill of Materials)
  await queryInterface.createTable('bom_items', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    order_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'orders', key: 'id' } },
    inventory_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, references: { model: 'inventory', key: 'id' } },
    material_name: { type: DataTypes.STRING(200), allowNull: false },
    quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    unit: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'pcs' },
    unit_cost: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    total_cost: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });

  // Quotes / Offers
  await queryInterface.createTable('quotes', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    order_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'orders', key: 'id' } },
    created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
    materials_cost: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    labor_hours: { type: DataTypes.DECIMAL(6, 1), allowNull: false, defaultValue: 0 },
    labor_rate: { type: DataTypes.DECIMAL(8, 2), allowNull: false, defaultValue: 0 },
    labor_cost: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    markup_percent: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 20 },
    subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    tax_percent: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    total: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    status: { type: DataTypes.ENUM('draft', 'sent', 'approved', 'rejected'), allowNull: false, defaultValue: 'draft' },
    client_approved_at: { type: DataTypes.DATE, allowNull: true },
    pdf_url: { type: DataTypes.STRING(500), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });

  // Vehicle details (extended)
  await queryInterface.addColumn('fleet', 'registration_expiry', { type: DataTypes.DATEONLY, allowNull: true });
  await queryInterface.addColumn('fleet', 'insurance_expiry', { type: DataTypes.DATEONLY, allowNull: true });
  await queryInterface.addColumn('fleet', 'last_latitude', { type: DataTypes.DECIMAL(10, 7), allowNull: true });
  await queryInterface.addColumn('fleet', 'last_longitude', { type: DataTypes.DECIMAL(10, 7), allowNull: true });
  await queryInterface.addColumn('fleet', 'last_gps_update', { type: DataTypes.DATE, allowNull: true });

  // Vehicle service log
  await queryInterface.createTable('vehicle_services', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    vehicle_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'fleet', key: 'id' } },
    service_type: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    cost: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    service_date: { type: DataTypes.DATEONLY, allowNull: false },
    next_service_date: { type: DataTypes.DATEONLY, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });

  // Purchase orders (auto re-order)
  await queryInterface.createTable('purchase_orders', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    inventory_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'inventory', key: 'id' } },
    quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    unit_cost: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    total_cost: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    status: { type: DataTypes.ENUM('suggested', 'pending_approval', 'approved', 'ordered', 'received'), allowNull: false, defaultValue: 'suggested' },
    approved_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, references: { model: 'users', key: 'id' } },
    supplier: { type: DataTypes.STRING(200), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });

  // Client signatures
  await queryInterface.createTable('signatures', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    order_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'orders', key: 'id' } },
    type: { type: DataTypes.ENUM('measurement_approval', 'design_approval', 'quote_approval', 'installation_signoff'), allowNull: false },
    signer_name: { type: DataTypes.STRING(150), allowNull: false },
    signature_data: { type: DataTypes.TEXT('long'), allowNull: false },
    signed_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });

  // Notifications
  await queryInterface.createTable('notifications', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
    title: { type: DataTypes.STRING(200), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    type: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'info' },
    read: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    link: { type: DataTypes.STRING(500), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });

  // CNC export logs
  await queryInterface.createTable('cnc_exports', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    order_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'orders', key: 'id' } },
    exported_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
    file_format: { type: DataTypes.ENUM('dxf', 'csv', 'gcode'), allowNull: false },
    file_url: { type: DataTypes.STRING(500), allowNull: false },
    pieces_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });
};

export const down = async ({ context: queryInterface }: { context: QueryInterface }) => {
  await queryInterface.dropTable('cnc_exports');
  await queryInterface.dropTable('notifications');
  await queryInterface.dropTable('signatures');
  await queryInterface.dropTable('purchase_orders');
  await queryInterface.dropTable('vehicle_services');
  await queryInterface.removeColumn('fleet', 'last_gps_update');
  await queryInterface.removeColumn('fleet', 'last_longitude');
  await queryInterface.removeColumn('fleet', 'last_latitude');
  await queryInterface.removeColumn('fleet', 'insurance_expiry');
  await queryInterface.removeColumn('fleet', 'registration_expiry');
  await queryInterface.dropTable('quotes');
  await queryInterface.dropTable('bom_items');
  await queryInterface.dropTable('design_files');
  await queryInterface.dropTable('measurements');
  await queryInterface.dropTable('attendance');
};
