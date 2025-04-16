"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Message } from "ai";
import { useChat } from "ai/react";
import { useEffect, useMemo, useRef, useState, useCallback, type ChangeEvent, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { LoadingIcon, SendIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/ui/markdown";

export default function Chat() {
  const [toolCall, setToolCall] = useState<string>();
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      maxSteps: 4,
      onToolCall({ toolCall }) {
        setToolCall(toolCall.toolName);
      },
      onError: (error) => {
        toast.error("Você atingiu o limite de requisições, tente novamente mais tarde!");
      },
    });

  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [buttonPosition, setButtonPosition] = useState({ top: 11 });

  const autoResizeTextarea = useCallback((e: ChangeEvent<HTMLTextAreaElement> | { target: HTMLTextAreaElement | null }) => {
    const target = e.target;
    if (!target) return;
    
    target.style.height = "auto";
    target.style.height = `${target.scrollHeight}px`;
    
    const cursorPosition = target.selectionStart;
    const textUpToCursor = target.value.substring(0, cursorPosition || 0);
    const lineBreaksBeforeCursor = (textUpToCursor.match(/\n/g) || []).length;
    
    // Calculate button position based on cursor position
    const lineHeight = 21; // Approximate line height in pixels
    const paddingTop = 12; // Equal to py-3 (12px)
    
    const topPosition = paddingTop + lineBreaksBeforeCursor * lineHeight;
    setButtonPosition({ top: topPosition });
  }, []);

  // Handler customizado para input que aciona o redimensionamento
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleInputChange(e);
    
    // Ajustar altura do textarea
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Reset height para calcular corretamente
    textarea.style.height = 'auto';
    
    // Limitar a altura máxima (5 linhas aproximadamente)
    const maxHeight = 125; // Aproximadamente 5 linhas
    
    // Definir a altura com base no conteúdo, limitada pelo maxHeight
    if (textarea.scrollHeight <= maxHeight) {
      textarea.style.height = `${textarea.scrollHeight}px`;
      textarea.style.overflowY = 'hidden';
    } else {
      textarea.style.height = `${maxHeight}px`;
      textarea.style.overflowY = 'auto';
    }
  }, [handleInputChange]);

  // Quando o componente montar, ajustar a altura inicial do textarea
  useEffect(() => {
    if (textareaRef.current) {
      // Definir altura inicial mínima
      textareaRef.current.style.height = '40px';
      
      // Se já houver conteúdo, ajustar a altura
      if (input) {
        const textarea = textareaRef.current;
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 125)}px`;
      }
    }
  }, [input]);

  useEffect(() => {
    if (messages.length > 0) setIsExpanded(true);
  }, [messages]);

  // Limpar o toolCall quando uma nova mensagem do assistente for recebida
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant') {
      setToolCall(undefined);
    }
  }, [messages]);

  // Scroll para o final quando novas mensagens são adicionadas
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const currentToolCall = useMemo(() => {
    // Se não estiver carregando, não mostramos nenhum toolCall
    if (!isLoading) return undefined;
    
    const tools = messages?.slice(-1)[0]?.toolInvocations;
    if (tools && toolCall === tools[0].toolName) {
      return tools[0].toolName;
    }
    return undefined;
  }, [toolCall, messages, isLoading]);

  const awaitingResponse = useMemo(() => {
    // Se não estiver carregando, não estamos aguardando resposta
    if (!isLoading) return false;
    
    // Se a última mensagem foi do usuário e não temos um toolCall atual,
    // então estamos aguardando a resposta inicial
    if (currentToolCall === undefined && 
        messages.length > 0 && 
        messages[messages.length - 1].role === "user") {
      return true;
    }
    return false;
  }, [isLoading, currentToolCall, messages]);

  return (
    <div className="flex flex-col justify-between min-h-[calc(100vh-3.5rem)] w-full dark:bg-neutral-900">
      <div className="flex justify-center items-start w-full flex-grow">
        <div className="flex flex-col items-center w-full max-w-[700px] px-4 py-4">
          
          <motion.div
            animate={{
              minHeight: isExpanded ? 400 : 0,
            }}
            transition={{
              type: "spring",
              bounce: 0.5,
            }}
            className={cn(
              "rounded-lg w-full mb-4 overflow-y-auto p-4",
              isExpanded ? "block" : "hidden"
            )}
            style={{ maxHeight: "calc(100vh - 240px)" }}
          >
            {messages.length > 0 ? (
              <div className="flex flex-col gap-6">
                {messages.map((message, index) => (
                  <div 
                    key={message.id}
                    className={cn(
                      "flex flex-col",
                      message.role === "user" ? "items-end" : "items-start"
                    )}
                  >
                    <div 
                      className={cn(
                        "rounded-lg py-2 px-3 max-w-[85%]",
                        message.role === "user" 
                          ? "bg-blue-500 text-white" 
                          : "bg-neutral-300 dark:bg-neutral-700"
                      )}
                    >
                      {message.role === "user" ? (
                        <div className="text-sm">{message.content}</div>
                      ) : (
                        <AssistantMessage message={message} />
                      )}
                    </div>
                  </div>
                ))}
                
                {(awaitingResponse || currentToolCall) && (
                  <div className="flex items-start">
                    <div className="rounded-lg py-2 px-3 bg-neutral-300 dark:bg-neutral-700">
                      <Loading tool={currentToolCall} />
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="text-center text-neutral-500 dark:text-neutral-400 py-8">
                Inicie uma conversa fazendo uma pergunta.
              </div>
            )}
          </motion.div>
        </div>
      </div>
      
      {/* Barra de entrada fixa na parte inferior */}
      <div className="sticky bottom-0 w-full bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 py-4">
        <div className="max-w-[700px] mx-auto px-4">
          <form onSubmit={handleSubmit} className="flex items-center space-x-2 relative">
            <div className="flex-1 bg-neutral-100 dark:bg-neutral-700 flex items-start pr-12 pl-3 py-2 relative rounded-2xl">
              <Textarea
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim() && !isLoading) {
                      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
                      
                      // Reset altura após enviar mensagem
                      if (textareaRef.current) {
                        textareaRef.current.style.height = '40px';
                      }
                    }
                  }
                }}
                placeholder="Responder ao consultor..."
                className="flex-1 outline-none bg-transparent resize-none min-h-[40px] max-h-[125px] border-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 py-1 dark:placeholder:text-neutral-400 dark:text-neutral-300 text-base md:text-lg"
                ref={textareaRef}
                rows={1}
                minLength={3}
                required
                style={{ height: '40px', overflowY: 'hidden', fontSize: '16px' }}
              />
              <div className="absolute right-1 bottom-1 p-1">
                <Button 
                  type="submit" 
                  className="p-2 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center"
                  disabled={!input.trim() || isLoading}
                  ref={buttonRef}
                >
                  <SendIcon size={20} />
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
      
      <style jsx global>{`
        textarea {
          scrollbar-width: thin;
          scrollbar-color: rgba(203, 213, 224, 0.6) transparent;
        }
        
        textarea::-webkit-scrollbar {
          width: 6px;
        }
        
        textarea::-webkit-scrollbar-thumb {
          background-color: rgba(203, 213, 224, 0.6);
          border-radius: 3px;
        }
        
        .dark textarea {
          scrollbar-color: rgba(75, 85, 99, 0.6) transparent;
        }
        
        .dark textarea::-webkit-scrollbar-thumb {
          background-color: rgba(75, 85, 99, 0.6);
        }
      `}</style>
    </div>
  );
}

const AssistantMessage = ({ message }: { message: Message }) => {
  if (message === undefined) return null;

  return (
    <div
      className="text-sm text-neutral-800 dark:text-neutral-200 overflow-hidden"
      id="markdown"
    >
      <Markdown>
        {message.content}
      </Markdown>
    </div>
  );
};

const Loading = ({ tool }: { tool?: string }) => {
  return (
    <div className="flex flex-row gap-2 items-center">
      <div className="animate-spin dark:text-neutral-400 text-neutral-500">
        <LoadingIcon />
      </div>
      <div className="text-neutral-500 dark:text-neutral-400 text-sm">
        Pensando...
      </div>
    </div>
  );
};
