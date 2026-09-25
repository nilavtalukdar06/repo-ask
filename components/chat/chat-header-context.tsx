"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ClearChatHandler = () => void | Promise<void>;

type ChatHeaderContextValue = {
  isChatActive: boolean;
  registerClearHandler: (handler: ClearChatHandler) => () => void;
  clearChat: () => void | Promise<void>;
};

const ChatHeaderContext = createContext<ChatHeaderContextValue | null>(null);

export function ChatHeaderProvider({ children }: { children: ReactNode }) {
  const handlerRef = useRef<ClearChatHandler | null>(null);
  const [isChatActive, setIsChatActive] = useState(false);

  const registerClearHandler = useCallback((handler: ClearChatHandler) => {
    handlerRef.current = handler;
    setIsChatActive(true);
    return () => {
      if (handlerRef.current === handler) {
        handlerRef.current = null;
        setIsChatActive(false);
      }
    };
  }, []);

  const clearChat = useCallback(() => handlerRef.current?.(), []);

  return (
    <ChatHeaderContext.Provider
      value={{ isChatActive, registerClearHandler, clearChat }}
    >
      {children}
    </ChatHeaderContext.Provider>
  );
}

export function useChatHeaderContext() {
  const ctx = useContext(ChatHeaderContext);
  if (!ctx) {
    throw new Error(
      "useChatHeaderContext must be used within a ChatHeaderProvider",
    );
  }
  return ctx;
}
