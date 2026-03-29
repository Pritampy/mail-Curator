import React, { useState, useEffect } from 'react';
import { QuickReply } from '../types';
import { X } from 'lucide-react';

interface QuickReplyEditorProps {
  reply?: QuickReply | null;
  onSave: (name: string, template: string) => void;
  onClose: () => void;
}

export const QuickReplyEditor: React.FC<QuickReplyEditorProps> = ({ reply, onSave, onClose }) => {
  const [name, setName] = useState('');
  const [template, setTemplate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (reply) {
      setName(reply.name);
      setTemplate(reply.template);
    }
  }, [reply]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!template.trim()) newErrors.template = 'Template is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(name, template);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-container-high rounded-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-outline-variant">
          <h3 className="font-headline text-xl font-bold">
            {reply ? 'Edit Quick Reply' : 'New Quick Reply'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <label className="block font-label text-[10px] font-medium tracking-widest uppercase text-on-surface-variant mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Out of Office"
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
            />
            {errors.name && <p className="text-error text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block font-label text-[10px] font-medium tracking-widest uppercase text-on-surface-variant mb-2">
              Template
            </label>
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="Thank you for your email. I'll get back to you shortly."
              rows={5}
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary resize-none"
            />
            {errors.template && <p className="text-error text-xs mt-1">{errors.template}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-full font-headline font-bold border border-outline-variant"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 editorial-gradient py-3 rounded-full font-headline font-bold text-on-primary-fixed"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
