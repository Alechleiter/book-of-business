'use client';

import { useState } from 'react';
import { useNotes } from '@/lib/hooks/use-notes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MessageSquare, Send, Phone, Mail, UserRound, Building2, AlertCircle } from 'lucide-react';

const NOTE_TYPES = [
  { value: 'general', label: 'General', icon: MessageSquare, color: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400' },
  { value: 'contact_update', label: 'Contact Update', icon: Phone, color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
  { value: 'mgmt_change', label: 'Mgmt Change', icon: Building2, color: 'bg-purple-500/15 text-purple-600 dark:text-purple-400' },
  { value: 'staff_change', label: 'Staff Change', icon: UserRound, color: 'bg-orange-500/15 text-orange-600 dark:text-orange-400' },
  { value: 'important', label: 'Important', icon: AlertCircle, color: 'bg-red-500/15 text-red-600 dark:text-red-400' },
];

export function NotesSection({ propertyId }: { propertyId: number }) {
  const { notes, addNote } = useNotes(propertyId);
  const [text, setText] = useState('');
  const [noteType, setNoteType] = useState('general');

  const handleSubmit = () => {
    if (!text.trim()) return;
    addNote(text, noteType);
    setText('');
    setNoteType('general');
  };

  const getNoteTypeInfo = (type: string) => NOTE_TYPES.find((t) => t.value === type) || NOTE_TYPES[0];

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold flex items-center gap-2">
        <MessageSquare className="h-4 w-4" /> Notes ({notes.length})
      </h4>

      {/* Note type selector */}
      <div className="flex gap-1.5 flex-wrap">
        {NOTE_TYPES.map((t) => {
          const Icon = t.icon;
          return (
            <Button
              key={t.value}
              variant={noteType === t.value ? 'default' : 'outline'}
              size="sm"
              className="text-[10px] h-6 px-2"
              onClick={() => setNoteType(t.value)}
            >
              <Icon className="h-3 w-3 mr-1" /> {t.label}
            </Button>
          );
        })}
      </div>

      {/* Hint for contact updates */}
      {noteType === 'contact_update' && (
        <p className="text-[10px] text-blue-500 italic">
          Track phone/email changes here. E.g. &quot;New phone: (555) 123-4567, old was (555) 999-0000&quot;
        </p>
      )}
      {noteType === 'mgmt_change' && (
        <p className="text-[10px] text-purple-500 italic">
          Track management company changes. E.g. &quot;Switched from ABC Mgmt to XYZ Properties on 6/1&quot;
        </p>
      )}
      {noteType === 'staff_change' && (
        <p className="text-[10px] text-orange-500 italic">
          Track staff changes. E.g. &quot;New onsite manager: Jane Doe, replaced John Smith&quot;
        </p>
      )}

      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            noteType === 'contact_update' ? 'Describe the contact info change...'
            : noteType === 'mgmt_change' ? 'Describe the management change...'
            : noteType === 'staff_change' ? 'Describe the staff change...'
            : 'Add a note...'
          }
          className="text-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <Button size="icon" onClick={handleSubmit} className="flex-shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {notes.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {notes.map((n) => {
            const info = getNoteTypeInfo(n.note_type);
            const Icon = info.icon;
            return (
              <div key={n.id} className={cn('rounded-lg p-3 text-sm border', info.color.includes('zinc') ? 'bg-muted/50' : info.color.split(' ')[0])}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-3 w-3" />
                  <Badge variant="secondary" className={cn('text-[9px] px-1.5 py-0', info.color)}>
                    {info.label}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p>{n.note}</p>
                <p className="text-[10px] text-muted-foreground mt-1">by {n.author}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
