// ChatContext.tsx
import React, { createContext, useContext, useState } from 'react';

// 创建一个上下文
const ChatContext = createContext<any>(null);

// 提供者组件
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customVar1, setCustomVar1] = useState(1);

  const handleToggleVariable = () => {
    setCustomVar1((prev) => (prev === 1 ? 2 : 1));
  };

  return (
    <ChatContext.Provider value={{ customVar1, handleToggleVariable }}>
      {children}
    </ChatContext.Provider>
  );
};

// 自定义 hook 获取上下文
export const useChatContext = () => {
  return useContext(ChatContext);
};
