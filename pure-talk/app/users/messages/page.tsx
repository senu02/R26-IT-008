// app/users/messages/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/User/Sidebar';
import { BackgroundWrapper, getTheme } from '@/context/theme';
import { ToastProvider, useToast } from '@/context/userToast';
import { 
  Search, 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  Smile, 
  Phone, 
  Video, 
  MoreVertical, 
  Check, 
  CheckCheck, 
  ArrowLeft,
  Circle,
  Plus,
  Info,
  X
} from 'lucide-react';
import { getCurrentUserData, getImageUrl } from '@/lib/api';

// Interface definitions
interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  image?: string;
  isRead: boolean;
}

interface ChatContact {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isOnline: boolean;
  lastSeen?: string;
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: string;
  messages: Message[];
}

// Initial mock contacts & conversation data
const INITIAL_CONTACTS: ChatContact[] = [
  {
    id: 'user-1',
    name: 'Suranga Lakmal',
    username: 'suranga_lakmal',
    avatar: 'https://i.pravatar.cc/150?img=33',
    isOnline: true,
    unreadCount: 2,
    lastMessage: 'Hey! Are we still meeting up for the project demo today?',
    lastMessageTime: '10:42 AM',
    messages: [
      {
        id: 'm1',
        senderId: 'user-1',
        text: 'Hey Praveen! Hope you are doing well.',
        timestamp: '10:30 AM',
        isRead: true,
      },
      {
        id: 'm2',
        senderId: 'me',
        text: 'Hi Suranga! Doing great, how about you?',
        timestamp: '10:35 AM',
        isRead: true,
      },
      {
        id: 'm3',
        senderId: 'user-1',
        text: 'Hey! Are we still meeting up for the project demo today?',
        timestamp: '10:42 AM',
        isRead: false,
      },
    ],
  },
  {
    id: 'user-2',
    name: 'Kasun Kalhara',
    username: 'kasun_k',
    avatar: 'https://i.pravatar.cc/150?img=12',
    isOnline: true,
    unreadCount: 0,
    lastMessage: 'Check out the new design layout I shared!',
    lastMessageTime: '9:15 AM',
    messages: [
      {
        id: 'm4',
        senderId: 'me',
        text: 'Did you get a chance to look at the new UI elements?',
        timestamp: '9:00 AM',
        isRead: true,
      },
      {
        id: 'm5',
        senderId: 'user-2',
        text: 'Check out the new design layout I shared!',
        timestamp: '9:15 AM',
        isRead: true,
      },
    ],
  },
  {
    id: 'user-3',
    name: 'Nimali Fernando',
    username: 'nimali_f',
    avatar: 'https://i.pravatar.cc/150?img=47',
    isOnline: false,
    lastSeen: '2h ago',
    unreadCount: 1,
    lastMessage: 'Thanks for sending the files over!',
    lastMessageTime: 'Yesterday',
    messages: [
      {
        id: 'm6',
        senderId: 'user-3',
        text: 'Thanks for sending the files over!',
        timestamp: 'Yesterday',
        isRead: false,
      },
    ],
  },
  {
    id: 'user-4',
    name: 'Dinesh Chandimal',
    username: 'dinesh_c',
    avatar: 'https://i.pravatar.cc/150?img=60',
    isOnline: false,
    lastSeen: '1d ago',
    unreadCount: 0,
    lastMessage: 'Sounds good to me. Talk soon!',
    lastMessageTime: 'Mon',
    messages: [
      {
        id: 'm7',
        senderId: 'user-4',
        text: 'Sounds good to me. Talk soon!',
        timestamp: 'Mon',
        isRead: true,
      },
    ],
  },
];

export default function MessagesPage() {
  return (
    <ToastProvider>
      <MessagesContent />
    </ToastProvider>
  );
}

