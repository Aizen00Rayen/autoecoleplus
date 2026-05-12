import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import '../components/style/theme.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const ChatBot = () => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Welcome message on open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: Date.now().toString(),
        role: 'assistant',
        content: language === 'ar'
          ? 'مرحباً! أنا مساعدك الذكي لتعلم قواعد السياقة وعلامات المرور. كيف يمكنني مساعدتك اليوم؟'
          : language === 'fr'
          ? "Bonjour! Je suis votre assistant intelligent pour apprendre les règles de conduite et les panneaux routiers. Comment puis-je vous aider aujourd'hui?"
          : "Hello! I'm your smart assistant for learning driving rules and traffic signs. How can I help you today?",
        timestamp: new Date(),
      }]);
    }
  }, [isOpen, language]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < 3000) {
      const waitTime = Math.ceil((3000 - timeSinceLastRequest) / 1000);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: language === 'ar'
          ? `⏳ يرجى الانتظار ${waitTime} ثانية قبل إرسال سؤال آخر.`
          : language === 'fr'
          ? `⏳ Veuillez attendre ${waitTime} seconde(s) avant d'envoyer une autre question.`
          : `⏳ Please wait ${waitTime} second(s) before sending another question.`,
        timestamp: new Date(),
      }]);
      return;
    }

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setLastRequestTime(now);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.2-3b-instruct:free',
          messages: [
            {
              role: 'system',
              content: language === 'ar'
                ? 'أنت مساعد ذكي متخصص في تعليم قواعد السياقة وعلامات المرور في الجزائر. قدم إجابات واضحة ومفيدة باللغة العربية. ركز على السلامة المرورية والقوانين الجزائرية.'
                : language === 'fr'
                ? "Vous êtes un assistant intelligent spécialisé dans l'enseignement des règles de conduite et des panneaux routiers en Algérie. Fournissez des réponses claires et utiles en français. Concentrez-vous sur la sécurité routière et les lois algériennes."
                : 'You are a smart assistant specialized in teaching driving rules and traffic signs in Algeria. Provide clear and helpful answers in English. Focus on road safety and Algerian laws.',
            },
            ...messages.map(msg => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: input },
          ],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) throw new Error('RATE_LIMIT');
        if (response.status === 401) throw new Error('AUTH_ERROR');
        throw new Error('API_ERROR');
      }

      const data = await response.json();
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.choices[0].message.content,
        timestamp: new Date(),
      }]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      let errorContent = '';
      if (error.message === 'RATE_LIMIT') {
        errorContent = language === 'ar'
          ? '⚠️ عذراً، تم تجاوز الحد المسموح من الطلبات. يرجى الانتظار قليلاً والمحاولة مرة أخرى بعد دقيقة.'
          : language === 'fr'
          ? '⚠️ Désolé, limite de requêtes dépassée. Veuillez attendre un moment et réessayer dans une minute.'
          : '⚠️ Sorry, rate limit exceeded. Please wait a moment and try again in a minute.';
      } else if (error.message === 'AUTH_ERROR') {
        errorContent = language === 'ar'
          ? '🔒 خطأ في المصادقة. يرجى التواصل مع الإدارة.'
          : language === 'fr'
          ? "🔒 Erreur d'authentification. Veuillez contacter l'administration."
          : '🔒 Authentication error. Please contact administration.';
      } else {
        errorContent = language === 'ar'
          ? '❌ عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.'
          : language === 'fr'
          ? '❌ Désolé, erreur de connexion. Veuillez réessayer.'
          : '❌ Sorry, connection error. Please try again.';
      }
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: errorContent, timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 'var(--z-modal)' as any,
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--grad-gold)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--shadow-gold)',
          color: '#000',
          transition: 'all var(--duration-normal) var(--ease)',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: '5.5rem', right: '2rem',
          zIndex: 'var(--z-modal)' as any,
          width: 380, maxWidth: 'calc(100vw - 2rem)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-gold)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease',
        }}>
          {/* Header */}
          <div style={{
            padding: '1rem 1.25rem',
            background: 'linear-gradient(135deg, var(--bg-mid) 0%, var(--bg-card) 100%)',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'var(--grad-gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#000', flexShrink: 0,
              }}>
                <Bot size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-white)' }}>
                  {language === 'ar' ? 'المساعد الذكي' : language === 'fr' ? 'Assistant Intelligent' : 'Smart Assistant'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 500 }}>
                  {language === 'ar' ? 'متصل' : language === 'fr' ? 'En ligne' : 'Online'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-secondary)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(245,166,35,0.12)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
              }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Messages */}
          <div style={{
            height: 360, overflowY: 'auto', padding: '1rem',
            background: 'var(--bg-darkest)',
            display: 'flex', flexDirection: 'column', gap: '0.75rem',
          }}>
            {messages.map(message => {
              const isUser = message.role === 'user';
              return (
                <div
                  key={message.id}
                  style={{
                    display: 'flex', gap: '0.5rem',
                    flexDirection: isUser ? 'row-reverse' : 'row',
                    alignItems: 'flex-end',
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: isUser ? 'var(--grad-gold)' : 'rgba(245,166,35,0.15)',
                    border: isUser ? 'none' : '1px solid var(--border-gold)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isUser ? '#000' : 'var(--primary)',
                  }}>
                    {isUser ? <User size={13} /> : <Bot size={13} />}
                  </div>

                  {/* Bubble */}
                  <div style={{
                    maxWidth: '78%',
                    padding: '0.625rem 0.875rem',
                    borderRadius: isUser ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                    background: isUser ? 'var(--grad-gold)' : 'var(--bg-card)',
                    border: isUser ? 'none' : '1px solid var(--border)',
                    color: isUser ? '#000' : 'var(--text-primary)',
                    fontSize: '0.875rem', lineHeight: 1.55,
                    wordBreak: 'break-word',
                    boxShadow: isUser ? 'var(--shadow-gold)' : 'var(--shadow-sm)',
                  }}>
                    <p style={{ margin: 0 }}>{message.content}</p>
                    <p style={{ margin: 0, marginTop: '0.3rem', fontSize: '0.6875rem', opacity: 0.65, textAlign: 'right' }}>
                      {message.timestamp.toLocaleTimeString(
                        language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US',
                        { hour: '2-digit', minute: '2-digit' }
                      )}
                    </p>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(245,166,35,0.15)', border: '1px solid var(--border-gold)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)',
                }}>
                  <Bot size={13} />
                </div>
                <div style={{
                  padding: '0.625rem 0.875rem',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: '1rem 1rem 1rem 0.25rem',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  color: 'var(--text-muted)', fontSize: '0.875rem',
                }}>
                  <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                  {language === 'ar' ? 'جاري الكتابة...' : language === 'fr' ? "En train d'écrire..." : 'Typing...'}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '0.875rem 1rem',
            background: 'var(--bg-dark)',
            borderTop: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  language === 'ar' ? 'اكتب سؤالك هنا...'
                  : language === 'fr' ? 'Tapez votre question ici...'
                  : 'Type your question here...'
                }
                disabled={isLoading}
                className="input-pro"
                style={{ flex: 1, borderRadius: 'var(--radius-full)', padding: '10px 14px', fontSize: '0.875rem' }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                style={{
                  width: 40, height: 40, flexShrink: 0,
                  background: 'var(--grad-gold)', border: 'none', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: !input.trim() || isLoading ? 'not-allowed' : 'pointer',
                  opacity: !input.trim() || isLoading ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                  boxShadow: 'var(--shadow-gold)', color: '#000',
                }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
