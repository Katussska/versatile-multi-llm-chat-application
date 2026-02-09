import ChatContent from '@/components/chat/ChatContent.tsx';
import ChatInput from '@/components/chat/ChatInput.tsx';
import ModelSelector from '@/components/chat/ModelSelector.tsx';

export default function ChatSection() {
  return (
    <div className="flex h-screen w-full flex-col">
      <ModelSelector />
      <div className="flex-grow overflow-y-auto p-4">
        <ChatContent />
      </div>
      <ChatInput />
    </div>
  );
}
