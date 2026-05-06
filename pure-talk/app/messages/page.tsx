"use client";
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Home/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Edit, Image as ImageIcon, Send, Smile, Phone, Video, Info, Heart, Bell, BellOff, Trash2, Ban, Palette, X } from 'lucide-react';
import Link from 'next/link';

interface Message {
  id: number;
  text?: string;
  image?: string;
  isHeart?: boolean;
  sender: 'me' | 'them';
  timestamp: string;
}

interface Chat {
  id: number;
  name: string;
  username: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  isOnline: boolean;
  messages: Message[];
}

const mockChats: Chat[] = [
  {
    id: 1,
    name: 'Sarah Jones',
    username: 'sarah_j',
    avatar: 'https://i.pravatar.cc/150?img=47',
    lastMessage: 'Hey! Are we still on for tomorrow?',
    time: '2m',
    unread: 2,
    isOnline: true,
    messages: [
      { id: 101, text: 'Hey there! How have you been?', sender: 'them', timestamp: '10:00 AM' },
      { id: 102, text: 'I am doing great! Just working on this new app.', sender: 'me', timestamp: '10:05 AM' },
      { id: 103, text: 'That sounds amazing. Let me know when it\'s done!', sender: 'them', timestamp: '10:06 AM' },
      { id: 104, text: 'Hey! Are we still on for tomorrow?', sender: 'them', timestamp: '10:45 AM' },
    ]
  },
  {
    id: 2,
    name: 'David Smith',
    username: 'david_smith',
    avatar: 'https://i.pravatar.cc/150?img=15',
    lastMessage: 'Sent an attachment',
    time: '1h',
    unread: 0,
    isOnline: false,
    messages: [
      { id: 201, text: 'Check out these designs I made.', sender: 'them', timestamp: 'Yesterday' },
      { id: 202, text: 'Wow, these are super clean.', sender: 'me', timestamp: 'Yesterday' },
    ]
  },
  {
    id: 3,
    name: 'Emma Wilson',
    username: 'creative_mind',
    avatar: 'https://i.pravatar.cc/150?img=32',
    lastMessage: 'Haha, exactly!',
    time: '4h',
    unread: 1,
    isOnline: true,
    messages: [
      { id: 301, text: 'Did you see the new feature update?', sender: 'me', timestamp: '9:00 AM' },
      { id: 302, text: 'Yes, it is literally everything we asked for.', sender: 'them', timestamp: '9:05 AM' },
      { id: 303, text: 'Haha, exactly!', sender: 'them', timestamp: '9:06 AM' },
    ]
  },
];

