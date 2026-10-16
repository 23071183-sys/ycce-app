import api from '../../services/api';

export const INVOICE_STATUS = {
  paid: { tone: 'success', label: 'Paid' },
  partial: { tone: 'warning', label: 'Part paid' },
  unpaid: { tone: 'danger', label: 'Unpaid' },
  waived: { tone: 'neutral', label: 'Waived' },
};

export const PAYMENT_STATUS = {
  captured: { tone: 'success', label: 'Paid' },
  pending: { tone: 'warning', label: 'Pending' },
  created: { tone: 'warning', label: 'Pending' },
  failed: { tone: 'danger', label: 'Failed' },
};

export const PAYMENT_METHOD = { razorpay: 'Online', cash: 'Cash', cheque: 'Cheque' };

export const outstanding = (inv) => Math.max(0, (inv?.amount_due_paise || 0) - (inv?.amount_paid_paise || 0));
export const isOpen = (inv) => ['unpaid', 'partial'].includes(inv?.status);

export const isOverdue = (inv) => {
  if (!isOpen(inv) || !inv?.due_date) return false;
  const due = new Date(inv.due_date);
  due.setHours(23, 59, 59, 999);
  return due < new Date();
};

const pendingIds = (invoices) =>
  invoices.flatMap(inv => (inv?.payments || []).filter(p => ['created', 'pending'].includes(p.status)).map(p => p.id));

// Asks the server to check Razorpay for payments that were still pending, so
// a payment completed in the browser shows up when the user comes back.
// Resolves to true if any of them changed state.
export async function refreshPendingPayments(invoices) {
  const ids = pendingIds(invoices);
  if (!ids.length) return false;
  const results = await Promise.allSettled(ids.map(id => api.post(`/fees/payments/${id}/refresh`)));
  return results.some(r => r.status === 'fulfilled' && !['created', 'pending'].includes(r.value.data?.status));
}
