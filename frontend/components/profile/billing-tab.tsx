import { Calendar, CheckCircle2, CreditCard, Download, Loader2 } from 'lucide-react';

interface BillingTabProps {
  dataLoading: boolean;
  payments: any[];
  downloadingPayments: boolean;
  setDownloadType: (type: 'bookings' | 'payments') => void;
  setShowDownloadModal: (show: boolean) => void;
}

export function BillingTab({ 
  dataLoading, 
  payments, 
  downloadingPayments, 
  setDownloadType, 
  setShowDownloadModal 
}: BillingTabProps) {
  return (
    <div className="animate-in fade-in duration-300">
      <div className='mb-6'>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Billing</h2>
        <p className="text-sm text-slate-500">Your payment history</p>
      </div>
      {dataLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-12 h-12 animate-spin text-slate-400" /></div>
      ) : payments.length > 0 ? (
        <>
          {/* Download Header */}
          <div className="flex justify-between items-center mb-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-white">Payment History</h3>
            <button
              onClick={() => { setDownloadType('payments'); setShowDownloadModal(true); }}
              disabled={downloadingPayments}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloadingPayments ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Download
            </button>
          </div>

          <div className="space-y-3">
          {payments.map((payment: any) => (
            <div key={payment.id} className="p-5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4 text-primary-500" />
                    <p className="font-bold text-lg text-slate-900 dark:text-white">৳{payment.amount?.toLocaleString()}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(payment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">Method:</span>
                      {payment.method || 'N/A'}
                    </div>
                    {payment.transactionId && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">TXN:</span>
                        <span className="font-mono">{payment.transactionId.substring(0, 12)}...</span>
                      </div>
                    )}
                  </div>
                </div>
                <span className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
                  payment.status === 'PAID' || payment.status === 'COMPLETED' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' :
                  payment.status === 'PENDING' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800' :
                  payment.status === 'FAILED' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800' :
                  payment.status === 'REFUNDED' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800' :
                  'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}>
                  {(payment.status === 'PAID' || payment.status === 'COMPLETED') && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                  {payment.status}
                </span>
              </div>
              {payment.invoiceUrl && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                  <a 
                    href={payment.invoiceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium flex items-center gap-1"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    View Invoice
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </>
      ) : (
        <div className="py-12 text-center">
          <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-bold text-slate-900 dark:text-white mb-2">No Payments Yet</h3>
          <p className="text-sm text-slate-500">Your payment history will appear here</p>
        </div>
      )}
    </div>
  );
}
