import React, { useState, useRef, useEffect } from 'react'
import {
  Sparkles,
  Bot,
  Send,
  X,
  Minimize2,
  Maximize2,
  HelpCircle,
  BookOpen,
  Code2,
  Compass,
  Lightbulb,
  Trash2,
  Loader2,
  MessageSquare
} from 'lucide-react'
import { useGeneralChat, type ChatMessageItem } from '../../api/useAiStudyApi'

const QUICK_PROMPTS = [
  'Explain Dijkstra vs A* algorithm',
  'What is dynamic programming with an example?',
  'Explain ACID properties in DBMS',
  'How does Transformers & Attention work in AI?',
  'Derive Bayes theorem with intuition'
]

export function GlobalAiChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      sender: 'assistant',
      text: "👋 Hi! I'm your **NoteVault AI Study Companion** powered by Gemini API.\n\nYou can ask me **anything or any topic** — concepts, code explanations, math formulas, exam summaries, or question practice!"
    }
  ])
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatMutation = useGeneralChat()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen])

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend ?? inputText).trim()
    if (!text || chatMutation.isPending) return

    const userMsg: ChatMessageItem = { sender: 'user', text }
    const nextHistory = [...messages, userMsg]
    setMessages(nextHistory)
    setInputText('')

    try {
      const res = await chatMutation.mutateAsync({
        message: text,
        history: nextHistory.map((m) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          sender: m.sender,
          text: m.text,
          content: m.text
        }))
      })

      if (res && res.reply) {
        setMessages((prev) => [
          ...prev,
          { sender: 'assistant', text: res.reply }
        ])
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: "⚠️ Sorry, I couldn't reach the AI tutor right now. Please verify your backend server and GEMINI_API_KEY."
        }
      ])
    }
  }

  const handleClearChat = () => {
    setMessages([
      {
        sender: 'assistant',
        text: "Chat cleared! Ask me anything about any subject, concept, or exam problem."
      }
    ])
  }

  return (
    <>
      {/* Floating launcher button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-violet-600 via-indigo-600 to-brand-600 hover:from-violet-700 hover:to-brand-700 text-white rounded-full shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all font-medium text-sm group border border-white/20"
          aria-label="Open AI Chatbot"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
          </span>
          <Sparkles className="w-4 h-4 text-amber-200 group-hover:rotate-12 transition-transform" />
          <span className="font-semibold tracking-wide">Ask AI Anything</span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div
          className={`fixed z-50 bottom-4 right-4 sm:bottom-6 sm:right-6 bg-white rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden transition-all duration-200 ${
            isExpanded
              ? 'w-[95vw] sm:w-[680px] h-[85vh] max-h-[800px]'
              : 'w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-700 via-indigo-700 to-brand-700 text-white px-4 py-3.5 flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold tracking-tight text-white leading-none">
                    NoteVault AI Tutor
                  </h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 font-mono">
                    Free Gemini API
                  </span>
                </div>
                <p className="text-[11px] text-indigo-100/80 leading-none mt-1">
                  Ask any topic, concept, math or code
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-white/80">
              <button
                onClick={handleClearChat}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Clear conversation"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors hidden sm:block"
                title={isExpanded ? 'Normal size' : 'Expand window'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick prompt suggestions */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap flex items-center gap-1 shrink-0">
              <Lightbulb className="w-3 h-3 text-amber-500" /> Suggestions:
            </span>
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={chatMutation.isPending}
                className="text-[11px] px-2.5 py-1 bg-white border border-slate-200 rounded-full text-slate-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/50 whitespace-nowrap transition-colors shadow-2xs shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages list */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
            {messages.map((msg, idx) => {
              const isUser = msg.sender === 'user'
              return (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm font-medium'
                        : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              )
            })}

            {chatMutation.isPending && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2 text-slate-500 text-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span>Thinking & researching topic...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              placeholder="Ask anything (e.g. quantum physics, binary search, history)..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={chatMutation.isPending}
              className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || chatMutation.isPending}
              className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 transition-colors shadow-sm shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
