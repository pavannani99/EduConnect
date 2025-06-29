"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { ChatBubbleLeftEllipsisIcon, PaperAirplaneIcon, UserGroupIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  sender: User;
  classroomId: string;
  createdAt: string;
}

interface Classroom {
  id: string;
  name: string;
  // Add other classroom properties as needed, e.g., 'type' for DM vs Group
}

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const [conversations, setConversations] = useState<Classroom[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Fetch user's classrooms (conversations)
  useEffect(() => {
    if (session?.user?.id) {
      const fetchConversations = async () => {
        setIsLoadingConversations(true);
        try {
          // Assuming you have an endpoint to get classrooms for the current user
          // This might be /api/classrooms?userId=session.user.id or similar
          // For now, let's use the existing /api/classrooms which lists all,
          // ideally this should be filtered by membership.
          // We will also need a way to distinguish DMs from group chats.
          const res = await fetch('/api/classrooms'); // Adjust if you have a user-specific classroom endpoint
          if (!res.ok) throw new Error('Failed to fetch conversations');
          const data: Classroom[] = await res.json();

          // Filter classrooms where the current user is a member.
          // This logic should ideally be on the backend.
          // For now, we assume the /api/classrooms endpoint returns only relevant classrooms
          // or that we'd fetch memberships separately.
          // For this example, we'll just use the fetched list.
          setConversations(data);
          if (data.length > 0 && !selectedConversationId) {
            setSelectedConversationId(data[0].id);
          }
        } catch (error) {
          console.error("Error fetching conversations:", error);
          // Handle error (e.g., show toast notification)
        } finally {
          setIsLoadingConversations(false);
        }
      };
      fetchConversations();
    }
  }, [session]);

  // Fetch messages for the selected conversation
  useEffect(() => {
    if (selectedConversationId && session?.user?.id) {
      const fetchMessages = async () => {
        setIsLoadingMessages(true);
        try {
          const res = await fetch(`/api/messages/${selectedConversationId}`);
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to fetch messages');
          }
          const data: Message[] = await res.json();
          setMessages(data);
        } catch (error) {
          console.error("Error fetching messages:", error);
          setMessages([]); // Clear messages on error or if chat is empty
        } finally {
          setIsLoadingMessages(false);
        }
      };
      fetchMessages();

      // Implement polling for new messages (basic real-time update)
      // For a production app, use WebSockets (e.g., Pusher, Ably, Socket.io)
      const intervalId = setInterval(fetchMessages, 5000); // Poll every 5 seconds
      return () => clearInterval(intervalId); // Cleanup on component unmount or convo change
    } else {
      setMessages([]); // Clear messages if no conversation is selected
    }
  }, [selectedConversationId, session]);


  if (status === "loading") {
    return <div className="flex justify-center items-center h-screen">Loading session...</div>;
  }

  if (!session) {
    redirect('/auth/login');
    return null;
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversationId) return;

    try {
      const res = await fetch(`/api/messages/${selectedConversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageInput }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to send message');
      }
      const newMessage: Message = await res.json();
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setMessageInput('');
    } catch (error) {
      console.error("Error sending message:", error);
      // Handle error (e.g., show toast notification)
    }
  };

  const selectedConversationName = conversations.find(c => c.id === selectedConversationId)?.name || 'Select a chat';

  return (
    <div className="flex h-[calc(100vh-4rem)]"> {/* Adjust height if you have a global header */}
      {/* Conversation List Sidebar */}
      <div className="w-1/3 lg:w-1/4 border-r border-gray-300 bg-gray-50 overflow-y-auto">
        <div className="p-4 border-b border-gray-300 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Chats</h2>
          {/* Placeholder for new chat/group button */}
        </div>
        {isLoadingConversations ? (
          <div className="p-4 text-center text-gray-500">Loading chats...</div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No conversations yet.</div>
        ) : (
          <ul>
            {conversations.map((convo) => (
              <li
                key={convo.id}
                className={`p-3 hover:bg-gray-200 cursor-pointer ${
                  selectedConversationId === convo.id ? 'bg-blue-100 border-l-4 border-blue-500' : ''
                }`}
                onClick={() => setSelectedConversationId(convo.id)}
              >
                <div className="flex items-center">
                  {/* Assuming all are group chats for now based on Classroom model */}
                  <UserGroupIcon className="h-5 w-5 mr-2 text-gray-600" />
                  <span className="font-medium text-sm truncate">{convo.name}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Message Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedConversationId ? (
          <>
            {/* Message Header */}
            <div className="p-3 border-b border-gray-300 bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-semibold">{selectedConversationName}</h3>
              {/* Placeholder for conversation actions */}
            </div>

            {/* Messages Display */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              {isLoadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <ArrowPathIcon className="h-8 w-8 text-gray-500 animate-spin" />
                  <span className="ml-2 text-gray-500">Loading messages...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-10">
                  No messages yet. Send the first one!
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === session.user.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl px-3 py-2 rounded-lg shadow-sm ${
                        msg.senderId === session.user.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      <p className="text-sm font-medium mb-0.5">
                        {msg.senderId !== session.user.id ? msg.sender.name : ""}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.senderId === session.user.id ? 'text-blue-200 text-right' : 'text-gray-500 text-left'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-3 border-t border-gray-300 bg-gray-50">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoadingMessages || !selectedConversationId}
                />
                <button
                  type="submit"
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 flex items-center justify-center"
                  disabled={!messageInput.trim() || isLoadingMessages || !selectedConversationId}
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            {isLoadingConversations ? (
                 <ArrowPathIcon className="h-12 w-12 text-gray-400 animate-spin mb-4" />
            ) : (
                <ChatBubbleLeftEllipsisIcon className="h-16 w-16 text-gray-400 mb-4" />
            )}
            <p className="text-lg">
              {isLoadingConversations ? 'Loading chats...' : conversations.length > 0 ? 'Select a conversation to start messaging' : 'No active chats. Join or create a classroom to begin.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
