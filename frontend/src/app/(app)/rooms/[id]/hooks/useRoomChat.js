'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/Toast';

export function useRoomChat(roomIdOrCode) {
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const chatBottomRef = useRef(null);

  // Right Rail active tab: 'chat' | 'people'
  const [rightRailTab, setRightRailTab] = useState('chat');

  // Resizable Chat panel state
  const [chatWidth, setChatWidth] = useState(360);
  const [isDraggingSplitter, setIsDraggingSplitter] = useState(false);
  const [chatCollapsedManually, setChatCollapsedManually] = useState(false);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/rooms/${roomIdOrCode}/messages`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && json.data) {
        setMessages(json.data);
      }
    } catch (err) {}
  }, [roomIdOrCode]);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollTop = chatBottomRef.current.scrollHeight;
    }
  }, [messages]);

  // Draggable Splitter mouse listener for adjustable chat width
  const handleSplitterMouseDown = (e) => {
    e.preventDefault();
    setIsDraggingSplitter(true);
    const startX = e.clientX;
    const startWidth = chatWidth;

    const handleMouseMove = (moveEvent) => {
      const delta = startX - moveEvent.clientX; // dragging left increases chat width
      const newWidth = Math.max(260, Math.min(580, startWidth + delta));
      setChatWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDraggingSplitter(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Send message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || sendingMsg) return;

    const text = chatInput.trim();
    setChatInput('');
    setSendingMsg(true);

    try {
      const res = await apiFetch(`/api/rooms/${roomIdOrCode}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, type: 'CHAT' }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setMessages(prev => [...prev, json.data]);
      }
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setSendingMsg(false);
    }
  };

  return {
    messages,
    setMessages,
    chatInput,
    setChatInput,
    sendingMsg,
    chatBottomRef,
    rightRailTab,
    setRightRailTab,
    chatWidth,
    setChatWidth,
    isDraggingSplitter,
    chatCollapsedManually,
    setChatCollapsedManually,
    fetchMessages,
    handleSplitterMouseDown,
    handleSendMessage
  };
}
