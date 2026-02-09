import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';

export default function ModelMessage({ message }: { message: string }) {
  return (
    <div className="my-10 flex justify-end">
      <div className="w-max max-w-3xl rounded-3xl bg-sidebar-foreground p-4">
        <p className="text-primary-foreground">{message}</p>
      </div>
      <Avatar className="ml-6">
        <AvatarImage src="/avatar.png" />
        <AvatarFallback>MD</AvatarFallback>
      </Avatar>
    </div>
  );
}
