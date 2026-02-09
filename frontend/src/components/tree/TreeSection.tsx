import { useContext } from 'react';

import { TreeContext } from '@/components/TreeProvider.tsx';

export default function TreeSection() {
  const { showConversationTree } = useContext(TreeContext);

  if (!showConversationTree) return null;

  return (
    <div className="flex h-screen w-full flex-1 bg-sidebar">
      <div className="border-gray-30 mx-4 mb-7 mt-20 flex w-full flex-grow flex-col items-center rounded-2xl border">
        <h1 className="flex-grow content-center pb-10">Conversation Tree</h1>
        <p className="mb-7 flex w-full flex-row items-center justify-center">scales</p>
      </div>
    </div>
  );
}
