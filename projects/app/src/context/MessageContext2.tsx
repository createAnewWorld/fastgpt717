import { createContext, useContext, useState, Dispatch, SetStateAction, useEffect } from 'react';

// 1. 首先定义消息对象的类型
type MessageObject = {
  deep: number;
  selectedValue: string;
  sikao: number;

  selectedValue2: string;
  selectedValue3: string;
};

// 2. 定义Context类型
type MessageContextType = {
  message: MessageObject;
  setMessage: Dispatch<SetStateAction<MessageObject>>;
};

// 3. 创建Context时指定类型
const MessageContext = createContext<MessageContextType | undefined>(undefined);

// 4. 创建Provider组件
// 何时被触发
export const MessageProvider = ({ children }: { children: React.ReactNode }) => {
  const [message, setMessage] = useState<MessageObject>({
    deep: 0,
    sikao: 0,
    selectedValue: '111111',
    selectedValue2: '666',
    selectedValue3: '1234'
  });

  return (
    <MessageContext.Provider value={{ message, setMessage }}>{children}</MessageContext.Provider>
  );
};

// 5. 创建自定义Hook
export const useMessageContext = () => {
  // 组件能够访问到在组件树中上层通过 Context.Provider 提供的值，而无需通过 props 逐层传递。
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessageContext must be used within a MessageProvider');
  }
  return context;
};
