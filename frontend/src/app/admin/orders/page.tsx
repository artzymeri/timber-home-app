'use client';

import { OrdersPipeline } from '@/components/orders-pipeline';

export default function AdminOrdersPage() {
  return <OrdersPipeline basePath="/admin/orders" />;
}
