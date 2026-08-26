import React, { useState, useEffect } from 'react';
import AdminModal from '../common/AdminModal';
import { Send, Lock, Globe, AlertCircle } from 'lucide-react';

export const ReplyFeedbackModal = ({
  isOpen,
  onClose,
  ticket,
  onReply,
}) => {
  const [message, setMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMessage('');
    setIsInternalNote(false);
    setError('');
  }, [isOpen, ticket]);

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError('Please enter a response or internal note');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await onReply(ticket._id, message, isInternalNote);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit reply.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!ticket) return null;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={isInternalNote ? 'Add Confidential Internal Note' : `Reply to ${ticket.userName}`}
      description={`Post a response to Ticket ${ticket.ticketId}.`}
      confirmLabel={isInternalNote ? 'Save Internal Note' : 'Dispatch Response to Subscriber'}
      isConfirming={submitting}
      onConfirm={handleSubmit}
      size="md"
    >
      <div className="space-y-4 text-xs select-none font-sans">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setIsInternalNote(false)}
            className={`p-3 rounded-xl border flex items-center gap-2 font-bold cursor-pointer transition-all ${
              !isInternalNote
                ? 'bg-blue-50 border-[#284661] text-[#284661] shadow-2xs'
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Globe className="w-4 h-4 text-sky-600" />
            <div className="text-left">
              <span className="block text-xs">Official Response</span>
              <span className="text-[10px] text-slate-400 font-normal">Sent to subscriber</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setIsInternalNote(true)}
            className={`p-3 rounded-xl border flex items-center gap-2 font-bold cursor-pointer transition-all ${
              isInternalNote
                ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Lock className="w-4 h-4 text-[#E76120]" />
            <div className="text-left">
              <span className="block text-xs">Internal Note</span>
              <span className="text-[10px] text-slate-400 font-normal">Staff-only audit log</span>
            </div>
          </button>
        </div>

        {/* Message Input */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-700 block">
            {isInternalNote ? 'Internal Note Content' : 'Official Subscriber Response'}
          </label>
          <textarea
            rows={4}
            placeholder={
              isInternalNote
                ? 'Add confidential findings for editorial staff...'
                : 'Compose official response to subscriber...'
            }
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#E76120]"
          />
        </div>
      </div>
    </AdminModal>
  );
};

export default ReplyFeedbackModal;
