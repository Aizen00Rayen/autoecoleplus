import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Send, User, Loader2, X, MessageCircle } from 'lucide-react';
import { supabase } from '../supabase';
import '../components/style/theme.css';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  message: string;
  timestamp: any;
  read: boolean;
  chatType?: 'general' | 'booking';
  bookingId?: string;
  participants?: string[];
}

const ChatContent = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<any>(null);

  const otherUserId = location.state?.userId;
  const otherUserName = location.state?.userName;
  const chatType = location.state?.chatType || 'general';
  const bookingId = location.state?.bookingId;

  const isMatchingMessage = (msg: Message) => {
    const isCorrectParticipants =
      (msg.senderId === user?.uid && msg.receiverId === otherUserId) ||
      (msg.senderId === otherUserId && msg.receiverId === user?.uid);
    const isCorrectChatType = msg.chatType === chatType;
    const isCorrectBooking = chatType === 'booking' ? msg.bookingId === bookingId : true;
    return isCorrectParticipants && isCorrectChatType && isCorrectBooking;
  };

  useEffect(() => {
    if (!user?.uid || !otherUserId) { navigate(-1); return; }

    supabase.from('users').select('*').eq('id', otherUserId).single()
      .then(({ data }) => { if (data) setOtherUser(data); })
      .catch(console.error);

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages').select('*')
        .contains('participants', [user.uid])
        .order('timestamp', { ascending: true });

      if (!error && data) {
        const filtered = data.filter(isMatchingMessage);
        setMessages(filtered);
        const toMark = filtered.filter(m => m.receiverId === user.uid && !m.read).map(m => m.id);
        if (toMark.length > 0) {
          await supabase.from('messages').update({ read: true }).in('id', toMark);
        }
      }
      setLoading(false);
      scrollToBottom();
    };

    loadMessages();

    const channel = supabase
      .channel(`chat-${user.uid}-${otherUserId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        const msg = payload.new as Message;
        if (!isMatchingMessage(msg)) return;
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg].sort((a, b) => {
            const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            return timeA - timeB;
          });
        });
        if (msg.receiverId === user.uid && !msg.read) {
          await supabase.from('messages').update({ read: true }).eq('id', msg.id);
        }
        scrollToBottom();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.uid, otherUserId]);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user?.uid || !otherUserId) return;
    setSending(true);
    try {
      const messageData: any = {
        senderId: user.uid,
        senderName: user.name || user.email,
        receiverId: otherUserId,
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
        read: false,
        participants: [user.uid, otherUserId],
        chatType,
      };
      if (chatType === 'booking' && bookingId) messageData.bookingId = bookingId;
      await supabase.from('messages').insert(messageData);
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString(
      language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US',
      { hour: '2-digit', minute: '2-digit' }
    );
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    if (new Date(date).toDateString() === today.toDateString())
      return language === 'ar' ? 'اليوم' : language === 'fr' ? "Aujourd'hui" : 'Today';
    return new Date(date).toLocaleDateString(
      language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US'
    );
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-darkest)', color: 'var(--text-primary)' }}>
        <Navbar />
        <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 48, height: 48, border: '3px solid rgba(245,166,35,0.2)',
              borderTopColor: 'var(--primary)', borderRadius: '50%',
              animation: 'spin-slow 0.8s linear infinite', margin: '0 auto 1rem',
            }} />
            <p style={{ color: 'var(--text-muted)' }}>
              {language === 'ar' ? 'جاري التحميل...' : language === 'fr' ? 'Chargement...' : 'Loading...'}
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-darkest)', color: 'var(--text-primary)' }}>
      <Navbar />

      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '20%', left: '10%',
        width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(245,166,35,0.06) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
      }} />

      <main style={{
        position: 'relative', zIndex: 1,
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '100px 1.5rem 3rem',
        minHeight: '100vh',
      }}>
        <div style={{ width: '100%', maxWidth: 860 }}>
          {/* Chat Window */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-gold)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)',
          }}>

            {/* Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              background: 'linear-gradient(135deg, var(--bg-mid) 0%, var(--bg-card) 100%)',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {/* Avatar */}
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: otherUser?.photoURL ? 'transparent' : 'var(--grad-gold)',
                  backgroundImage: otherUser?.photoURL ? `url(${otherUser.photoURL})` : undefined,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid var(--border-gold)',
                  color: '#000', flexShrink: 0,
                }}>
                  {!otherUser?.photoURL && <User size={22} />}
                </div>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-white)' }}>
                    {otherUserName || otherUser?.fullName || otherUser?.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 500 }}>
                    {otherUser?.role === 'teacher'
                      ? (language === 'ar' ? 'معلم' : language === 'fr' ? 'Instructeur' : 'Instructor')
                      : (language === 'ar' ? 'طالب' : language === 'fr' ? 'Étudiant' : 'Student')}
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate(-1)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-full)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--primary)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                }}
              >
                <X size={16} />
                {language === 'ar' ? 'إغلاق' : language === 'fr' ? 'Fermer' : 'Close'}
              </button>
            </div>

            {/* Messages Area */}
            <div style={{
              height: 500, overflowY: 'auto', padding: '1.5rem',
              background: 'var(--bg-darkest)',
              display: 'flex', flexDirection: 'column', gap: '0.75rem',
            }}>
              {messages.length === 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', height: '100%',
                  color: 'var(--text-muted)', textAlign: 'center',
                }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: 'rgba(245,166,35,0.08)',
                    border: '1px solid var(--border-gold)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--primary)', marginBottom: '1rem',
                  }}>
                    <MessageCircle size={28} />
                  </div>
                  <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    {language === 'ar' ? 'لا توجد رسائل بعد' : language === 'fr' ? 'Aucun message pour le moment' : 'No messages yet'}
                  </p>
                  <p style={{ fontSize: '0.875rem' }}>
                    {language === 'ar' ? 'ابدأ المحادثة بإرسال رسالة' : language === 'fr' ? 'Commencez la conversation' : 'Start the conversation by sending a message'}
                  </p>
                </div>
              ) : (
                messages.map((message, index) => {
                  const isMyMessage = message.senderId === user?.uid;
                  const showDate = index === 0 || formatDate(messages[index - 1].timestamp) !== formatDate(message.timestamp);
                  return (
                    <div key={message.id}>
                      {showDate && (
                        <div style={{ textAlign: 'center', margin: '0.75rem 0' }}>
                          <span style={{
                            background: 'var(--bg-mid)',
                            border: '1px solid var(--border)',
                            padding: '4px 12px', borderRadius: 'var(--radius-full)',
                            fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500,
                          }}>
                            {formatDate(message.timestamp)}
                          </span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: isMyMessage ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '70%',
                          padding: '0.75rem 1rem',
                          borderRadius: isMyMessage
                            ? '1.25rem 1.25rem 0.25rem 1.25rem'
                            : '1.25rem 1.25rem 1.25rem 0.25rem',
                          background: isMyMessage
                            ? 'var(--grad-gold)'
                            : 'var(--bg-card)',
                          border: isMyMessage ? 'none' : '1px solid var(--border)',
                          color: isMyMessage ? '#000' : 'var(--text-primary)',
                          wordBreak: 'break-word',
                          boxShadow: isMyMessage ? 'var(--shadow-gold)' : 'var(--shadow-sm)',
                        }}>
                          <p style={{ margin: 0, lineHeight: 1.5, fontSize: '0.9375rem' }}>{message.message}</p>
                          <p style={{
                            margin: 0, marginTop: '0.375rem', fontSize: '0.7rem',
                            opacity: 0.7, textAlign: language === 'ar' ? 'left' : 'right',
                          }}>
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{
              padding: '1.25rem 1.5rem',
              background: 'var(--bg-dark)',
              borderTop: '1px solid var(--border)',
            }}>
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder={language === 'ar' ? 'اكتب رسالتك...' : language === 'fr' ? 'Écrivez votre message...' : 'Type your message...'}
                  disabled={sending}
                  className="input-pro"
                  style={{ flex: 1, borderRadius: 'var(--radius-full)' }}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  style={{
                    width: 48, height: 48, flexShrink: 0,
                    background: 'var(--grad-gold)',
                    border: 'none', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: sending || !newMessage.trim() ? 'not-allowed' : 'pointer',
                    opacity: sending || !newMessage.trim() ? 0.5 : 1,
                    transition: 'all 0.2s ease',
                    boxShadow: 'var(--shadow-gold)',
                    color: '#000',
                  }}
                >
                  {sending
                    ? <div style={{ width: 18, height: 18, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin-slow 0.6s linear infinite' }} />
                    : <Send size={18} />
                  }
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

const Chat = () => (
  <LanguageProvider>
    <ChatContent />
  </LanguageProvider>
);

export default Chat;
