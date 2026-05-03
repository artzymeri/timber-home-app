import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { AppHeader } from '@/components/AppHeader';
import { Card, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';

export default function QaReportPage() {
  const { t } = useI18n();
  const toast = useToast();
  const [orderId, setOrderId] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!orderId.trim() || !notes.trim()) {
      toast.error(t('qa_required'));
      return;
    }
    setSubmitting(true);
    try {
      await api('/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          title: `QA report for #${orderId}`,
          message: notes,
          type: 'warning',
        }),
      }).catch(() => null);
      toast.success(t('qa_sent'));
      setOrderId('');
      setNotes('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <AppHeader title={t('qa_report')} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Card>
          <CardTitle>{t('qa_report_title')}</CardTitle>
          <View className="mt-3 gap-3">
            <Input
              label={t('qa_order_id')}
              value={orderId}
              onChangeText={setOrderId}
              keyboardType="number-pad"
            />
            <Input
              label={t('qa_notes')}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={6}
              className="h-32 py-3"
            />
            <Button onPress={submit} loading={submitting} fullWidth size="lg">
              {t('qa_submit')}
            </Button>
          </View>
        </Card>
        <Text className="px-2 text-xs text-muted-foreground">{t('mobile_qa_photo_note')}</Text>
      </ScrollView>
    </View>
  );
}
