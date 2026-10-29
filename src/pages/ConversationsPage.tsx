import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { useToast } from '../components/ui/Toast';
import {
  useConversations,
  useConversation,
  useSendMessage,
  useToggleHandoff,
} from '../hooks/useConversations';
import { useProjectMedia } from '../hooks/useMedia';
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
} from 'lucide-react';

export function ConversationsPage() {
  const { toast } = useToast();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isPromotional, setIsPromotional] = useState(false);
  const [filterHandoffOnly, setFilterHandoffOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: convData, isLoading: isLoadingList, refetch } = useConversations({
    needsHandoff: filterHandoffOnly ? true : undefined,
    search: searchQuery.trim() || undefined,
  });

  const threads = convData?.conversations || [];
  const handoffCount = convData?.handoffCount || 0;

  // Auto-select first thread if none selected
  const activeThreadId = selectedThreadId || (threads.length > 0 ? threads[0]._id : null);
  const { data: activeThreadDetail, isLoading: isLoadingThread } = useConversation(activeThreadId);

  const sendMessageMutation = useSendMessage();
  const toggleHandoffMutation = useToggleHandoff();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThreadId || !replyText.trim()) return;

    try {
      await sendMessageMutation.mutateAsync({
        conversationId: activeThreadId,
        text: replyText.trim(),
        isPromotional,
      });

      setReplyText('');
      setIsPromotional(false);
      toast({
        title: 'WhatsApp Message Sent',
        message: 'Dispatched response through verified WhatsApp Business adapter.',
        type: 'success',
      });
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

  const handleResolveHandoff = async () => {
    if (!activeThreadId) return;

    try {
      await toggleHandoffMutation.mutateAsync({
        conversationId: activeThreadId,
        needsHandoff: false,
      });

      toast({
        title: 'Handoff Resolved',
        message: 'Human agent has acknowledged and assumed ownership of this conversation.',
        type: 'success',
      });
    } catch {
      toast({
        title: 'Update Error',
        message: 'Could not resolve handoff status.',
        type: 'error',
      });
    }
  };

  const activeThread = activeThreadDetail || threads.find((t) => t._id === activeThreadId);
  const [showBrochurePicker, setShowBrochurePicker] = useState(false);
  const { brochures = [] } = useProjectMedia(activeThread?.projectId, { consentedOnly: true });

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="WhatsApp &amp; Conversations"
        description="Two-way customer conversations across WhatsApp Business with automated fact verification and human agent handoff."
        actions={
          <div className="flex items-center space-x-2">
            {handoffCount > 0 && (
              <span className="flex items-center gap-1.5 text-meta px-2.5 py-1 rounded-[6px] bg-status-danger-bg text-status-danger font-medium">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{handoffCount} Urgent Handoff{handoffCount > 1 ? 's' : ''}</span>
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoadingList ? 'animate-spin' : ''}`} />}
            >
              Sync
            </Button>
          </div>
        }
      />

      {/* Main Conversation Splitter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start h-[640px]">
        {/* Left Column: Threads List */}
        <div className="border border-border rounded-card bg-surface h-full flex flex-col overflow-hidden shadow-card">
          {/* List Header & Filters */}
          <div className="p-3 border-b border-border bg-surface space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-section font-semibold text-text-primary">
                Inbound Threads ({threads.length})
              </span>
              <button
                type="button"
                onClick={() => setFilterHandoffOnly(!filterHandoffOnly)}
                className={`text-meta px-2.5 py-1 rounded-[6px] border transition-all ${
                  filterHandoffOnly
                    ? 'bg-primary text-white font-medium border-primary'
                    : 'bg-surface text-text-secondary border-border hover:border-neutral-400'
                }`}
              >
                {filterHandoffOnly ? 'Showing Handoffs' : 'Filter Handoffs'}
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search contact, phone or project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 text-sm pl-8 pr-3 rounded-[6px] border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
              />
            </div>
          </div>

          {/* Threads Scroll Area */}
          <div className="divide-y divide-border overflow-y-auto flex-1">
            {isLoadingList ? (
              <div className="py-16 text-center text-meta text-text-muted flex flex-col items-center justify-center space-y-2">
                <Loader2 className="w-5 h-5 animate-spin text-text-secondary" />
                <span>Loading Threads...</span>
              </div>
            ) : threads.length === 0 ? (
              <div className="py-16 text-center text-meta text-text-muted p-4">
                No active conversations matching criteria.
              </div>
            ) : (
              threads.map((thread) => {
                const isSelected = thread._id === activeThreadId;
                return (
                  <div
                    key={thread._id}
                    onClick={() => setSelectedThreadId(thread._id)}
                    className={`p-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-surface-hover font-medium' : 'hover:bg-surface-hover'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-sm font-medium text-text-primary truncate pr-1">
                        {thread.contactName}
                      </h3>
                      <span className="text-meta text-text-muted tabular-nums shrink-0">
                        {new Date(thread.lastMessageAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mb-1">
                      <span className="text-meta text-text-secondary truncate">
                        {thread.projectName || 'Direct Inquiry'}
                      </span>
                      {thread.needsHandoff && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded-[4px] bg-status-danger-bg text-status-danger font-medium">
                          Handoff: {thread.handoffReason || 'Alert'}
                        </span>
                      )}
                    </div>

                    <p className="text-meta text-text-muted truncate">
                      {thread.lastMessage}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 2 Columns: Active Chat Thread */}
        <div className="lg:col-span-2 border border-border rounded-card bg-surface h-full flex flex-col justify-between overflow-hidden shadow-card">
          {!activeThread ? (
            <div className="h-full flex items-center justify-center text-meta text-text-muted">
              Select a conversation to view transcript.
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div className="p-3.5 border-b border-border bg-surface flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-text-primary">
                    {activeThread.contactName} ({activeThread.contactPhone})
                  </h2>
                  <p className="text-meta text-text-secondary mt-0.5 tabular-nums">
                    Project: {activeThread.projectName || 'General Inquiry'} &bull; Channel: {activeThread.channel}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-[4px] bg-neutral-100 text-text-secondary border border-border">
                    Verified Facts
                  </span>
                </div>
              </div>

              {/* HUMAN HANDOFF BANNER */}
              {activeThread.needsHandoff && (
                <div className="p-3 bg-status-danger-bg border-b border-border flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center space-x-2 text-status-danger">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <div>
                      <strong className="font-semibold">Human Handoff Required:</strong>{' '}
                      Client requested complex query ({activeThread.handoffReason || 'Escalation'}). Bot responses paused.
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleResolveHandoff}
                    disabled={toggleHandoffMutation.isPending}
                    leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                  >
                    Take Over Chat
                  </Button>
                </div>
              )}

              {/* Messages Feed */}
              <div className="p-4 space-y-3 overflow-y-auto flex-1 bg-page">
                {isLoadingThread ? (
                  <div className="py-12 text-center text-meta text-text-muted">
                    Loading Transcript...
                  </div>
                ) : (
                  activeThread.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender === 'user' ? 'justify-start' : 'justify-end'
                      }`}
                    >
                      <div
                        className={`max-w-[75%] p-3 text-sm rounded-card leading-relaxed space-y-1 ${
                          msg.sender === 'user'
                            ? 'bg-white border border-border text-text-primary shadow-xs'
                            : msg.sender === 'bot'
                              ? 'bg-neutral-100 border border-border text-text-primary'
                              : 'bg-primary text-white shadow-xs'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5 text-meta opacity-80 tabular-nums">
                          {msg.sender === 'bot' && <Bot className="w-3 h-3 text-text-primary" />}
                          {msg.sender === 'user' && <User className="w-3 h-3 text-text-secondary" />}
                          {msg.sender === 'agent' && <Sparkles className="w-3 h-3 text-white" />}
                          <span className="font-medium">
                            {msg.sender === 'user'
                              ? 'Client'
                              : msg.sender === 'bot'
                                ? 'WhatsApp AI Bot (Verified Facts)'
                                : 'Sales Representative'}
                          </span>
                          <span>&bull;</span>
                          <span>{msg.time}</span>
                        </div>

                        <p className="whitespace-pre-line text-sm">{msg.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Reply Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-3.5 border-t border-border bg-surface space-y-2.5"
              >
                <div className="flex items-center justify-between text-meta text-text-secondary">
                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isPromotional}
                      onChange={(e) => setIsPromotional(e.target.checked)}
                      className="rounded-[4px] border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-1"
                    />
                    <span>Mark as Marketing Broadcast (Requires Consent)</span>
                  </label>

                  {brochures.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowBrochurePicker(!showBrochurePicker)}
                      className="text-meta font-medium text-text-secondary hover:text-text-primary flex items-center gap-1 underline underline-offset-2"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>Attach Brochure ({brochures.length})</span>
                    </button>
                  )}
                </div>

                {showBrochurePicker && brochures.length > 0 && (
                  <div className="p-2.5 border border-border bg-surface-hover rounded-[8px] space-y-1.5">
                    <div className="text-meta font-medium text-text-secondary">
                      Approved Project Brochures
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {brochures.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            const link = `${window.location.origin}${b.fileUrl}`;
                            setReplyText((prev) =>
                              prev ? `${prev}\n\nProject Brochure: ${link}` : `Here is the official project brochure: ${link}`
                            );
                            setShowBrochurePicker(false);
                          }}
                          className="px-2.5 py-1 text-sm border border-border bg-surface hover:border-neutral-400 rounded-[6px] flex items-center gap-1.5 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-text-secondary" />
                          <span className="truncate max-w-[200px]">{b.fileName}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type official WhatsApp reply or client consultation message..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 h-10 px-3 text-sm rounded-[8px] border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={!replyText.trim() || sendMessageMutation.isPending}
                    leftIcon={<Send className="w-4 h-4" />}
                  >
                    Send
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
