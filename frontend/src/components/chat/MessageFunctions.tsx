import { Bookmark, ChevronDown, CirclePlus, Clipboard, RefreshCw } from 'lucide-react';

export default function MessageFunctions() {
  return (
    <div className="ml-16 flex max-w-3xl justify-between px-3">
      <div className="mt-2 flex">
        <Bookmark size={16} className="mx-1" />
        <Clipboard size={16} className="mx-1" />
      </div>
      <div className="mt-2 flex">
        <div className="flex items-center">
          <RefreshCw size={16} />
          <ChevronDown size={14} />
        </div>
        <div className="mx-1 flex items-center">
          <CirclePlus size={16} />
          <ChevronDown size={14} />
        </div>
      </div>
    </div>
  );
}
