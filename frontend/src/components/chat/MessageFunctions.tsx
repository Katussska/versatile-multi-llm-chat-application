import { Bookmark, Clipboard, RefreshCw } from 'lucide-react';

export default function MessageFunctions() {
  return (
    <div className="mt-1 flex items-center justify-end gap-2">
      <Bookmark size={14} />
      <Clipboard size={14} />
      <RefreshCw size={14} />
    </div>
  );
}
