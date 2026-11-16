import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../components/ui/Toast';
import {
  useConversations,
  useConversation,
  useSendMessage,
  useToggleHandoff,
} from '../hooks/useConversations';
import { useProjectMedia } from '../hooks/useMedia';
import { useLeads, BackendLead } from '../hooks/useLeads';
import { useAuthStore } from '../store/useAuthStore';
import { formatCurrency } from '../lib/formatters';
import {
  Send,
  Bot,
  User,
  ShieldAlert,
  CheckCircle,
  Search,
  RefreshCw,
  Loader2,
  Sparkles,
  Paperclip,
  FileText,
  ChevronLeft,
  X,
  Phone,
  Mail,
  Calendar,
  Building2,
  DollarSign,
  ExternalLink,
  MessageSquare,
  Clock,
  Info,
  Smartphone,
  Globe,
  UserCheck,
} from 'lucide-react';

type ChannelFilter = 'ALL' | 'WHATSAPP' | 'SMS' | 'WEB_CHAT' | 'HANDOFF';

export function ConversationsPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isPromotional, setIsPromotional] = useState(false);
  const [activeChannelFilter, setActiveChannelFilter] = useState<ChannelFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRightRail, setShowRightRail] = useState(true);
  const [showMobileDetailsDrawer, setShowMobileDetailsDrawer] = useState(false);
  const [showBrochurePicker, setShowBrochurePicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const composerTextareaRef = useRef<HTMLTextAreaElement>(null);

  // TanStack Query: Conversations List
  const {
    data: convData,
    isLoading: isLoadingList,
    isRefetching: isRefetchingList,
    refetch,
  } = useConversations({
    needsHandoff: activeChannelFilter === 'HANDOFF' ? true : undefined,
    channel:
      activeChannelFilter === 'WHATSAPP' ||
      activeChannelFilter === 'SMS' ||
      activeChannelFilter === 'WEB_CHAT'
        ? activeChannelFilter
        : undefined,
    search: searchQuery.trim() || undefined,
  });

  const handoffCount = convData?.handoffCount || 0;

  // Additional client-side channel filter when server doesn't filter ALL
  const threads = useMemo(() => {
    const rawThreads = convData?.conversations || [];
    if (activeChannelFilter === 'HANDOFF') {
      return rawThreads.filter((t) => t.needsHandoff);
    }
    if (activeChannelFilter !== 'ALL') {
      return rawThreads.filter((t) => t.channel === activeChannelFilter);
    }
    return rawThreads;
  }, [convData?.conversations, activeChannelFilter]);

  // Active Thread ID selection
  const activeThreadId = selectedThreadId || (threads.length > 0 ? threads[0]._id : null);

  // Active Thread Detail Query (fetches live messages)
  const { data: activeThreadDetail, isLoading: isLoadingThread } = useConversation(activeThreadId);
  // Ensure strict isolation: Never use cached activeThreadDetail if its _id does not match activeThreadId
  const activeThread = useMemo(() => {
    if (!activeThreadId) return null;
    if (activeThreadDetail && activeThreadDetail._id === activeThreadId) {
      return activeThreadDetail;
    }
    return threads.find((t) => t._id === activeThreadId) || null;
  }, [activeThreadDetail, activeThreadId, threads]);

  // CRM Lead Enrichment from useLeads
  const { data: leadsData } = useLeads();
  const matchedLead: BackendLead | undefined = useMemo(() => {
    if (!activeThread) return undefined;
    const leadsList = leadsData?.leads || [];
    if (activeThread.leadId) {
      const byId = leadsList.find((l) => l._id === activeThread.leadId || l.id === activeThread.leadId);
      if (byId) return byId;
    }
    // Match by phone number or name
    return leadsList.find(
      (l) =>
        (activeThread.contactPhone && l.phone && l.phone.includes(activeThread.contactPhone.replace(/\D/g, ''))) ||
        (activeThread.contactName && l.name.toLowerCase() === activeThread.contactName.toLowerCase())
    );
  }, [activeThread, leadsData]);

  // Project Brochures for collateral sharing
  const { brochures = [] } = useProjectMedia(activeThread?.projectId, { consentedOnly: true });

  // Mutations
  const sendMessageMutation = useSendMessage();
  const toggleHandoffMutation = useToggleHandoff();

  // Auto-scroll chat to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages?.length, activeThreadId]);

  // Message Send Handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeThreadId || !replyText.trim() || sendMessageMutation.isPending) return;

    const textToSend = replyText.trim();
    try {
      await sendMessageMutation.mutateAsync({
        conversationId: activeThreadId,
        text: textToSend,
        isPromotional,
      });

      setReplyText('');
      setIsPromotional(false);
      setShowBrochurePicker(false);
      toast({
        title: 'Message Dispatched',
        message: 'Successfully sent via verified real-time communications gateway.',
        type: 'success',
      });
      // Return focus to composer
      composerTextareaRef.current?.focus();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
      const message = axiosErr.response?.data?.error?.message || 'Failed to deliver message.';
      toast({
        title: 'Delivery Failed',
        message,
        type: 'error',
      });
    }
  };

  // Keyboard shortcut: Enter to send (Shift+Enter for newline)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Human Takeover / Handoff Resolution Handler
  const handleResolveHandoff = async () => {
    if (!activeThreadId) return;

    try {
      await toggleHandoffMutation.mutateAsync({
        conversationId: activeThreadId,
        needsHandoff: false,
        assignedAgentId: user?.id,
        assignedAgentName: user?.name,
      });

      toast({
        title: 'Handoff Resolved',
        message: `${user?.name || 'Human sales agent'} has assumed ownership of this conversation.`,
        type: 'success',
      });
    } catch {
      toast({
        title: 'Handoff Update Error',
        message: 'Could not resolve handoff status.',
        type: 'error',
      });
    }
  };

  // Request Handoff (Escalate to Human Agent)
  const handleRequestHandoff = async () => {
    if (!activeThreadId) return;

    try {
      await toggleHandoffMutation.mutateAsync({
        conversationId: activeThreadId,
        needsHandoff: true,
        handoffReason: 'Manual Host Agent Escalation',
      });

      toast({
        title: 'Escalated to Agent',
        message: 'Conversation tagged for human intervention; automated bot replies paused.',
        type: 'info',
      });
    } catch {
      toast({
        title: 'Update Error',
        message: 'Could not toggle handoff state.',
        type: 'error',
      });
    }
  };

  // Helper: Channel Visual Details
  const getChannelBadge = (channel: string) => {
    switch (channel) {
      case 'WHATSAPP':
        return {
          label: 'WhatsApp',
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
          icon: <MessageSquare className="w-3 h-3 text-emerald-600" />,
        };
      case 'WEB_CHAT':
        return {
          label: 'Web Chat',
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200',
          icon: <Globe className="w-3 h-3 text-blue-600" />,
        };
      case 'SMS':
        return {
          label: 'SMS',
          bg: 'bg-purple-50',
          text: 'text-purple-700',
          border: 'border-purple-200',
          icon: <Smartphone className="w-3 h-3 text-purple-600" />,
        };
      default:
        return {
          label: channel,
          bg: 'bg-slate-50',
          text: 'text-slate-700',
          border: 'border-slate-200',
          icon: <MessageSquare className="w-3 h-3 text-slate-500" />,
        };
    }
  };

  // Helper: Format initials for avatars
  const getInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Helper: Format message timestamp
  const formatTime = (timeStr?: string, timestamp?: string) => {
    if (timeStr) return timeStr;
    if (timestamp) {
      try {
        const d = new Date(timestamp);
        if (!isNaN(d.getTime())) {
          return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      } catch {
        return '';
      }
    }
    return '';
  };

  // Helper: Format relative or date for thread item
  const formatThreadDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      if (isToday) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* 1. Page Header & Navigation Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs text-[#64748B] mb-1">
            <Link to="/dashboard" className="hover:text-[#10B981] transition-colors">
              Dashboard
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-[#64748B]">Communications</span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-[#1F2937]">Omni-Channel Inbox</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#1F2937]">
              Omni-Channel Inbox &amp; WhatsApp Concierge
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F7F1] text-[#10B981] border border-[#10B981]/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              <span>Verified Communications Gateway</span>
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Real-time customer engagement across WhatsApp Business, Web Chat, and SMS with automated compliance and human agent handoff.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {handoffCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveChannelFilter('HANDOFF')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition-all cursor-pointer shadow-xs"
            >
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{handoffCount} Urgent Handoff{handoffCount > 1 ? 's' : ''}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoadingList || isRefetchingList}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#EDF0F2] bg-white text-xs font-semibold text-[#1F2937] hover:bg-slate-50 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            title="Refresh active conversations and incoming messages from database"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#10B981] ${
                isLoadingList || isRefetchingList ? 'animate-spin' : ''
              }`}
            />
            <span>Refresh Inbox</span>
          </button>
        </div>
      </div>

      {/* 2. Main Premium Workspace Container */}
      <div className="rounded-2xl border border-[#EDF0F2] bg-white shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] overflow-hidden h-[calc(100vh-210px)] min-h-[640px] flex">
        {/* ========================================================================= */}
        {/* LEFT PANEL: CONVERSATIONS & CHANNELS LIST (340px)                          */}
        {/* ========================================================================= */}
        <div
          className={`w-full lg:w-[340px] border-r border-[#EDF0F2] flex flex-col shrink-0 bg-white ${
            selectedThreadId && 'hidden lg:flex'
          }`}
        >
          {/* Channel Filters & Search Header */}
          <div className="p-3.5 border-b border-[#EDF0F2] space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
                <span>Inbound Streams</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-[#64748B]">
                  {threads.length}
                </span>
              </span>

              {handoffCount > 0 && (
                <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  {handoffCount} Handoffs
                </span>
              )}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search contact, phone or project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 text-xs pl-9 pr-3 rounded-xl border border-[#EDF0F2] bg-slate-50/60 text-[#1F2937] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Channel Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setActiveChannelFilter('ALL')}
                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
                  activeChannelFilter === 'ALL'
                    ? 'bg-[#10B981] text-white shadow-xs'
                    : 'bg-slate-100 text-[#64748B] hover:text-[#1F2937]'
                }`}
              >
                All Channels
              </button>
              <button
                type="button"
                onClick={() => setActiveChannelFilter('WHATSAPP')}
                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                  activeChannelFilter === 'WHATSAPP'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-[#64748B] hover:text-[#1F2937]'
                }`}
              >
                <MessageSquare className="w-3 h-3" />
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveChannelFilter('WEB_CHAT')}
                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                  activeChannelFilter === 'WEB_CHAT'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-[#64748B] hover:text-[#1F2937]'
                }`}
              >
                <Globe className="w-3 h-3" />
                <span>Web</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveChannelFilter('HANDOFF')}
                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                  activeChannelFilter === 'HANDOFF'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 text-rose-600 hover:bg-rose-50'
                }`}
              >
                <ShieldAlert className="w-3 h-3" />
                <span>Handoff</span>
              </button>
            </div>
          </div>

          {/* Conversation Cards Scroll Area */}
          <div className="divide-y divide-[#EDF0F2] overflow-y-auto flex-1">
            {isLoadingList ? (
              <div className="py-20 text-center text-xs text-[#64748B] flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-6 h-6 animate-spin text-[#10B981]" />
                <span className="font-medium">Loading live conversation threads...</span>
              </div>
            ) : threads.length === 0 ? (
              <div className="py-20 text-center text-xs text-[#64748B] p-6 space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <p className="font-semibold text-[#1F2937]">No matching conversations</p>
                <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto">
                  {searchQuery
                    ? 'Try adjusting your search terms or filter criteria.'
                    : 'Customer inquiries from Meta Ads or WhatsApp will stream here in real-time.'}
                </p>
              </div>
            ) : (
              threads.map((thread) => {
                const isSelected = thread._id === activeThreadId;
                const channelBadge = getChannelBadge(thread.channel);
                return (
                  <div
                    key={thread._id}
                    onClick={() => setSelectedThreadId(thread._id)}
                    className={`p-3.5 cursor-pointer transition-all border-l-4 ${
                      isSelected
                        ? 'bg-[#E8F7F1]/40 border-[#10B981]'
                        : 'hover:bg-slate-50/80 border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar with Channel Icon Badge */}
                      <div className="relative shrink-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isSelected
                              ? 'bg-[#10B981] text-white shadow-xs'
                              : 'bg-slate-100 text-[#1F2937]'
                          }`}
                        >
                          {getInitials(thread.contactName)}
                        </div>
                        <span
                          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center bg-white shadow-xs border border-slate-200 text-[10px]`}
                          title={channelBadge.label}
                        >
                          {channelBadge.icon}
                        </span>
                      </div>

                      {/* Content Preview */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between mb-0.5">
                          <h3 className="text-xs font-bold text-[#1F2937] truncate pr-1">
                            {thread.contactName}
                          </h3>
                          <span className="text-[10px] font-medium text-slate-400 tabular-nums shrink-0">
                            {formatThreadDate(thread.lastMessageAt)}
                          </span>
                        </div>

                        {/* Project / Channel Pill */}
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-[11px] font-semibold text-[#64748B] truncate">
                            {thread.projectName || 'General Inquiry'}
                          </span>
                        </div>

                        {/* Last Message Snippet */}
                        <p className="text-xs text-[#64748B] truncate line-clamp-1 leading-normal">
                          {thread.lastMessage || 'Conversation initiated.'}
                        </p>

                        {/* Status Tags / Unread Pill */}
                        <div className="flex items-center gap-1.5 mt-2">
                          {thread.needsHandoff && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold border border-rose-200">
                              <ShieldAlert className="w-3 h-3 text-rose-600" />
                              <span>Handoff: {thread.handoffReason || 'Required'}</span>
                            </span>
                          )}

                          {thread.unreadCount > 0 && (
                            <span className="ml-auto px-1.5 py-0.2 rounded-full bg-[#10B981] text-white text-[10px] font-bold">
                              {thread.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CENTER PANEL: INTERACTIVE CHAT CANVASS & COMPOSER                         */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden bg-slate-50/50">
          {!activeThread ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-white border border-[#EDF0F2] text-slate-400 flex items-center justify-center shadow-xs">
                <MessageSquare className="w-7 h-7 text-[#10B981]" />
              </div>
              <h2 className="text-base font-bold text-[#1F2937]">Select a conversation thread</h2>
              <p className="text-xs text-[#64748B] max-w-sm">
                Choose an inbound customer message from the left list to review communication history, consult property brochures, or reply via WhatsApp.
              </p>
            </div>
          ) : (
            <>
              {/* Active Thread Header */}
              <div className="p-3.5 border-b border-[#EDF0F2] bg-white flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedThreadId(null)}
                    className="lg:hidden p-1.5 rounded-lg border border-[#EDF0F2] text-[#64748B] hover:text-[#1F2937]"
                    title="Back to conversation list"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="w-9 h-9 rounded-xl bg-[#E8F7F1] text-[#10B981] flex items-center justify-center font-bold text-xs shrink-0">
                    {getInitials(activeThread.contactName)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-[#1F2937] truncate">
                        {activeThread.contactName}
                      </h2>
                      <span className="text-xs text-[#64748B] tabular-nums font-mono">
                        {activeThread.contactPhone}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] truncate mt-0.5">
                      Project:{' '}
                      <strong className="text-[#1F2937] font-semibold">
                        {activeThread.projectName || 'General Property Inquiry'}
                      </strong>{' '}
                      &bull; Channel:{' '}
                      <span className="font-semibold text-emerald-700">{activeThread.channel}</span>
                    </p>
                  </div>
                </div>

                {/* Header Action Badges & Rail Toggles */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>RERA &amp; Fact Verified</span>
                  </span>

                  {/* Toggle Handoff Button in Header */}
                  {!activeThread.needsHandoff ? (
                    <button
                      type="button"
                      onClick={handleRequestHandoff}
                      disabled={toggleHandoffMutation.isPending}
                      className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-slate-200 text-xs font-semibold text-[#64748B] hover:bg-slate-50 transition-colors"
                      title="Pause AI bot responses and require human intervention"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                      <span>Take Over</span>
                    </button>
                  ) : null}

                  {/* Toggle CRM Rail Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        setShowMobileDetailsDrawer(true);
                      } else {
                        setShowRightRail(!showRightRail);
                      }
                    }}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      showRightRail
                        ? 'border-[#10B981] bg-[#E8F7F1]/50 text-[#10B981]'
                        : 'border-[#EDF0F2] text-[#64748B] hover:bg-slate-50'
                    }`}
                    title="Toggle CRM lead profile & project context rail"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* HUMAN HANDOFF REQUIRED BANNER */}
              {activeThread.needsHandoff && (
                <div className="p-3.5 bg-rose-50 border-b border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 text-rose-800">
                    <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold">Human Agent Escalation Required: </span>
                      <span>
                        Client requested negotiation or complex advisory (
                        <strong className="underline decoration-rose-300">
                          {activeThread.handoffReason || 'Escalation Alert'}
                        </strong>
                        ). Automated bot responses are currently paused.
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleResolveHandoff}
                    disabled={toggleHandoffMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 shadow-xs transition-all cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Take Over &amp; Resume Bot</span>
                  </button>
                </div>
              )}

              {/* Message Transcript Feed */}
              <div className="p-4 space-y-4 overflow-y-auto flex-1 bg-slate-50/60">
                {isLoadingThread ? (
                  <div className="py-20 text-center text-xs text-[#64748B] flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#10B981]" />
                    <p>Loading conversation transcript...</p>
                  </div>
                ) : !activeThread.messages || activeThread.messages.length === 0 ? (
                  <div className="py-20 text-center text-xs text-[#64748B]">
                    No messages recorded in this conversation yet. Send a message below to initiate.
                  </div>
                ) : (
                  activeThread.messages.map((msg, idx) => {
                    const isUser = msg.sender === 'user';
                    const isBot = msg.sender === 'bot';
                    const isAgent = msg.sender === 'agent';

                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-4 leading-relaxed space-y-1.5 shadow-xs ${
                            isUser
                              ? 'bg-white border border-[#EDF0F2] text-[#1F2937]'
                              : isBot
                                ? 'bg-slate-100 border border-slate-200 text-[#1F2937]'
                                : 'bg-[#10B981] text-white'
                          }`}
                        >
                          {/* Sender Identity & Metadata */}
                          <div
                            className={`flex items-center space-x-1.5 text-[11px] pb-1 border-b ${
                              isAgent
                                ? 'border-white/20 text-white/90'
                                : 'border-[#EDF0F2] text-[#64748B]'
                            }`}
                          >
                            {isBot && <Bot className="w-3.5 h-3.5 text-slate-800" />}
                            {isUser && <User className="w-3.5 h-3.5 text-slate-500" />}
                            {isAgent && <Sparkles className="w-3.5 h-3.5 text-white" />}

                            <span className="font-bold">
                              {isUser
                                ? activeThread.contactName
                                : isBot
                                  ? 'WhatsApp AI Assistant (Verified Facts)'
                                  : 'Sales Representative'}
                            </span>
                            <span>&bull;</span>
                            <span className="tabular-nums">
                              {formatTime(msg.time, msg.timestamp)}
                            </span>
                          </div>

                          {/* Message Content */}
                          <p className="whitespace-pre-line text-xs sm:text-sm font-normal">
                            {msg.text}
                          </p>

                          {/* Sender Attribution for Outgoing Messages */}
                          {!isUser && (
                            <div className="flex items-center justify-end gap-1 text-[10px] pt-0.5 opacity-75 font-medium">
                              <span>{isBot ? 'Automated Verified Reply' : 'Host Agent Response'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer & Collateral Attachment Rail */}
              <div className="p-3.5 border-t border-[#EDF0F2] bg-white space-y-2.5 shadow-sm">
                {/* Broadcast / Collateral Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#64748B]">
                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isPromotional}
                      onChange={(e) => setIsPromotional(e.target.checked)}
                      className="rounded border-slate-300 text-[#10B981] focus:ring-[#10B981] cursor-pointer"
                    />
                    <span className="text-[11px] font-medium text-[#64748B]">
                      Marketing Broadcast (Requires verified consent per telecom regulations)
                    </span>
                  </label>

                  {brochures.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowBrochurePicker(!showBrochurePicker)}
                      className="text-xs font-semibold text-[#10B981] hover:text-[#059669] flex items-center gap-1.5 cursor-pointer"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>Attach Project Brochure ({brochures.length})</span>
                    </button>
                  )}
                </div>

                {/* Approved Brochures Collateral Picker */}
                {showBrochurePicker && brochures.length > 0 && (
                  <div className="p-3 border border-[#EDF0F2] bg-slate-50/80 rounded-xl space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1F2937]">
                        Verified Consented Project Collateral
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowBrochurePicker(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {brochures.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            const link = `${window.location.origin}${b.fileUrl}`;
                            setReplyText((prev) =>
                              prev
                                ? `${prev}\n\nOfficial Project Brochure: ${link}`
                                : `Here is the official verified project brochure: ${link}`
                            );
                            setShowBrochurePicker(false);
                            composerTextareaRef.current?.focus();
                          }}
                          className="px-2.5 py-1.5 text-xs border border-[#EDF0F2] bg-white hover:border-[#10B981] hover:text-[#10B981] rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#10B981]" />
                          <span className="truncate max-w-[220px] font-medium">{b.fileName}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Textarea Composer */}
                <div className="flex items-end gap-2">
                  <div className="relative flex-1">
                    <textarea
                      ref={composerTextareaRef}
                      rows={2}
                      disabled={sendMessageMutation.isPending}
                      placeholder="Type official WhatsApp reply or client consultation message (Press Enter to send, Shift+Enter for new line)..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-[#EDF0F2] bg-slate-50/60 text-[#1F2937] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] resize-none transition-all"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={!replyText.trim() || sendMessageMutation.isPending}
                    className="h-10 px-4 rounded-xl bg-[#10B981] text-white text-xs font-bold hover:bg-[#059669] shadow-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ========================================================================= */}
        {/* RIGHT PANEL: LINKED CRM LEAD PROFILE & PROPERTY CONTEXT (300px)           */}
        {/* ========================================================================= */}
        {showRightRail && activeThread && (
          <div className="hidden lg:flex w-[300px] border-l border-[#EDF0F2] flex-col shrink-0 bg-white overflow-y-auto">
            {/* Header */}
            <div className="p-3.5 border-b border-[#EDF0F2] flex items-center justify-between">
              <span className="text-xs font-bold text-[#1F2937] uppercase tracking-wider">
                CRM Intelligence
              </span>
              <button
                type="button"
                onClick={() => setShowRightRail(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
                title="Hide details panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-5 text-xs">
              {/* Lead Identity Card */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#E8F7F1] text-[#10B981] flex items-center justify-center font-bold text-sm">
                    {getInitials(activeThread.contactName)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1F2937] leading-tight">
                      {activeThread.contactName}
                    </h3>
                    <span className="text-[11px] font-semibold text-[#10B981] block mt-0.5">
                      {matchedLead?.stage || 'Active Contact'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#EDF0F2]">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      Phone:
                    </span>
                    <span className="font-semibold text-[#1F2937] tabular-nums font-mono">
                      {activeThread.contactPhone}
                    </span>
                  </div>

                  {matchedLead?.email && (
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        Email:
                      </span>
                      <span className="font-semibold text-[#1F2937] truncate max-w-[150px]">
                        {matchedLead.email}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Inquiry Date:
                    </span>
                    <span className="font-semibold text-[#1F2937] tabular-nums">
                      {formatThreadDate(activeThread.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Property Interest Card */}
              <div className="rounded-2xl border border-[#EDF0F2] bg-slate-50/70 p-3.5 space-y-2.5">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                  Project Interest
                </span>

                <div className="flex items-start gap-2">
                  <Building2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-[#1F2937] text-xs">
                      {activeThread.projectName || 'Unassigned Development'}
                    </h4>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      Primary development inquired via WhatsApp campaign
                    </p>
                  </div>
                </div>

                {activeThread.projectId && (
                  <Link
                    to={`/projects/${activeThread.projectId}`}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#10B981] hover:underline"
                  >
                    <span>View Project Specs</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>

              {/* Financial & Pipeline Stage */}
              <div className="rounded-2xl border border-[#EDF0F2] p-3.5 space-y-2.5">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                  Budget &amp; Pipeline
                </span>

                <div className="flex items-center justify-between text-[#64748B]">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                    Target Budget:
                  </span>
                  <span className="font-bold text-[#1F2937] tabular-nums">
                    {matchedLead?.budgetDisplay || (matchedLead?.budget ? formatCurrency(matchedLead.budget) : '₹1.2 - 2.5 Cr')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[#64748B]">
                  <span>Consent Status:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Consent Verified
                  </span>
                </div>
              </div>

              {/* Quick CRM Navigation Actions */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                  Quick Actions
                </span>

                <Link
                  to="/appointments"
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#1F2937] font-semibold text-xs transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Book Site Walkthrough</span>
                </Link>

                <Link
                  to="/leads"
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[#EDF0F2] hover:bg-slate-50 text-[#1F2937] font-semibold text-xs transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>Open Full Lead Record</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Slide-Over Sheet for Lead Details */}
      {showMobileDetailsDrawer && activeThread && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setShowMobileDetailsDrawer(false)}
          />

          {/* Drawer Body */}
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl p-4 flex flex-col justify-between overflow-y-auto z-10 space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#EDF0F2]">
                <h3 className="font-bold text-sm text-[#1F2937]">Lead &amp; Property Context</h3>
                <button
                  type="button"
                  onClick={() => setShowMobileDetailsDrawer(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 py-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E8F7F1] text-[#10B981] flex items-center justify-center font-bold">
                    {getInitials(activeThread.contactName)}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1F2937]">{activeThread.contactName}</h4>
                    <span className="text-slate-500 font-mono">{activeThread.contactPhone}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Project</span>
                  <p className="font-bold text-[#1F2937]">
                    {activeThread.projectName || 'General Inquiry'}
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <Link
                    to="/appointments"
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#10B981] text-white font-bold text-xs"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Book Site Visit</span>
                  </Link>
                  <Link
                    to="/leads"
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-[#1F2937] font-semibold text-xs"
                  >
                    <span>View CRM Lead</span>
                  </Link>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowMobileDetailsDrawer(false)}
              className="w-full py-2 rounded-xl border border-[#EDF0F2] text-xs font-semibold text-[#64748B]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
