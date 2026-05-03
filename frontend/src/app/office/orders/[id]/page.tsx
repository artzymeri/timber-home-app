'use client';

import { use } from 'react';
import { OrderDetail } from '@/components/order-detail';

export default function OfficeOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <OrderDetail orderId={id} />;
}
