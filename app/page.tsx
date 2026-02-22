'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SendHorizontal, Loader2, Wrench } from 'lucide-react';

export default function Home() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status } = useChat({
    // @ts-ignore
    maxSteps: 5,
  } as any);

  const isLoading = status !== 'ready';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input?.trim()) return;
    sendMessage({ role: 'user', parts: [{ type: 'text', text: input }] });
    setInput('');
  };

  return (
    <div className="flex flex-col h-screen max-w-5xl mx-auto p-4 md:p-8 bg-zinc-50 dark:bg-zinc-950">
      <Card className="flex flex-col flex-grow shadow-lg border-zinc-200 dark:border-zinc-800 h-full overflow-hidden">
        <CardHeader className="bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-zinc-50 py-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">HVAC Margin Rescue</CardTitle>
              <CardDescription className="text-zinc-400">Autonomous Portfolio Analyst Agent</CardDescription>
            </div>
            <Badge variant="outline" className="bg-zinc-800 text-zinc-300 border-zinc-700">
              Granola Protocol Mode 🟢
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col flex-grow p-0 overflow-hidden bg-white dark:bg-zinc-950">
          <ScrollArea className="flex-1 p-4 md:p-6 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20">
                <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-full">
                  <Wrench className="w-8 h-8 text-zinc-500" />
                </div>
                <h2 className="text-2xl font-semibold text-zinc-700 dark:text-zinc-300">Ready to Analyze your HVAC Portfolio</h2>
                <p className="max-w-md text-zinc-500">
                  I act as your autonomous financial analyst. Ask me: <br />
                  <span className="inline-block mt-2 italic font-medium bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-md text-zinc-600 dark:text-zinc-400">
                    "How's my portfolio doing?"
                  </span>
                </p>
              </div>
            ) : (
              <div className="space-y-6 pb-4">
                {messages.map((message: any) => (
                  <div
                    key={message.id}
                    className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'
                      }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm ${message.role === 'user'
                        ? 'bg-zinc-900 text-zinc-50 rounded-br-none'
                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-bl-none'
                        }`}
                    >
                      {message.content && (
                        <div className="prose dark:prose-invert prose-sm max-w-none break-words whitespace-pre-wrap">
                          {message.content}
                        </div>
                      )}

                      {message.toolInvocations?.map((toolInvocation: any) => {
                        const { toolName, toolCallId, state } = toolInvocation;
                        if (state === 'result') {
                          return (
                            <div key={toolCallId} className="mt-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg border border-zinc-200/50 dark:border-zinc-800 text-xs">
                              <div className="flex items-center gap-2 font-semibold text-emerald-600 dark:text-emerald-400 mb-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Action Completed: {toolName}
                              </div>
                              <div className="text-zinc-500 dark:text-zinc-400 line-clamp-2 italic">
                                {JSON.stringify(toolInvocation.result).substring(0, 150)}...
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div key={toolCallId} className="mt-3 p-3 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs">
                              <div className="flex items-center gap-2 font-medium text-amber-600 dark:text-amber-400">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Agent Deciding: Calling <span className="font-mono">{toolName}</span>...
                              </div>
                            </div>
                          );
                        }
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex items-start mt-4">
                <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 rounded-2xl rounded-bl-none px-5 py-3.5 shadow-sm flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
                  <span className="text-sm font-medium">Analyzing portfolio...</span>
                </div>
              </div>
            )}
          </ScrollArea>

          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <form onSubmit={handleSubmit} className="relative flex items-center w-full">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask about your HVAC portfolio..."
                className="pr-14 py-6 rounded-xl border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 shadow-sm transition-all"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input?.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm transition-all disabled:opacity-50"
              >
                <SendHorizontal className="w-5 h-5" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