function MessagesContent() {
  const toast = useToast();
  const [isDark, setIsDark] = useState(true);
  const [contacts, setContacts] = useState<ChatContact[]>(INITIAL_CONTACTS);
  const [selectedContactId, setSelectedContactId] = useState<string>('user-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'online'>('all');
  const [inputMessage, setInputMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const theme = getTheme(isDark);
  const selectedContact = contacts.find((c) => c.id === selectedContactId) || contacts[0];

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedContact?.messages]);

  // Mark messages as read when opening contact
  useEffect(() => {
    if (selectedContactId) {
      setContacts((prev) =>
        prev.map((contact) =>
          contact.id === selectedContactId
            ? {
                ...contact,
                unreadCount: 0,
                messages: contact.messages.map((m) => ({ ...m, isRead: true })),
              }
            : contact
        )
      );
    }
  }, [selectedContactId]);

  // Filtered contacts list
  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.username.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterTab === 'unread') return contact.unreadCount > 0;
    if (filterTab === 'online') return contact.isOnline;
    return true;
  });

  // Handle Image attachment selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.showError('Image size should be under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Send message handler with auto-reply simulation
  const handleSendMessage = () => {
    if ((!inputMessage.trim() && !selectedImage) || !selectedContactId) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: 'me',
      text: inputMessage.trim(),
      image: selectedImage || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: true,
    };

    const updatedText = inputMessage.trim() || '📷 Photo';

    setContacts((prev) =>
      prev.map((c) =>
        c.id === selectedContactId
          ? {
              ...c,
              lastMessage: updatedText,
              lastMessageTime: 'Just now',
              messages: [...c.messages, newMessage],
            }
          : c
      )
    );

    setInputMessage('');
    setSelectedImage(null);
    setShowEmojiPicker(false);

    // Simulate response from contact after 1.5s
    setTimeout(() => {
      const replies = [
        "Got it! Thanks for letting me know 👍",
        "That sounds awesome! Let me review it.",
        "Sure thing! Let me know if you need anything else.",
        "Awesome! Speak to you soon.",
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];

      const autoReplyMessage: Message = {
        id: `reply-${Date.now()}`,
        senderId: selectedContactId,
        text: randomReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: true,
      };

      setContacts((prev) =>
        prev.map((c) =>
          c.id === selectedContactId
            ? {
                ...c,
                lastMessage: randomReply,
                lastMessageTime: 'Just now',
                messages: [...c.messages, autoReplyMessage],
              }
            : c
        )
      );
    }, 1500);
  };

  const EMOJIS = ['👍', '❤️', '🔥', '😊', '🎉', '🙌', '💯', '✨', '😍', '👏'];

  return (
    <BackgroundWrapper isDark={isDark}>
      <div className="flex h-screen w-full max-w-[1440px] mx-auto bg-[var(--background)] text-slate-100 font-sans overflow-hidden">
        {/* Left App Navigation Sidebar */}
        <aside className="hidden md:block w-[72px] lg:w-[245px] shrink-0 h-full">
          <Sidebar />
        </aside>

        {/* Messages Main Layout - Split View */}
        <main className="flex-1 flex h-full overflow-hidden p-2 md:p-4 gap-4">
          {/* ================= LEFT CHATS LIST PANEL ================= */}
          <div
            className={`w-full md:w-[340px] lg:w-[380px] shrink-0 flex flex-col rounded-3xl bg-[#10151f]/95 border border-rose-500/20 backdrop-blur-xl shadow-[0_10px_35px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-300 ${
              mobileShowChat ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Header & Search */}
            <div className="p-4 border-b border-rose-500/15 space-y-3">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                  <span>Messages</span>
                  <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                </h1>
                <button
                  type="button"
                  onClick={() => toast.showInfo('Start a new chat by selecting a friend')}
                  className="p-2 rounded-xl bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 transition-colors border border-rose-500/20"
                  title="New Conversation"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chats or friends..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500/50 transition-all"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 pt-1">
                {(['all', 'unread', 'online'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilterTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                      filterTab === tab
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                        : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/60'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-rose-500/20">
              {filteredContacts.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">
                  No conversations found
                </div>
              ) : (
                filteredContacts.map((contact) => {
                  const isSelected = contact.id === selectedContactId;
                  return (
                    <div
                      key={contact.id}
                      onClick={() => {
                        setSelectedContactId(contact.id);
                        setMobileShowChat(true);
                      }}
                      className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'bg-gradient-to-r from-rose-600/25 via-rose-500/15 to-transparent border-l-4 border-rose-500 shadow-[inset_0_0_15px_rgba(244,63,94,0.15)]'
                          : 'hover:bg-slate-900/60 border border-transparent'
                      }`}
                    >
                      {/* Avatar with online status badge */}
                      <div className="relative shrink-0">
                        <img
                          src={contact.avatar}
                          alt={contact.name}
                          className="h-12 w-12 rounded-full object-cover border border-rose-500/30 shadow-md"
                        />
                        {contact.isOnline && (
                          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-[#10151f]" />
                        )}
                      </div>

                      {/* Contact Info & Last Message */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="truncate text-sm font-semibold text-white">
                            {contact.name}
                          </h3>
                          <span className="text-[11px] text-slate-400 shrink-0">
                            {contact.lastMessageTime}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="truncate text-xs text-slate-400 font-normal">
                            {contact.lastMessage}
                          </p>
                          {contact.unreadCount > 0 && (
                            <span className="ml-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold text-white shadow-[0_0_8px_rgba(244,63,94,0.7)]">
                              {contact.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ================= RIGHT ACTIVE CHAT CONVERSATION PANEL ================= */}
          <div
            className={`flex-1 flex flex-col rounded-3xl bg-[#10151f]/95 border border-rose-500/20 backdrop-blur-xl shadow-[0_10px_35px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-300 ${
              mobileShowChat ? 'flex' : 'hidden md:flex'
            }`}
          >
            {selectedContact ? (
              <>
                {/* Active Chat Header */}
                <div className="flex items-center justify-between p-3.5 md:p-4 border-b border-rose-500/15 bg-slate-900/40">
                  <div className="flex items-center gap-3">
                    {/* Mobile Back Button */}
                    <button
                      type="button"
                      onClick={() => setMobileShowChat(false)}
                      className="md:hidden p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>

                    <div className="relative">
                      <img
                        src={selectedContact.avatar}
                        alt={selectedContact.name}
                        className="h-11 w-11 rounded-full object-cover border border-rose-500/40"
                      />
                      {selectedContact.isOnline && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-[#10151f]" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white leading-tight">
                        {selectedContact.name}
                      </h2>
                      <span className="text-xs text-slate-400 flex items-center gap-1.5">
                        {selectedContact.isOnline ? (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active now
                          </>
                        ) : (
                          `Last seen ${selectedContact.lastSeen || 'recently'}`
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Header Call Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toast.showInfo(`Starting voice call with ${selectedContact.name}...`)}
                      className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
                      title="Voice Call"
                    >
                      <Phone className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toast.showInfo(`Starting video call with ${selectedContact.name}...`)}
                      className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
                      title="Video Call"
                    >
                      <Video className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white transition-all"
                      title="Contact Info"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Messages Stream Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-rose-500/20">
                  {/* Date Badge Separator */}
                  <div className="flex items-center justify-center my-2">
                    <span className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800/80 text-[11px] font-semibold text-slate-400">
                      Today
                    </span>
                  </div>

                  {selectedContact.messages.map((msg) => {
                    const isMe = msg.senderId === 'me';
                    return (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isMe && (
                          <img
                            src={selectedContact.avatar}
                            alt="sender"
                            className="h-7 w-7 rounded-full object-cover mb-1 border border-slate-700"
                          />
                        )}
                        <div
                          className={`max-w-[75%] md:max-w-[65%] rounded-2xl p-3.5 shadow-md ${
                            isMe
                              ? 'bg-gradient-to-r from-red-600 via-rose-600 to-rose-700 text-white rounded-br-none shadow-[0_4px_15px_rgba(225,29,72,0.3)]'
                              : 'bg-slate-900/90 border border-slate-800 text-slate-100 rounded-bl-none'
                          }`}
                        >
                          {msg.image && (
                            <img
                              src={msg.image}
                              alt="Attachment"
                              className="mb-2 max-h-60 rounded-xl object-cover w-full border border-black/20"
                            />
                          )}
                          {msg.text && (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {msg.text}
                            </p>
                          )}
                          <div
                            className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                              isMe ? 'text-rose-200' : 'text-slate-400'
                            }`}
                          >
                            <span>{msg.timestamp}</span>
                            {isMe && <CheckCheck className="h-3 w-3 text-rose-200" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Selected Image Attachment Preview */}
                {selectedImage && (
                  <div className="px-4 pt-2 flex items-center gap-3">
                    <div className="relative group">
                      <img
                        src={selectedImage}
                        alt="Preview"
                        className="h-16 w-16 object-cover rounded-xl border-2 border-rose-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => setSelectedImage(null)}
                        className="absolute -top-2 -right-2 p-1 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="text-xs text-slate-400">Ready to send photo</span>
                  </div>
                )}

                {/* Emoji Quick Bar */}
                {showEmojiPicker && (
                  <div className="px-4 py-2 bg-slate-900/80 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto">
                    {EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setInputMessage((prev) => prev + emoji);
                          setShowEmojiPicker(false);
                        }}
                        className="text-lg p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {/* Bottom Input Area */}
                <div className="p-3 md:p-4 border-t border-rose-500/15 bg-slate-900/60">
                  <div className="flex items-center gap-2">
                    {/* Attachment buttons */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all"
                      title="Attach Image"
                    >
                      <ImageIcon className="h-5 w-5" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`p-2.5 rounded-xl border transition-all ${
                        showEmojiPicker
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-amber-400'
                      }`}
                      title="Add Emoji"
                    >
                      <Smile className="h-5 w-5" />
                    </button>

                    {/* Message Input */}
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendMessage();
                      }}
                      placeholder={`Message ${selectedContact.name}...`}
                      className="flex-1 px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500/50 transition-all"
                    />

                    {/* Send Button */}
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() && !selectedImage}
                      className="p-3 rounded-2xl bg-gradient-to-r from-red-600 via-rose-500 to-rose-600 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all"
                      title="Send Message"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <p>Select a conversation to start chatting</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </BackgroundWrapper>
  );
}
