'use client';

import { useState } from 'react';
import { Camera } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { MockDataNotice } from '@/components/mock-data-notice';
import { useI18n } from '@/lib/i18n';

export default function QAReportPage() {
  const { t } = useI18n();
  const [orderNum, setOrderNum] = useState('');
  const [issue, setIssue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Backend endpoint not wired yet — simulate success for now.
    await new Promise((r) => setTimeout(r, 600));
    toast.success(t('submit_report'));
    setOrderNum('');
    setIssue('');
    setSubmitting(false);
  };

  return (
    <PageContainer size="default">
      <div className="space-y-4">
        <PageHeader title={t('qa_title')} description={t('qa_subtitle')} />
        <MockDataNotice message={t('qa_pending_endpoint')} />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('report_issue')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="order">{t('qa_order_number')}</Label>
                <Input
                  id="order"
                  inputMode="numeric"
                  placeholder="102"
                  value={orderNum}
                  onChange={(e) => setOrderNum(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="issue">{t('qa_issue')}</Label>
                <Textarea
                  id="issue"
                  rows={4}
                  placeholder={t('qa_issue_placeholder')}
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t('qa_photo')}</Label>
                <div className="flex h-32 cursor-pointer items-center justify-center rounded-md border-2 border-dashed text-sm text-muted-foreground transition-colors hover:bg-accent/30">
                  <div className="flex flex-col items-center gap-1">
                    <Camera size={20} />
                    <span>{t('photo_placeholder')}</span>
                  </div>
                </div>
              </div>
              <Button type="submit" className="h-12 w-full text-base font-semibold" disabled={submitting}>
                {submitting ? '…' : t('qa_submit')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
