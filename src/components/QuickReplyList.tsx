import React, { useState, useEffect } from 'react';
import { QuickReply } from '../types';
import { Plus, Edit2, Trash2, MessageSquare } from 'lucide-react';

interface QuickReplyListProps {
  onEditReply: (reply: QuickReply) => void;
  onDeleteReply: (id: string) => void;
  onNewReply: () => void;
}

export const QuickReplyList: React.FC<QuickReplyListProps> = ({ onEditReply, onDeleteReply, onNewReply }) => {
  const [replies, setReplies] = useState<QuickReply[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/quickreplies', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setReplies(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getPreview = (template: string) => {
    return template.length > 60 ? template.substring(0, 60) + '...' : template;
  };

  if (loading) {
    return <div className="p-6 text-center text-on-surface-variant">Loading...</div>;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="font-label text-[10px] font-medium tracking-widest uppercase text-primary mb-2">Templates</p>
            <h2 className="font-headline text-4xl font-extrabold tracking-tighter leading-none">Quick Replies</h2>
          </div>
          <button
            onClick={onNewReply}
            className="editorial-gradient px-4 py-2 rounded-full font-headline font-bold text-sm text-on-primary-fixed"
          >
            <Plus size={18} className="inline mr-1" /> New
          </button>
        </div>
        <div className="h-1 w-12 editorial-gradient rounded-full"></div>
      </section>

      {replies.length === 0 ? (
        <div className="bg-surface-container-low rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="text-on-surface-variant" size={32} />
          </div>
          <h3 className="font-headline text-lg font-bold mb-2">No quick replies</h3>
          <p className="text-on-surface-variant text-sm">Create templates for common responses</p>
        </div>
      ) : (
        <div className="space-y-3">
          {replies.map(reply => (
            <div key={reply._id} className="bg-surface-container rounded-xl p-4 flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">{reply.name}</h4>
                <p className="text-xs text-on-surface-variant mt-1">{getPreview(reply.template)}</p>
              </div>
              <div className="flex items-center gap-1 ml-4">
                <button
                  onClick={() => onEditReply(reply)}
                  className="p-2 hover:bg-surface-container-high rounded-lg"
                >
                  <Edit2 size={16} className="text-on-surface-variant" />
                </button>
                <button
                  onClick={() => onDeleteReply(reply._id)}
                  className="p-2 hover:bg-surface-container-high rounded-lg"
                >
                  <Trash2 size={16} className="text-error" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
