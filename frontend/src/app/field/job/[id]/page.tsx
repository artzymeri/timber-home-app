'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export default function JobDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Job #{params.id}</h2>
        <Badge>Installation</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Client Details</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Client:</span> Maria Johnson</p>
          <p><span className="text-muted-foreground">Address:</span> 42 Oak Street, Portland, OR</p>
          <p><span className="text-muted-foreground">Phone:</span> (503) 555-0142</p>
          <p><span className="text-muted-foreground">Order:</span> #098</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">On-Site Actions</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full h-12 text-base font-semibold">Confirm GPS Arrival</Button>
          <Separator />
          <Button variant="outline" className="w-full h-12 text-base">Sync On-Site Measurements</Button>
          <Separator />
          <div className="space-y-2">
            <p className="text-sm font-medium">Client Sign-Off</p>
            <div className="h-40 border-2 border-dashed rounded-md flex items-center justify-center text-muted-foreground text-sm">
              Signature pad placeholder — tap to sign
            </div>
          </div>
          <Button className="w-full h-12 text-base font-semibold">Complete Job</Button>
        </CardContent>
      </Card>
    </div>
  );
}
