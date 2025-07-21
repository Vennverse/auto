import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Send, MessageCircle, Users, Clock, CheckCheck, ArrowLeft, Menu, Search, MoreVertical, Phone, Video } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: string;
  message: string;
  messageType: string;
  isRead: boolean;
  createdAt: string;
}

interface ChatConversation {
  id: number;
  recruiterId: string;
  jobSeekerId: string;
  jobPostingId?: number;
  applicationId?: number;
  lastMessageAt: string;
  isActive: boolean;
  createdAt: string;
  jobTitle?: string;
  recruiterName?: string;
  jobSeekerName?: string;
  unreadCount?: number;
}

interface User {
  id: string;
  email: string;
  userType?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

export default function EnhancedChatPage() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isMobileView, setIsMobileView] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Get current user
  const { data: user } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  // Handle mobile responsiveness
  useEffect(() => {
    const checkMobileView = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileView(isMobile);
      if (!isMobile) {
        setShowConversationList(true);
      }
    };
    
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  // Get conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<ChatConversation[]>({
    queryKey: ['/api/chat/conversations'],
    refetchInterval: 30000,
  });

  // Get messages for selected conversation
  const { data: conversationMessages = [] } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat/conversations', selectedConversation, 'messages'],
    enabled: !!selectedConversation,
    refetchInterval: 5000,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { message: string }) => {
      return apiRequest('POST', `/api/chat/conversations/${selectedConversation}/messages`, messageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations', selectedConversation, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      setNewMessage('');
    },
  });

  // Mark messages as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      return apiRequest('POST', `/api/chat/conversations/${conversationId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationMessages]);

  // Mark messages as read when selecting conversation
  useEffect(() => {
    if (selectedConversation && user?.id) {
      const timer = setTimeout(() => {
        markAsReadMutation.mutate(selectedConversation);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [selectedConversation, user?.id, markAsReadMutation]);

  const handleConversationSelect = (conversationId: number) => {
    setSelectedConversation(conversationId);
    if (isMobileView) {
      setShowConversationList(false);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation || sendMessageMutation.isPending) {
      return;
    }
    sendMessageMutation.mutate({ message: newMessage.trim() });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getUserDisplayName = (conversation: ChatConversation) => {
    if (!user) return 'Unknown User';
    
    if (user.userType === 'recruiter') {
      return conversation.jobSeekerName || 'Job Seeker';
    } else {
      return conversation.recruiterName || 'Recruiter';
    }
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0).toUpperCase()).join('').slice(0, 2);
  };

  const formatMessageTime = (timestamp: string) => {
    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return format(messageDate, 'HH:mm');
    } else if (diffHours < 168) { // 7 days
      return format(messageDate, 'EEE HH:mm');
    } else {
      return format(messageDate, 'MMM d, HH:mm');
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const displayName = getUserDisplayName(conv);
    const jobTitle = conv.jobTitle || '';
    return displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // LinkedIn-style conversation list
  const ConversationList = () => (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            Messages
          </h2>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            {conversations.length}
          </Badge>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>
      
      {/* Conversations */}
      <ScrollArea className="flex-1">
        {conversationsLoading ? (
          <div className="p-4 text-center text-gray-500">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-start space-x-3 p-3">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </h3>
            <p className="text-sm">
              {searchQuery ? 'Try a different search term' : 'Start chatting with recruiters or job seekers!'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            <AnimatePresence>
              {filteredConversations.map((conversation, index) => (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleConversationSelect(conversation.id)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 ${
                    selectedConversation === conversation.id 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-r-4 border-blue-500' 
                      : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12 ring-2 ring-white dark:ring-gray-800">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium">
                          {getUserInitials(getUserDisplayName(conversation))}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {getUserDisplayName(conversation)}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
                        </span>
                      </div>
                      
                      {conversation.jobTitle && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 truncate mb-1 font-medium">
                          📋 {conversation.jobTitle}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          Click to view conversation
                        </p>
                        {conversation.unreadCount && conversation.unreadCount > 0 && (
                          <Badge className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                            {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>
    </motion.div>
  );

  // LinkedIn-style message view
  const MessageView = () => {
    const selectedConv = conversations.find(c => c.id === selectedConversation);
    
    if (!selectedConversation || !selectedConv) {
      return (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900"
        >
          <div className="text-center max-w-md">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <MessageCircle className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Welcome to Messages
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Select a conversation from the sidebar to start messaging with recruiters and job seekers
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span>Online</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCheck className="h-4 w-4" />
                <span>Read receipts</span>
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="h-full flex flex-col bg-white dark:bg-gray-900"
      >
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isMobileView && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConversationList(true)}
                  className="lg:hidden"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              
              <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-gray-800">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {getUserInitials(getUserDisplayName(selectedConv))}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {getUserDisplayName(selectedConv)}
                </h3>
                {selectedConv.jobTitle && (
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    📋 {selectedConv.jobTitle}
                  </p>
                )}
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                  Active now
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                <Video className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            <AnimatePresence>
              {conversationMessages.map((message, index) => {
                const isOwnMessage = message.senderId === user?.id;
                
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      {!isOwnMessage && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gray-200 dark:bg-gray-700 text-xs">
                            {getUserInitials(getUserDisplayName(selectedConv))}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={`px-4 py-2 rounded-2xl ${
                        isOwnMessage 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                      }`}>
                        <p className="text-sm">{message.message}</p>
                        <div className={`flex items-center justify-end mt-1 space-x-1 ${
                          isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          <span className="text-xs">{formatMessageTime(message.createdAt)}</span>
                          {isOwnMessage && (
                            <CheckCheck className={`h-3 w-3 ${message.isRead ? 'text-blue-200' : 'text-blue-300'}`} />
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="pr-12 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 rounded-full"
                disabled={sendMessageMutation.isPending}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sendMessageMutation.isPending}
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-8 h-8 p-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Mobile layout with enhanced transitions
  if (isMobileView) {
    return (
      <div className="h-screen overflow-hidden">
        <AnimatePresence mode="wait">
          {showConversationList ? (
            <motion.div
              key="conversations"
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <ConversationList />
            </motion.div>
          ) : (
            <motion.div
              key="messages"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <MessageView />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="h-screen flex overflow-hidden">
      <div className="w-80 flex-shrink-0">
        <ConversationList />
      </div>
      <div className="flex-1">
        <MessageView />
      </div>
    </div>
  );
}