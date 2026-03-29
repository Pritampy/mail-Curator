import React from 'react';
import { Email } from '../types';
import { Trash2, Archive, SkipForward, Tag, X, CheckSquare, Square } from 'lucide-react';

interface BulkSelectModeProps {
  emails: Email[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkAction: (action: 'delete' | 'archive' | 'skip' | 'label', emailIds: string[]) => void;
}

export const BulkSelectMode: React.FC<BulkSelectModeProps> = ({
  emails,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onBulkAction
}) => {
  const selectedCount = selectedIds.size;

  return (
    <div className="space-y-4">
      {/* Selection Header */}
      <div className="bg-surface-container-low rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onSelectAll}
            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80"
          >
            <CheckSquare size={18} />
            Select all ({emails.length})
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-on-surface-variant">
            {selectedCount} selected
          </span>
          <button
            onClick={onClearSelection}
            className="p-2 hover:bg-surface-container rounded-lg"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Email List with Checkboxes */}
      <div className="space-y-2">
        {emails.map(email => (
          <div
            key={email.id}
            onClick={() => onToggleSelect(email.id)}
            className={`bg-surface-container rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all ${
              selectedIds.has(email.id) ? 'ring-2 ring-primary' : ''
            }`}
          >
            <div className="text-primary">
              {selectedIds.has(email.id) ? (
                <CheckSquare size={20} />
              ) : (
                <Square size={20} className="text-on-surface-variant" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{email.from.split('<')[0].trim()}</p>
              <p className="text-xs text-on-surface-variant truncate">{email.subject}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Action Bar */}
      {selectedCount > 0 && (
        <div className="fixed bottom-24 left-0 right-0 px-4">
          <div className="max-w-lg mx-auto bg-surface-container-high rounded-2xl p-4 flex items-center justify-around shadow-xl">
            <button
              onClick={() => onBulkAction('delete', Array.from(selectedIds))}
              className="flex flex-col items-center gap-1 p-3 hover:bg-error/10 rounded-xl transition-colors"
            >
              <Trash2 size={20} className="text-error" />
              <span className="text-xs">Delete</span>
            </button>
            <button
              onClick={() => onBulkAction('archive', Array.from(selectedIds))}
              className="flex flex-col items-center gap-1 p-3 hover:bg-surface-container rounded-xl transition-colors"
            >
              <Archive size={20} className="text-primary" />
              <span className="text-xs">Archive</span>
            </button>
            <button
              onClick={() => onBulkAction('skip', Array.from(selectedIds))}
              className="flex flex-col items-center gap-1 p-3 hover:bg-surface-container rounded-xl transition-colors"
            >
              <SkipForward size={20} className="text-primary" />
              <span className="text-xs">Skip</span>
            </button>
            <button
              onClick={() => {
                const label = prompt('Enter label name:');
                if (label) onBulkAction('label', Array.from(selectedIds));
              }}
              className="flex flex-col items-center gap-1 p-3 hover:bg-surface-container rounded-xl transition-colors"
            >
              <Tag size={20} className="text-primary" />
              <span className="text-xs">Label</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
