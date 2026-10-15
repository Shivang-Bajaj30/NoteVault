import { useState } from 'react'
import type { Note } from '../../lib/auth'
import { Card, Button, Badge } from '../../components/ui'
import {
  Sparkles,
  Bot,
  Send,
  RefreshCw,
  BookOpen,
  Layers,
  HelpCircle,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Clock,
  GraduationCap
} from 'lucide-react'
import {
  useNoteChat,
  useStudyAnalysis,
  useStudyQuiz,
  useStudyFlashcards,
  type ChatMessageItem,
  type QuizQuestionItem
} from '../../api/useAiStudyApi'

export interface AISummaryCardProps {
  note: Note
}

type TabType = 'chat' | 'analysis' | 'quiz' | 'flashcards'

export function AISummaryCard({ note }: AISummaryCardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('chat')
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      sender: 'assistant',
      text: `Hello! I'm your AI Study Tutor for "${note.title}". You can ask me to explain key ideas, test your recall, or clarify tricky points!`
    }
  ])
  const [inputText, setInputText] = useState('')
  const chatMutation = useNoteChat(note.id)

  // Study generation state
  const { data: analysis, isLoading: loadingAnalysis, refetch: refetchAnalysis } = useStudyAnalysis(note.id, true)
  const { data: quiz, isLoading: loadingQuiz, refetch: refetchQuiz } = useStudyQuiz(note.id, activeTab === 'quiz')
  const { data: flashcards, isLoading: loadingFlashcards, refetch: refetchFlashcards } = useStudyFlashcards(note.id, activeTab === 'flashcards')

  // Quiz interactive state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({})
  
  // Flashcard state
  const [cardIndex, setCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim()
    if (!text || chatMutation.isPending) return

    const userMsg: ChatMessageItem = { sender: 'user', text }
    const nextHistory = [...messages, userMsg]
    setMessages(nextHistory)
    if (!textToSend) setInputText('')

    try {
      const res = await chatMutation.mutateAsync({
        message: text,
        history: nextHistory
      })
      setMessages([...nextHistory, { sender: 'assistant', text: res.reply }])
    } catch {
      setMessages([
        ...nextHistory,
        {
          sender: 'assistant',
          text: 'I could not process that request right now. Please check the backend connection and try again.'
        }
      ])
    }
  }

  const promptStarters = [
    'Summarize this note in 3 bullet points',
    'Explain the most challenging concept simply',
    'What are common exam questions on this topic?',
    'Give me a real-world analogy'
  ]

  // Calculate quiz score
  const answeredCount = Object.keys(selectedAnswers).length
  const correctCount = (quiz || []).reduce((acc, q) => {
    return selectedAnswers[q.id] === q.correctIndex ? acc + 1 : acc
  }, 0)

  return (
    <Card className="p-5 border-brand-200/90 bg-white dark:bg-stone-900 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              AI Study Assistant
            </h3>
            <span className="text-[10px] text-stone-400">Python AI Study Engine</span>
          </div>
        </div>
        <Badge tone="accent" size="sm">Active</Badge>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-stone-100 dark:bg-stone-800/60 rounded-lg mb-4 text-xs font-medium">
        <button
          onClick={() => setActiveTab('chat')}
          className={`py-1.5 px-2 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'chat'
              ? 'bg-white dark:bg-stone-900 text-brand-700 dark:text-brand-300 shadow-xs font-semibold'
              : 'text-stone-500 hover:text-stone-900 dark:text-stone-400'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Chat</span>
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={`py-1.5 px-2 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'analysis'
              ? 'bg-white dark:bg-stone-900 text-brand-700 dark:text-brand-300 shadow-xs font-semibold'
              : 'text-stone-500 hover:text-stone-900 dark:text-stone-400'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Summary</span>
        </button>
        <button
          onClick={() => setActiveTab('quiz')}
          className={`py-1.5 px-2 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'quiz'
              ? 'bg-white dark:bg-stone-900 text-brand-700 dark:text-brand-300 shadow-xs font-semibold'
              : 'text-stone-500 hover:text-stone-900 dark:text-stone-400'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Quiz</span>
        </button>
        <button
          onClick={() => setActiveTab('flashcards')}
          className={`py-1.5 px-2 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'flashcards'
              ? 'bg-white dark:bg-stone-900 text-brand-700 dark:text-brand-300 shadow-xs font-semibold'
              : 'text-stone-500 hover:text-stone-900 dark:text-stone-400'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Cards</span>
        </button>
      </div>

      {/* Tab 1: Interactive Chatbot */}
      {activeTab === 'chat' && (
        <div className="flex flex-col h-[380px]">
          {/* Messages scroll area */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`p-2.5 rounded-xl max-w-[85%] leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-brand-600 text-white rounded-br-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex gap-2 items-center text-stone-400 text-xs italic">
                <Bot className="w-3.5 h-3.5 animate-spin text-brand-500" />
                <span>AI Tutor is thinking...</span>
              </div>
            )}
          </div>

          {/* Quick prompt suggestions */}
          <div className="flex flex-wrap gap-1.5 my-2.5 pt-2 border-t border-stone-100 dark:border-stone-800">
            {promptStarters.map((starter) => (
              <button
                key={starter}
                onClick={() => handleSendMessage(starter)}
                disabled={chatMutation.isPending}
                className="text-[11px] px-2 py-1 bg-stone-50 dark:bg-stone-800/80 hover:bg-brand-50 dark:hover:bg-brand-950/60 text-stone-600 dark:text-stone-300 hover:text-brand-700 border border-stone-200/60 dark:border-stone-700 rounded-md transition-colors text-left"
              >
                {starter}
              </button>
            ))}
          </div>

          {/* Message input */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="flex items-center gap-1.5"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask anything about this document..."
              className="flex-1 text-xs px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <Button
              type="submit"
              size="sm"
              variant="primary"
              disabled={!inputText.trim() || chatMutation.isPending}
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        </div>
      )}

      {/* Tab 2: Study Breakdown & Analysis */}
      {activeTab === 'analysis' && (
        <div className="h-[380px] overflow-y-auto pr-1 text-xs space-y-3.5">
          {loadingAnalysis ? (
            <div className="py-12 text-center text-stone-400 space-y-2">
              <RefreshCw className="w-5 h-5 mx-auto animate-spin text-brand-500" />
              <p>Analyzing document content...</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-[11px] text-stone-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-brand-500" />
                  {analysis?.estimatedStudyTime || '20-25 mins study'}
                </span>
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3 h-3 text-brand-500" />
                  {analysis?.difficulty || 'Intermediate'}
                </span>
                <button
                  onClick={() => refetchAnalysis()}
                  className="text-brand-600 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-stone-900 dark:text-stone-100 mb-1.5">
                  Executive Summary
                </h4>
                <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-[11px] bg-stone-50 dark:bg-stone-800/50 p-2.5 rounded-lg border border-stone-100 dark:border-stone-800">
                  {analysis?.summary || note.description || 'No summary available.'}
                </p>
              </div>

              {analysis?.keyConcepts && analysis.keyConcepts.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-stone-900 dark:text-stone-100 mb-2">
                    Key Concepts to Master
                  </h4>
                  <ul className="space-y-1.5">
                    {analysis.keyConcepts.map((concept, i) => (
                      <li
                        key={i}
                        className="text-[11px] text-stone-600 dark:text-stone-300 flex items-start gap-2 bg-brand-50/50 dark:bg-brand-950/20 p-2 rounded-md border border-brand-100/50 dark:border-brand-900/30"
                      >
                        <span className="w-4 h-4 rounded-full bg-brand-200 dark:bg-brand-800 text-brand-800 dark:text-brand-200 text-[10px] flex items-center justify-center shrink-0 font-bold mt-0.5">
                          {i + 1}
                        </span>
                        <span>{concept}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis?.studyOutline && analysis.studyOutline.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-stone-900 dark:text-stone-100 mb-2">
                    Recommended Study Outline
                  </h4>
                  <div className="space-y-2">
                    {analysis.studyOutline.map((section, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-700/60"
                      >
                        <p className="font-semibold text-stone-800 dark:text-stone-200 text-[11px] mb-1">
                          {section.title}
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-[11px] text-stone-500 dark:text-stone-400">
                          {section.points.map((pt, pIdx) => (
                            <li key={pIdx}>{pt}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab 3: Interactive Practice Quiz */}
      {activeTab === 'quiz' && (
        <div className="h-[380px] overflow-y-auto pr-1 text-xs space-y-4">
          {loadingQuiz ? (
            <div className="py-12 text-center text-stone-400 space-y-2">
              <RefreshCw className="w-5 h-5 mx-auto animate-spin text-brand-500" />
              <p>Generating practice questions...</p>
            </div>
          ) : !quiz || quiz.length === 0 ? (
            <div className="py-12 text-center text-stone-500">
              <p>No quiz questions available for this note.</p>
              <Button size="sm" variant="outline" onClick={() => refetchQuiz()} className="mt-3">
                Generate Quiz
              </Button>
            </div>
          ) : (
            <>
              {/* Score bar */}
              <div className="flex items-center justify-between p-2.5 bg-stone-50 dark:bg-stone-800 rounded-lg text-xs font-medium">
                <span>
                  Answered: {answeredCount}/{quiz.length}
                </span>
                <span className="font-bold text-brand-600 dark:text-brand-400">
                  Score: {correctCount}/{answeredCount}
                </span>
                <button
                  onClick={() => {
                    setSelectedAnswers({})
                    refetchQuiz()
                  }}
                  className="text-stone-500 hover:text-stone-900 flex items-center gap-1 text-[11px]"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>

              {/* Questions list */}
              {quiz.map((q: QuizQuestionItem, qIdx: number) => {
                const userChoice = selectedAnswers[q.id]
                const isAnswered = userChoice !== undefined
                const isCorrect = userChoice === q.correctIndex

                return (
                  <div
                    key={q.id}
                    className="p-3 rounded-lg border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-2.5"
                  >
                    <p className="font-semibold text-stone-900 dark:text-stone-100 text-xs">
                      {qIdx + 1}. {q.question}
                    </p>

                    <div className="space-y-1.5">
                      {q.options.map((opt, optIdx) => {
                        let btnStyle = 'bg-stone-50 hover:bg-stone-100 dark:bg-stone-800/60 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                        if (isAnswered) {
                          if (optIdx === q.correctIndex) {
                            btnStyle = 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold'
                          } else if (optIdx === userChoice) {
                            btnStyle = 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300'
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            disabled={isAnswered}
                            onClick={() => setSelectedAnswers({ ...selectedAnswers, [q.id]: optIdx })}
                            className={`w-full text-left p-2 rounded-md text-[11px] border transition-colors flex items-center justify-between ${btnStyle}`}
                          >
                            <span>{opt}</span>
                            {isAnswered && optIdx === q.correctIndex && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            )}
                            {isAnswered && optIdx === userChoice && !isCorrect && (
                              <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            )}
                          </button>
                        )
                      })}
                    </div>

                    {isAnswered && (
                      <div className={`p-2 rounded text-[11px] leading-relaxed ${isCorrect ? 'bg-emerald-50/80 text-emerald-900' : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'}`}>
                        <span className="font-semibold">{isCorrect ? 'Correct! ' : 'Explanation: '}</span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}

      {/* Tab 4: Interactive Flashcards */}
      {activeTab === 'flashcards' && (
        <div className="h-[380px] flex flex-col justify-between">
          {loadingFlashcards ? (
            <div className="py-16 text-center text-stone-400 space-y-2">
              <RefreshCw className="w-5 h-5 mx-auto animate-spin text-brand-500" />
              <p className="text-xs">Generating study flashcards...</p>
            </div>
          ) : !flashcards || flashcards.length === 0 ? (
            <div className="py-16 text-center text-stone-500 text-xs">
              <p>No flashcards generated yet.</p>
              <Button size="sm" variant="outline" onClick={() => refetchFlashcards()} className="mt-3">
                Create Flashcards
              </Button>
            </div>
          ) : (
            <>
              {/* Card indicator */}
              <div className="flex items-center justify-between text-xs text-stone-400 pb-1">
                <span>Card {cardIndex + 1} of {flashcards.length}</span>
                <span className="text-[11px]">Click card to flip</span>
              </div>

              {/* Flashcard container */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="flex-1 my-2 p-5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer hover:border-brand-300 transition-all shadow-xs select-none"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-2">
                  {isFlipped ? 'Answer' : 'Question / Prompt'}
                </span>
                <p className="text-xs sm:text-sm font-medium text-stone-800 dark:text-stone-100 leading-relaxed max-w-sm">
                  {isFlipped ? flashcards[cardIndex]?.answer : flashcards[cardIndex]?.question}
                </p>
                <span className="mt-4 text-[10px] text-stone-400">
                  {isFlipped ? '↻ Tap to see question' : '↻ Tap to reveal answer'}
                </span>
              </div>

              {/* Navigation controls */}
              <div className="flex items-center justify-between pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={cardIndex === 0}
                  onClick={() => {
                    setIsFlipped(false)
                    setCardIndex(Math.max(0, cardIndex - 1))
                  }}
                  leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Previous
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  Flip
                </Button>

                <Button
                  size="sm"
                  variant="primary"
                  disabled={cardIndex >= flashcards.length - 1}
                  onClick={() => {
                    setIsFlipped(false)
                    setCardIndex(Math.min(flashcards.length - 1, cardIndex + 1))
                  }}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  )
}
