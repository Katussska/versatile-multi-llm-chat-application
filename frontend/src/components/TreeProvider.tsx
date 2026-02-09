import React, { Dispatch, SetStateAction, useState } from 'react';

interface TreeContextType {
  showConversationTree: boolean;
  setShowConversationTree: Dispatch<SetStateAction<boolean>>;
}

export const TreeContext = React.createContext<TreeContextType>({
  showConversationTree: false,
  setShowConversationTree: () => {},
});

export default function TreeProvider({ children }: { children: React.ReactNode }) {
  const [showConversationTree, setShowConversationTree] = useState(false);

  return (
    <TreeContext.Provider value={{ showConversationTree, setShowConversationTree }}>
      {children}
    </TreeContext.Provider>
  );
}
