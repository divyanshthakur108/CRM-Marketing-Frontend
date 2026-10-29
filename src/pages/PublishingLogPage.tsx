import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';
import { formatDisplayDate, formatDisplayTime } from '../lib/formatters';
import { usePublishingLogs, useRetryPublishingLog, PublishingLogItem } from '../hooks/usePublishing';
import {
  Send,
  AlertTriangle,
  RotateCw,
  ExternalLink,
} from 'lucide-react';

export function PublishingLogPage() {
  const { toast } = useToast();
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const { data: logs = [], isLoading } = usePublishingLogs({ platform: platformFilter });
  const retryMutation = useRetryPublishingLog();
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const handleRetry = async (log: PublishingLogItem) => {
    setRetryingId(log._id);
    try {
      await retryMutation.mutateAsync(log._id);
      toast({
        title: 'Dispatch retried successfully',
        message: 'Payload for post re-sent to Meta Marketing API.',
        type: 'success',
      });
    } catch (err: unknown) {
      toast({
        title: 'Retry failed',
        message: err instanceof Error ? err.message : 'Could not retry publishing',
        type: 'error',
      });
    } finally {
      setRetryingId(null);
    }
  };

  const publishedCount = logs.filter((l) => l.status === 'PUBLISHED').length;
  const failedCount = logs.filter((l) => l.status === 'FAILED').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Publishing log & dispatch records"
        description="Delivery log of organic social broadcasts, paid ad deployments, and live post IDs."
        actions={
          <div className="flex items-center space-x-2">
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="text-[14px] px-3 py-2 border border-[#E5E5E5] rounded-[8px] bg-white text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-2 transition-all"
            >
              <option value="ALL">All networks ({logs.length})</option>
              <option value="FACEBOOK">Facebook feeds</option>
              <option value="INSTAGRAM">Instagram feeds &amp; reels</option>
            </select>
          </div>
        }
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 space-y-1">
            <span className="text-[12px] font-medium text-[#737373] block">
              Total dispatched assets
            </span>
            <div className="text-[24px] font-semibold text-[#0A0A0A] tabular-nums">{logs.length}</div>
            <span className="text-[12px] text-[#737373]">Live API posts</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-1">
            <span className="text-[12px] font-medium text-[#737373] block">
              Successfully published
            </span>
            <div className="text-[24px] font-semibold text-[#15803D] tabular-nums">{publishedCount}</div>
            <span className="text-[12px] text-[#737373]">Active on platforms</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-1">
            <span className="text-[12px] font-medium text-[#737373] block">
              Failed / retrying
            </span>
            <div className="text-[24px] font-semibold text-[#B91C1C] tabular-nums">{failedCount}</div>
            <span className="text-[12px] text-[#737373]">Requires intervention</span>
          </CardContent>
        </Card>
      </div>

      {/* Main Publishing Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[16px] font-semibold text-[#0A0A0A] flex items-center space-x-2">
            <Send className="w-4 h-4 text-[#0A0A0A]" />
            <span>Delivery log entries ({logs.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-8 text-center text-[14px] text-[#737373]">
              Loading delivery log entries...
            </div>
          ) : logs.length === 0 ? (
            <EmptyState
              icon={<Send className="w-10 h-10 text-[#737373]" />}
              title="No delivery records found"
              description="Approve a plan item with creative to trigger organic publishing."
            />
          ) : (
            <div className="border border-[#E5E5E5] rounded-[8px] overflow-x-auto bg-white">
              <table className="w-full text-left text-[14px] border-collapse">
                <thead>
                  <tr className="bg-[#FAFAFA] border-b border-[#E5E5E5] text-[12px] font-medium text-[#737373]">
                    <th className="p-3.5">Deliverable &amp; project</th>
                    <th className="p-3.5">Platform</th>
                    <th className="p-3.5">Post ID</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E5]">
                  {logs.map((item) => (
                    <tr
                      key={item._id}
                      className="hover:bg-[#F5F5F5] transition-colors"
                    >
                      <td className="p-3.5 max-w-xs">
                        <div className="space-y-1">
                          <span className="text-[12px] text-[#737373] block">
                            {item.projectId?.name || 'Project entity'}
                          </span>
                          <h4 className="font-medium text-[#0A0A0A] line-clamp-2">{item.caption}</h4>

                          {item.errorMessage && (
                            <div className="mt-2 p-2.5 bg-[#FEF2F2] text-[#B91C1C] rounded-[6px] text-[12px] flex items-start space-x-2 border border-[#FEE2E2]">
                              <AlertTriangle className="w-4 h-4 text-[#B91C1C] shrink-0 mt-0.5" />
                              <span>{item.errorMessage}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="text-[13px] font-medium text-[#0A0A0A]">
                          {item.platform}
                        </span>
                      </td>

                      <td className="p-3.5 text-[13px] text-[#525252]">
                        <div className="text-[12px] text-[#0A0A0A]">
                          {item.metaPostId ? (
                            <span className="font-mono">{item.metaPostId}</span>
                          ) : (
                            'Pending'
                          )}
                        </div>
                        {item.postUrl && (
                          <a
                            href={item.postUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[12px] text-[#525252] hover:text-[#0A0A0A] inline-flex items-center space-x-1 mt-0.5 transition-colors"
                          >
                            <span>Open URL</span>
                            <ExternalLink className="w-3 h-3 inline ml-0.5" />
                          </a>
                        )}
                      </td>

                      <td className="p-3.5">
                        <StatusBadge status={item.status} />
                      </td>

                      <td className="p-3.5 text-[12px] text-[#737373] tabular-nums">
                        {item.publishedAt ? `${formatDisplayDate(item.publishedAt)} · ${formatDisplayTime(item.publishedAt)}` : '—'}
                      </td>

                      <td className="p-3.5 text-right space-x-2">
                        {item.status === 'FAILED' ? (
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() => handleRetry(item)}
                            isLoading={retryingId === item._id}
                            leftIcon={<RotateCw className="w-3.5 h-3.5" />}
                          >
                            Retry dispatch
                          </Button>
                        ) : (
                          <span className="text-[12px] text-[#737373]">
                            Dispatched ({item.retryCount || 0} retries)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
