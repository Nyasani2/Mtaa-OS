import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { reportService } from '../services/reportService';
import type { ReportInput, ReportReason } from '../types';

export function useReport() {
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: 'post' | 'user' | 'comment'; id: string } | null>(null);
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');

  const submitReport = useMutation({
    mutationFn: (input: ReportInput) => reportService.submitReport(input),
    onSuccess: () => {
      setShowReportModal(false);
      setReportTarget(null);
      setSelectedReason(null);
      setDetails('');
    },
  });

  const openReport = useCallback((type: 'post' | 'user' | 'comment', id: string) => {
    setReportTarget({ type, id });
    setShowReportModal(true);
  }, []);

  const closeReport = useCallback(() => {
    setShowReportModal(false);
    setReportTarget(null);
    setSelectedReason(null);
    setDetails('');
  }, []);

  const submit = useCallback(() => {
    if (!reportTarget || !selectedReason) return;
    submitReport.mutate({
      targetType: reportTarget.type,
      targetId: reportTarget.id,
      reason: selectedReason,
      details,
    });
  }, [reportTarget, selectedReason, details, submitReport]);

  return {
    showReportModal,
    reportTarget,
    selectedReason,
    setSelectedReason,
    details,
    setDetails,
    openReport,
    closeReport,
    submit,
    isSubmitting: submitReport.isPending,
  };
}