export default function MessagesPage() {
  const [activeChat, setActiveChat] = useState<Chat>(mockChats[0]);
  const [inputText, setInputText] = useState('');
  const [chats, setChats] = useState<Chat[]>(mockChats);
  const [showEmojis, setShowEmojis] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [mutedChats, setMutedChats] = useState<Set<number>>(new Set());
  const [blockedChats, setBlockedChats] = useState<Set<number>>(new Set());
  const [chatThemes, setChatThemes] = useState<Record<number, string>>({});
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const emojis = ['😀', '😂', '😍', '🥰', '😎', '😭', '🙏', '✨', '🔥', '❤️', '👍', '🎉'];

  const themeOptions = ['#ff4d6d', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

  const activeTheme = activeChat ? (chatThemes[activeChat.id] || '#ff4d6d') : '#ff4d6d';
  const isBlocked = activeChat ? blockedChats.has(activeChat.id) : false;
  const isMuted = activeChat ? mutedChats.has(activeChat.id) : false;

  const toggleMute = () => {
    setMutedChats(prev => {
      const next = new Set(prev);
      if (next.has(activeChat.id)) next.delete(activeChat.id);
      else next.add(activeChat.id);
      return next;
    });
  };

  const toggleBlock = () => {
    setBlockedChats(prev => {
      const next = new Set(prev);
      if (next.has(activeChat.id)) next.delete(activeChat.id);
      else next.add(activeChat.id);
      return next;
    });
  };

  const deleteChat = () => {
    const updatedChats = chats.filter(c => c.id !== activeChat.id);
    setChats(updatedChats);
    if (updatedChats.length > 0) {
      setActiveChat(updatedChats[0]);
    }
    setShowSettings(false);
  };

  const changeTheme = (color: string) => {
    setChatThemes(prev => ({ ...prev, [activeChat.id]: color }));
  };

  const addMessageToChat = (msg: Message) => {
    const updatedChat = {
      ...activeChat,
      messages: [...activeChat.messages, msg],
      lastMessage: msg.text || (msg.image ? 'Sent a photo' : '❤️'),
      time: 'Just now'
    };
    setActiveChat(updatedChat);
    setChats(chats.map(c => c.id === updatedChat.id ? updatedChat : c));
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    addMessageToChat({
      id: Date.now(),
      text: inputText,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    setInputText('');
  };

  const sendHeart = () => {
    addMessageToChat({
      id: Date.now(),
      isHeart: true,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  };

  const sendImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      addMessageToChat({
        id: Date.now(),
        image: url,
        sender: 'me',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }
  };

  return (
    <div className="flex h-screen w-full bg-[var(--background)] text-[var(--foreground)] font-sans relative overflow-hidden">
      <Sidebar />

      <main className="flex w-full flex-1 md:ml-[72px] lg:ml-[245px] h-full relative z-10 p-0 md:p-4">
        <div className="flex w-full max-w-[1200px] mx-auto bg-[var(--background)] md:border border-[var(--ig-border)] md:rounded-2xl overflow-hidden shadow-sm h-full">
          
          {/* Chat List (Sidebar of Messages) */}
          <div className="w-full md:w-[350px] border-r border-[var(--ig-border)] flex flex-col h-full bg-[var(--background)]">
            <div className="p-4 md:p-6 border-b border-[var(--ig-border)] flex items-center justify-between sticky top-0 bg-[var(--background)] z-10">
              <h1 className="text-xl font-bold">Messages</h1>
              <button className="p-2 rounded-full hover:bg-[var(--ig-border)] transition-colors">
                <Edit className="w-5 h-5 text-[var(--foreground)]" />
              </button>
            </div>
            
            <div className="p-4 sticky top-[73px] bg-[var(--background)] z-10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ig-muted)]" />
                <input 
                  type="text" 
                  placeholder="Search messages" 
                  className="w-full bg-[var(--ig-border)] border border-transparent rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-[#ff4d6d] focus:bg-[var(--background)] transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none pb-20 md:pb-0" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
              <AnimatePresence>
                {chats.map((chat) => (
                  <motion.div
                    key={chat.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center gap-3 p-4 cursor-pointer transition-colors relative ${activeChat.id === chat.id ? 'bg-[var(--ig-border)] dark:bg-white/5' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                    onClick={() => { setActiveChat(chat); setShowSettings(false); }}
                  >
                    {activeChat?.id === chat.id && (
                      <motion.div layoutId="activeChatIndicator" className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: activeTheme }} />
                    )}
                    <div className="relative w-14 h-14 shrink-0">
                      <img src={chat.avatar} alt={chat.name} className="w-full h-full rounded-full object-cover border border-[var(--ig-border)]" />
                      {chat.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[var(--background)] rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-semibold truncate ${chat.unread > 0 ? 'text-[var(--foreground)]' : 'text-[var(--foreground)]'}`}>
                          {chat.name} {mutedChats.has(chat.id) && <BellOff className="inline w-3 h-3 ml-1 text-[var(--ig-muted)]" />}
                        </span>
                        <span className="text-xs text-[var(--ig-muted)] whitespace-nowrap ml-2">
                          {chat.time}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm truncate pr-2 ${chat.unread > 0 ? 'font-semibold text-[var(--foreground)]' : 'text-[var(--ig-muted)]'}`}>
                          {chat.lastMessage}
                        </span>
                        {chat.unread > 0 && (
                          <span className="w-2 h-2 rounded-full bg-[#ff4d6d] shrink-0"></span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Active Chat Area */}
          {activeChat ? (
            <div className="hidden md:flex flex-col flex-1 h-full bg-[var(--background)] relative overflow-hidden">
              {/* Chat Header */}
              <div className="p-4 md:px-6 md:py-4 border-b border-[var(--ig-border)] flex items-center justify-between bg-[var(--background)]/80 backdrop-blur-md sticky top-0 z-20">
              <Link href="/users/user-profile" className="flex items-center gap-3 group">
                <div className="relative w-10 h-10 shrink-0">
                  <img src={activeChat.avatar} alt={activeChat.name} className="w-full h-full rounded-full object-cover border border-transparent group-hover:border-[#ff4d6d] transition-colors" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm group-hover:opacity-80 transition-opacity">{activeChat.name}</span>
                  <span className="text-xs text-[var(--ig-muted)]">{activeChat.isOnline ? 'Active now' : 'Offline'}</span>
                </div>
              </Link>
              <div className="flex items-center gap-4 text-[var(--foreground)]">
                <button className="hover:text-[#ff4d6d] transition-colors p-2"><Phone className="w-5 h-5" /></button>
                <button className="hover:text-[#ff4d6d] transition-colors p-2"><Video className="w-5 h-5" /></button>
                <button onClick={() => setShowSettings(!showSettings)} className={`transition-colors p-2 ${showSettings ? 'text-[#ff4d6d]' : 'hover:text-[#ff4d6d]'}`}>
                  <Info className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4 scrollbar-none" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
              <AnimatePresence>
                {activeChat.messages.map((msg, index) => {
                  const isMe = msg.sender === 'me';
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2, delay: index * 0.02 }}
                      className={`flex flex-col w-full ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div 
                        className={`max-w-[75%] md:max-w-[65%] px-4 py-2.5 rounded-2xl ${
                        msg.isHeart ? 'bg-transparent shadow-none p-0' :
                        msg.image ? 'bg-transparent shadow-none p-0' :
                        isMe 
                          ? 'text-white rounded-br-sm shadow-md' 
                          : 'bg-[var(--ig-border)] dark:bg-white/10 text-[var(--foreground)] rounded-bl-sm shadow-sm'
                        }`}
                        style={isMe && !msg.isHeart && !msg.image ? { backgroundColor: activeTheme } : {}}
                      >
                        {msg.isHeart && <Heart className="w-16 h-16 drop-shadow-md animate-pulse" style={{ fill: activeTheme, color: activeTheme }} />}
                        {msg.image && <img src={msg.image} alt="Attachment" className="max-w-[200px] rounded-2xl border border-[var(--ig-border)] object-cover shadow-sm" />}
                        {msg.text && <p className="text-sm md:text-[15px] leading-relaxed">{msg.text}</p>}
                      </div>
                      <span className="text-[10px] text-[var(--ig-muted)] mt-1 mx-1">{msg.timestamp}</span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Message Input Area */}
            <div className="relative p-4 md:p-6 border-t border-[var(--ig-border)] bg-[var(--background)] sticky bottom-0">
              
              {/* Emoji Popover */}
              <AnimatePresence>
                {showEmojis && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-[80px] left-6 bg-[var(--background)] border border-[var(--ig-border)] shadow-[0_4px_20px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_rgba(255,255,255,0.05)] rounded-2xl p-4 grid grid-cols-4 gap-3 z-50"
                  >
                    {emojis.map(emoji => (
                      <button 
                        key={emoji} 
                        type="button" 
                        onClick={() => { setInputText(prev => prev + emoji); setShowEmojis(false); }}
                        className="text-2xl hover:scale-125 transition-transform flex items-center justify-center p-1"
                      >
                        {emoji}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {isBlocked ? (
                <div className="flex-1 text-center text-sm font-semibold text-[var(--ig-muted)] py-2">
                  You blocked this account. Unblock to send a message.
                </div>
              ) : (
                <form onSubmit={sendMessage} className="flex items-center gap-2 bg-[var(--ig-border)] dark:bg-white/5 border border-transparent focus-within:border-[var(--ig-muted)] focus-within:bg-[var(--background)] transition-all rounded-full p-1.5 pr-2 w-full">
                  <button type="button" onClick={() => setShowEmojis(!showEmojis)} className="p-2 text-[var(--ig-muted)] transition-colors rounded-full shrink-0" style={{ ':hover': { color: activeTheme } } as any}>
                    <Smile className="w-6 h-6" />
                  </button>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Message..."
                    className="flex-1 bg-transparent border-none focus:outline-none text-sm px-2 min-w-0"
                  />
                  
                  {/* Hidden file input */}
                  <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={sendImage} />

                  {inputText.trim() ? (
                    <motion.button 
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1 }}
                      type="submit" 
                      className="p-2 font-semibold text-sm hover:opacity-80 transition-opacity shrink-0"
                      style={{ color: activeTheme }}
                    >
                      Send
                    </motion.button>
                  ) : (
                    <>
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-[var(--ig-muted)] hover:text-[var(--foreground)] transition-colors rounded-full shrink-0">
                        <ImageIcon className="w-5 h-5" />
                      </button>
                      <button type="button" onClick={sendHeart} className="p-2 text-[var(--ig-muted)] transition-colors rounded-full shrink-0" style={{ ':hover': { color: activeTheme } } as any}>
                        <Heart className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </form>
              )}
            </div>

            {/* Chat Settings Overlay */}
            <AnimatePresence>
              {showSettings && (
                <motion.div 
                  initial={{ x: 300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 300, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="absolute top-0 right-0 bottom-0 w-[300px] bg-[var(--background)] border-l border-[var(--ig-border)] shadow-xl z-30 flex flex-col"
                >
                  <div className="p-4 border-b border-[var(--ig-border)] flex items-center justify-between">
                    <h2 className="font-bold text-lg">Details</h2>
                    <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-[var(--ig-border)] rounded-full transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="p-6 flex flex-col items-center border-b border-[var(--ig-border)]">
                    <img src={activeChat.avatar} alt={activeChat.name} className="w-20 h-20 rounded-full object-cover mb-3" />
                    <h3 className="font-semibold text-lg">{activeChat.name}</h3>
                    <span className="text-sm text-[var(--ig-muted)]">@{activeChat.username}</span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2">
                    <div className="p-2">
                      <button onClick={toggleMute} className="w-full flex items-center justify-between p-3 hover:bg-[var(--ig-border)] rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                          {isMuted ? <BellOff className="w-5 h-5 text-orange-500" /> : <Bell className="w-5 h-5" />}
                          <span className="font-medium text-sm">{isMuted ? 'Unmute Messages' : 'Mute Messages'}</span>
                        </div>
                      </button>

                      <div className="w-full p-3 mt-2 border-t border-[var(--ig-border)]">
                        <div className="flex items-center gap-3 mb-3">
                          <Palette className="w-5 h-5" />
                          <span className="font-medium text-sm">Chat Theme</span>
                        </div>
                        <div className="flex gap-2 pl-8">
                          {themeOptions.map(color => (
                            <button
                              key={color}
                              onClick={() => changeTheme(color)}
                              className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                              style={{ 
                                backgroundColor: color, 
                                borderColor: activeTheme === color ? 'var(--foreground)' : 'transparent' 
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      
                      <div className="w-full mt-2 border-t border-[var(--ig-border)] pt-2">
                        <button onClick={toggleBlock} className="w-full flex items-center gap-3 p-3 hover:bg-[var(--ig-border)] rounded-xl transition-colors text-red-500">
                          <Ban className="w-5 h-5" />
                          <span className="font-medium text-sm">{isBlocked ? 'Unblock Account' : 'Block Account'}</span>
                        </button>
                        
                        <button onClick={deleteChat} className="w-full flex items-center gap-3 p-3 hover:bg-[var(--ig-border)] rounded-xl transition-colors text-red-500">
                          <Trash2 className="w-5 h-5" />
                          <span className="font-medium text-sm">Delete Chat</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
          ) : (
            <div className="hidden md:flex flex-col flex-1 h-full items-center justify-center bg-[var(--background)]">
              <div className="w-24 h-24 border-2 border-[var(--ig-foreground)] rounded-full flex items-center justify-center mb-4">
                <Send className="w-12 h-12" />
              </div>
              <h2 className="text-xl font-bold mb-2">Your Messages</h2>
              <p className="text-[var(--ig-muted)] text-sm mb-6">Send private photos and messages to a friend or group.</p>
              <button className="bg-[#ff4d6d] hover:bg-[#ff3355] text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                Send Message
              </button>
            </div>
          )}
          
        </div>
      </main>
    </div>
  );
}
