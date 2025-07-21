import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, MessageCircle, Search, ArrowLeft, Phone, Video, MoreVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

export default function MessagingPage() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [location] = useLocation();
  
  // Parse URL parameters for user preload
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const preloadUserId = urlParams.get('user');
  
  // Track user activity for online status
  const trackActivityMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/user/activity', {});
    },
  });

  // Get current user
  const { data: user } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  // Get conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<ChatConversation[]>({
    queryKey: ['/api/chat/conversations'],
    refetchInterval: 30000,
  });

  // Get messages for selected conversation
  const { data: conversationMessages = [], isLoading: messagesLoading, error: messagesError } = useQuery<ChatMessage[]>({
    queryKey: [`/api/chat/conversations/${selectedConversation}/messages`],
    enabled: !!selectedConversation,
    refetchInterval: 2000,
  });





  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { message: string }) => {
      return apiRequest('POST', `/api/chat/conversations/${selectedConversation}/messages`, messageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chat/conversations/${selectedConversation}/messages`] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      setNewMessage('');
    },
  });

  // Mark messages as read
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

  // Track user activity
  useEffect(() => {
    // Track activity when component mounts
    trackActivityMutation.mutate();
    
    // Track activity every 2 minutes
    const activityInterval = setInterval(() => {
      trackActivityMutation.mutate();
    }, 2 * 60 * 1000);

    return () => clearInterval(activityInterval);
  }, []);

  // Auto-select conversation based on URL parameter or first conversation
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      // If there's a preload user ID, try to find the conversation with that user
      if (preloadUserId) {
        const targetConversation = conversations.find(conv => 
          conv.jobSeekerId === preloadUserId || conv.recruiterId === preloadUserId
        );
        if (targetConversation) {
          setSelectedConversation(targetConversation.id);
          return;
        }
      }
      // Otherwise select the first conversation
      setSelectedConversation(conversations[0].id);
    }
  }, [conversations, selectedConversation, preloadUserId]);

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      markAsReadMutation.mutate(selectedConversation);
    }
  }, [selectedConversation]);

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedConversation) {
      sendMessageMutation.mutate({ message: newMessage.trim() });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getConversationName = (conversation: ChatConversation) => {
    if (user?.userType === 'recruiter') {
      return conversation.jobSeekerName || 'Job Seeker';
    } else {
      return conversation.recruiterName || 'Recruiter';
    }
  };

  const getConversationRole = (conversation: ChatConversation) => {
    if (user?.userType === 'recruiter') {
      return 'Job Seeker';
    } else {
      return 'Recruiter';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Get selected conversation data and partner ID for online status
  const selectedConversationData = conversations.find(c => c.id === selectedConversation);
  const conversationPartnerId = selectedConversationData 
    ? (selectedConversationData.recruiterId === user?.id ? selectedConversationData.jobSeekerId : selectedConversationData.recruiterId)
    : null;
  
  // Get online status for conversation partner
  const { data: partnerStatus } = useQuery<{ isOnline: boolean; lastActivity: string | null }>({
    queryKey: [`/api/user/status/${conversationPartnerId}`],
    enabled: !!conversationPartnerId,
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conversation => {
    const name = getConversationName(conversation).toLowerCase();
    const jobTitle = conversation.jobTitle?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return name.includes(query) || jobTitle.includes(query);
  });

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Conversations List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
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
              className="pl-10 bg-gray-50 border-gray-200"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          {conversationsLoading ? (
            <div className="p-4 text-center text-gray-500">Loading conversations...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchQuery ? 'No conversations match your search.' : 'No conversations yet.'}
            </div>
          ) : (
            <div className="p-2">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation.id)}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedConversation === conversation.id
                      ? 'bg-blue-50 border-l-4 border-blue-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <Avatar className="h-12 w-12 mr-3">
                    <AvatarFallback className="bg-blue-600 text-white">
                      {getInitials(getConversationName(conversation))}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 truncate">
                        {getConversationName(conversation)}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-600">
                        {getConversationRole(conversation)}
                      </p>
                      {conversation.unreadCount && conversation.unreadCount > 0 && (
                        <Badge className="bg-blue-600 text-white text-xs">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Click to view messages
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation && selectedConversationData ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-600 text-white">
                      {getInitials(getConversationName(selectedConversationData))}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {getConversationName(selectedConversationData)}
                    </h2>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-gray-600">
                        {getConversationRole(selectedConversationData)}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${partnerStatus?.isOnline ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                      <span className="text-gray-500">{partnerStatus?.isOnline ? 'Online' : 'Offline'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4 bg-gray-50">
              <div className="space-y-4">
                {conversationMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">No messages yet</p>
                    <p className="text-sm text-gray-400 mt-1">Start a conversation!</p>
                  </div>
                ) : (
                  conversationMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="flex max-w-xs lg:max-w-md">
                        {message.senderId !== user?.id && (
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarFallback className="bg-gray-400 text-white text-xs">
                              {getInitials(getConversationName(selectedConversationData))}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`rounded-lg p-3 ${
                            message.senderId === user?.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        >
                          <p className="text-sm">{message.message}</p>
                          <p className={`text-xs mt-1 ${
                            message.senderId === user?.id ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                  disabled={sendMessageMutation.isPending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Messages</h3>
              <p className="text-gray-600 mb-6">
                Select a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}