import React, { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User, Trash2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface Message {
  role: "user" | "bot";
  text: string;
}

interface ConversationRecord {
  query: string;
  response: string;
  timestamp: number;
}

interface ChatBotProps {
  onClose: () => void;
}

const CHAT_ENDPOINT =
  import.meta.env.VITE_CHAT_ENDPOINT ||
  (import.meta.env.DEV ? "http://localhost:5000/chat" : "/chat");

export const ChatBot: React.FC<ChatBotProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationRecord[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const STORAGE_KEY = user?.id ? `chatbot_history_${user.id}` : "chatbot_history_guest";

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setConversationHistory(JSON.parse(saved));
  }, [STORAGE_KEY]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveToHistory = (query: string, response: string) => {
    const newRecord: ConversationRecord = {
      query,
      response,
      timestamp: Date.now()
    };
    const updated = [newRecord, ...conversationHistory].slice(0, 20);
    setConversationHistory(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const clearHistory = () => {
    if (confirm("Clear all search history?")) {
      setConversationHistory([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const loadHistoryItem = (record: ConversationRecord) => {
    setMessages([
      { role: "user", text: record.query },
      { role: "bot", text: record.response }
    ]);
    setShowHistory(false);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userText = input;
    setInput("");

    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setLoading(true);

    try {
      const res = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userText }),
      });

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
      saveToHistory(userText, data.reply);
    } catch (err) {
      const errorMsg = "AI server not reachable.";
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: errorMsg },
      ]);
      saveToHistory(userText, errorMsg);
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl max-w-2xl w-full h-[600px] flex flex-col shadow-2xl border border-white/10">
        
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">AI Assistant</h2>
              <p className="text-xs text-white/50">Ask me anything</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition"
              title="Search history"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {showHistory && conversationHistory.length > 0 ? (
          <div className="flex-1 overflow-y-auto p-6 border-b border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-white">Recent Searches</h3>
              <button
                onClick={clearHistory}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition"
              >
                <Trash2 className="h-3 w-3" />
                Clear
              </button>
            </div>
            <div className="space-y-2">
              {conversationHistory.map((record, idx) => (
                <button
                  key={idx}
                  onClick={() => loadHistoryItem(record)}
                  className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white/80 transition border border-white/10 hover:border-white/20"
                >
                  <p className="font-medium text-white truncate">{record.query}</p>
                  <p className="text-xs text-white/50 truncate mt-1">{record.response}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-white/50 mt-8">
                Start chatting with AI
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}
              >
                {m.role === "bot" && (
                  <div className="h-8 w-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                )}

                <div
                  className={`px-4 py-3 rounded-2xl max-w-[70%] ${
                    m.role === "user" 
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg" 
                      : "bg-white/10 text-white border border-white/20"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {m.text}
                  </p>
                </div>

                {m.role === "user" && (
                  <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <User className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="text-sm text-white/50 italic">AI typing...</div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {!showHistory && (
          <div className="p-6 border-t border-white/10">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything..."
                className="flex-1 px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-white placeholder-white/40 transition"
              />
              <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition">
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};