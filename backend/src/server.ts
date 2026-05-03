import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import devicesRoutes from './routes/devices';
import roleRoutes from './routes/roles';
import userRoutes from './routes/users';
import stageRoutes from './routes/stages';
import orderRoutes, { publicOrderRouter } from './routes/orders';
import orderFilesRoutes from './routes/order-files';
import inventoryRoutes from './routes/inventory';
import fleetRoutes from './routes/fleet';
import documentRoutes from './routes/documents';
import attendanceRoutes from './routes/attendance';
import measurementsRoutes from './routes/measurements';
import quotesRoutes from './routes/quotes';
import bomRoutes from './routes/bom';
import analyticsRoutes from './routes/analytics';
import notificationsRoutes from './routes/notifications';
import purchaseOrdersRoutes from './routes/purchase-orders';
import signaturesRoutes from './routes/signatures';
import machineryRoutes from './routes/machinery';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/auth/devices', devicesRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stages', stageRoutes);
app.use('/api/orders', orderFilesRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/orders/public', publicOrderRouter);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/fleet', fleetRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/measurements', measurementsRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/bom', bomRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/purchase-orders', purchaseOrdersRoutes);
app.use('/api/signatures', signaturesRoutes);
app.use('/api/machinery', machineryRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`WoodFlow API running on port ${PORT}`);
});

export default app;
