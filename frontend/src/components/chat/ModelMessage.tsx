import MessageFunctions from '@/components/chat/MessageFunctions.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';

export default function ModelMessage({ message }: { message: string }) {
  return (
    <div className="my-10 flex flex-col">
      <div className="flex">
        <Avatar className="mr-6">
          <AvatarImage src="/chatGPT.png" />
          <AvatarFallback>MD</AvatarFallback>
        </Avatar>
        <div className="mr-5 w-max max-w-3xl rounded-3xl bg-sidebar p-4">
          <p>{message}</p>
        </div>
      </div>
      <MessageFunctions />
    </div>
  );
}
