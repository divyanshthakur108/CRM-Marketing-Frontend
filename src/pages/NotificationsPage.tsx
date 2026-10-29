import { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';
import { formatDisplayDate } from '../lib/formatters';
import { api } from '../lib/api';
import {
  Check,
  AlertTriangle,
  UserCheck,
  Wallet,
  ShieldCheck,
  Bell,
} from 'lucide-react';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'RERA_COMPLIANCE' | 'LEAD_INBOUND' | 'BUDGET_ALERT' | 'SYSTEM';
  timestamp: string;
  read: boolean;
}

export function NotificationsPage() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ success: boolean; data: NotificationItem[] }>('/notifications')
      .then((res) => {
        if (res.data?.data) {
          setNotifications(res.data.data);
        }
      })
      .catch(() => {
        setNotifications([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast({
      title: 'All caught up',
      message: 'All notifications marked as read.',
      type: 'info',
    });
  };

  const handleToggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const getCategoryIcon = (cat: NotificationItem['category']) => {
    switch (cat) {
      case 'RERA_COMPLIANCE':
        return <ShieldCheck className="w-4 h-4 text-[#0A0A0A]" />;
      case 'LEAD_INBOUND':
        return <UserCheck className="w-4 h-4 text-[#15803D]" />;
      case 'BUDGET_ALERT':
        return <Wallet className="w-4 h-4 text-[#B45309]" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-[#737373]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Notifications & alerts"
        description="Operational alerts for compliance reviews, inbound buyer leads, and budget milestone thresholds."
        actions={
          notifications.length > 0 ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleMarkAllRead}
              leftIcon={<Check className="w-3.5 h-3.5" />}
            >
              Mark all read
            </Button>
          ) : undefined
        }
      />

      {/* Notifications Feed */}
      {isLoading ? (
        <div className="space-y-3">
          <div className="h-16 bg-white border border-[#E5E5E5] rounded-[10px] animate-pulse" />
          <div className="h-16 bg-white border border-[#E5E5E5] rounded-[10px] animate-pulse" />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-10 h-10 text-[#737373]" />}
          title="No notifications yet"
          description="Your workspace has no active notifications or pending alerts at this time."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => handleToggleRead(item.id)}
              className={`p-4 rounded-[10px] border transition-all cursor-pointer bg-white flex items-start justify-between gap-4 ${
                !item.read
                  ? 'border-[#0A0A0A] shadow-card'
                  : 'border-[#E5E5E5] hover:border-[#737373]'
              }`}
            >
              <div className="flex items-start space-x-3.5">
                <div className="p-2.5 bg-[#F5F5F5] rounded-[8px] mt-0.5">
                  {getCategoryIcon(item.category)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-[14px] font-semibold text-[#0A0A0A]">{item.title}</h3>
                    <StatusBadge
                      status="ACTIVE"
                      label={item.category.replace('_', ' ')}
                    />
                    {!item.read && (
                      <span className="w-2 h-2 bg-[#0A0A0A] inline-block rounded-full" />
                    )}
                  </div>

                  <p className="text-[14px] text-[#525252]">{item.message}</p>
                  <span className="text-[12px] text-[#737373] block tabular-nums">
                    {formatDisplayDate(item.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
