import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export type MessageSender = 'user' | 'agent' | 'bot';

export interface ConversationMessage {
  id: string;
  sender: MessageSender;
  text: string;
  time: string;
  timestamp: string;
}

export interface BackendConversation {
  _id: string;
  id?: string;
  organizationId: string;
  leadId?: string;
  projectId?: string;
  projectName?: string;
  contactName: string;
  contactPhone: string;
  channel: 'WHATSAPP' | 'SMS' | 'WEB_CHAT';
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  needsHandoff: boolean;
  handoffReason?: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  messages: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationFilters {
  needsHandoff?: boolean;
  channel?: 'WHATSAPP' | 'SMS' | 'WEB_CHAT';
  search?: string;
  page?: number;
  limit?: number;
}

export interface ConversationsListResponse {
  conversations: BackendConversation[];
  total: number;
  handoffCount: number;
}

export function useConversations(filters: ConversationFilters = {}) {
  return useQuery({
    queryKey: ['conversations', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.needsHandoff !== undefined) {
        params.append('needsHandoff', String(filters.needsHandoff));
      }
      if (filters.channel) params.append('channel', filters.channel);
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));

      const res = await api.get<{ success: boolean; data: ConversationsListResponse }>(
        `/conversations?${params.toString()}`
      );
      return res.data.data;
    },
  });
}

export function useConversation(id?: string | null) {
  return useQuery({
    queryKey: ['conversation', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.get<{ success: boolean; data: BackendConversation }>(
        `/conversations/${id}`
      );
      return res.data.data;
    },
    enabled: Boolean(id),
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      text,
      isPromotional = false,
    }: {
      conversationId: string;
      text: string;
      isPromotional?: boolean;
    }) => {
      const res = await api.post<{ success: boolean; data: BackendConversation }>(
        `/conversations/${conversationId}/messages`,
        { text, isPromotional }
      );
      return res.data.data;
    },
    onSuccess: (updatedConv) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', updatedConv._id] });
    },
  });
}

export function useToggleHandoff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      needsHandoff,
      handoffReason,
      assignedAgentId,
      assignedAgentName,
    }: {
      conversationId: string;
      needsHandoff: boolean;
      handoffReason?: string;
      assignedAgentId?: string;
      assignedAgentName?: string;
    }) => {
      const res = await api.patch<{ success: boolean; data: BackendConversation }>(
        `/conversations/${conversationId}/handoff`,
        { needsHandoff, handoffReason, assignedAgentId, assignedAgentName }
      );
      return res.data.data;
    },
    onSuccess: (updatedConv) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', updatedConv._id] });
    },
  });
}
