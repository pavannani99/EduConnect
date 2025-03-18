'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Pusher from 'pusher-js';
import { format } from 'date-fns';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  createdAt: Date;
}

interface ChatComponentProps {
  classroomId: string;
}

export default function ChatComponent({ classroomId }: ChatComponentProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe(`classroom-${classroomId}`);
    channel.bind('new-message', (data: Message) => {
      setMessages((prev) => [...prev, data]);
    });

    // Fetch existing messages
    fetch(`/api/chat/${classroomId}/messages`)
      .then((res) => res.json())
      .then((data) => setMessages(data));

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [classroomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !session?.user) return;

    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage,
          classroomId,
          senderId: session.user.id,
          senderName: session.user.name,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">Class Chat</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex flex-col ${
              message.senderId === session?.user?.id ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.senderId === session?.user?.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100'
              }`}
            >
              <p className="text-sm font-semibold">{message.senderName}</p>
              <p>{message.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {format(new Date(message.createdAt), 'HH:mm')}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
} 