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

export default function ChatPage() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isMobileView, setIsMobileView] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Get current user with proper typing
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
    refetchInterval: 30000, // Refetch every 30 seconds for new messages
  });

  // Get messages for selected conversation
  const { data: conversationMessages = [] } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat/conversations', selectedConversation, 'messages'],
    enabled: !!selectedConversation,
    refetchInterval: 5000, // Refetch every 5 seconds when conversation is open
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { message: string }) => {
      return apiRequest('POST', `/api/chat/conversations/${selectedConversation}/messages`, { message: messageData.message });
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

  // Mark messages as read when selecting conversation (with debounce)
  const markAsRead = useCallback((conversationId: number) => {
    if (!markAsReadMutation.isPending) {
      markAsReadMutation.mutate(conversationId);
    }
  }, [markAsReadMutation]);

  useEffect(() => {
    if (selectedConversation && user?.id) {
      const timer = setTimeout(() => {
        markAsRead(selectedConversation);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedConversation, user?.id, markAsRead]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationMessages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation || sendMessageMutation.isPending) {
      return;
    }

    sendMessageMutation.mutate({ message: newMessage });
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
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const filteredConversations = conversations.filter(conv => {
    const displayName = getUserDisplayName(conv);
    const jobTitle = conv.jobTitle || '';
    return displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getConversationTitle = (conversation: ChatConversation) => {
    const displayName = getUserDisplayName(conversation);
    const jobTitle = conversation.jobTitle ? ` - ${conversation.jobTitle}` : '';
    return `${displayName}${jobTitle}`;
  };

  const handleConversationSelect = (conversationId: number) => {
    setSelectedConversation(conversationId);
    if (isMobileView) {
      setShowConversationList(false);
    }
  };

  const handleBackToList = () => {
    setShowConversationList(true);
    setSelectedConversation(null);
  };

  // LinkedIn-style conversation list
  const ConversationList = () => (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Messages
        </h2>
      </div>
      
      <ScrollArea className="flex-1">
        {conversationsLoading ? (
          <div className="p-4 text-center text-gray-500">Loading conversations...</div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No conversations yet</p>
            <p className="text-sm">Start chatting with recruiters or job seekers!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => handleConversationSelect(conversation.id)}
                className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  selectedConversation === conversation.id 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' 
                    : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-500 text-white">
                      {getUserDisplayName(conversation).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {getUserDisplayName(conversation)}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
                      </span>
                    </div>
                    
                    {conversation.jobTitle && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
                        {conversation.jobTitle}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        Click to start messaging
                      </p>
                      {conversation.unreadCount && conversation.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  // LinkedIn-style message view
  const MessageView = () => {
    const selectedConv = conversations.find(c => c.id === selectedConversation);
    
    if (!selectedConversation || !selectedConv) {
      return (
        <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800">
          <div className="text-center">
            <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Select a conversation
            </h3>
            <p className="text-gray-500">Choose a conversation to start messaging</p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col bg-white dark:bg-gray-900">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex items-center space-x-3">
            {isMobileView && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToList}
                className="p-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-500 text-white text-sm">
                {getUserDisplayName(selectedConv).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {getUserDisplayName(selectedConv)}
              </h3>
              {selectedConv.jobTitle && (
                <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
                  {selectedConv.jobTitle}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {conversationMessages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              conversationMessages.map((message) => {
                const isOwn = message.senderId === user?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isOwn
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className={`text-xs ${
                          isOwn 
                            ? 'text-blue-100' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {formatMessageTime(message.createdAt)}
                        </span>
                        {isOwn && message.isRead && (
                          <CheckCheck className="h-3 w-3 text-blue-100" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1"
              disabled={sendMessageMutation.isPending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sendMessageMutation.isPending}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Mobile layout with sheet
  if (isMobileView) {
    return (
      <div className="h-screen">
        {showConversationList ? (
          <ConversationList />
        ) : (
          <MessageView />
        )}
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="h-screen flex">
      <div className="w-80 border-r border-gray-200 dark:border-gray-700">
        <ConversationList />
      </div>
      <div className="flex-1">
        <MessageView />
      </div>
    </div>
  );
}