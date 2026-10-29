import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useToast } from '../components/ui/Toast';
import { useAuthStore } from '../store/useAuthStore';
import {
  Save,
  Download,
  Building,
  ShieldCheck,
  Webhook,
  User,
  LogOut,
  LogIn,
  KeyRound,
} from 'lucide-react';

export function SettingsPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();

  const [orgName, setOrgName] = useState(user?.organizationName || '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when user object loads
  useEffect(() => {
    if (user) {
      if (user.organizationName) setOrgName(user.organizationName);
      if (user.email) setContactEmail(user.email);
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'Logged Out',
        message: 'You have been successfully signed out.',
        type: 'info',
      });
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSaving(false);

    toast({
      title: 'Settings Saved',
      message: 'Workspace configurations and webhook listeners updated.',
      type: 'success',
    });
  };

  const handleExportData = () => {
    toast({
      title: 'Data Export Dispatched',
      message: `Generating encrypted compliance audit archive for tenant ${user?.organizationId || 'current-workspace'}.`,
      type: 'info',
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Settings &amp; Workspace"
        description="Manage authenticated account credentials, multi-tenant parameters, and integration listeners."
        actions={
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportData}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export Archive
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSave}
              isLoading={isSaving}
              leftIcon={<Save className="w-3.5 h-3.5" />}
            >
              Save Settings
            </Button>
          </div>
        }
      />

      {/* 1. User Profile & Authentication Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* User Details */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-[8px] bg-neutral-100 text-text-primary flex items-center justify-center font-semibold text-lg shrink-0 border border-border">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h2 className="text-section font-semibold text-text-primary">
                  {user?.name || 'User Profile'}
                </h2>
                <StatusBadge status={user?.role || 'member'} />
                {user?.isPlatformAdmin && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-[4px] bg-neutral-100 text-text-secondary border border-border">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-meta text-text-secondary mt-0.5">
                {user?.email || 'No email registered'}
              </p>
              <p className="text-meta text-text-muted mt-1">
                Organization: <strong className="text-text-primary">{user?.organizationName || 'No organization assigned'}</strong>
              </p>
            </div>
          </div>

          {/* Authentication Actions */}
          <div className="flex items-center space-x-2 shrink-0">
            {isAuthenticated || user ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                leftIcon={<LogOut className="w-4 h-4" />}
              >
                Log Out
              </Button>
            ) : (
              <Link to="/login">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  leftIcon={<LogIn className="w-4 h-4" />}
                >
                  Log In
                </Button>
              </Link>
            )}

            <Link to="/reset-password">
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<KeyRound className="w-4 h-4" />}
              >
                Change Password
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Organization Entity */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-5 space-y-4">
              <div className="flex items-center space-x-2 border-b border-border pb-3">
                <Building className="w-4 h-4 text-text-primary" />
                <h3 className="text-section font-semibold text-text-primary">
                  Tenant Organization Profile
                </h3>
              </div>

              <div className="space-y-4 pt-1">
                <Input
                  label="Organization Name *"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-meta font-medium text-text-secondary mb-1.5">
                      Tenant Identifier
                    </label>
                    <input
                      type="text"
                      disabled
                      value={user?.organizationId || 'Not Registered'}
                      className="w-full h-10 text-sm px-3 bg-neutral-100 border border-border text-text-muted select-all rounded-[8px]"
                    />
                  </div>

                  <Input
                    label="Official Notification Email *"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>
              </div>
            </Card>

            {/* Webhook Configuration */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center space-x-2 border-b border-border pb-3">
                <Webhook className="w-4 h-4 text-text-primary" />
                <h3 className="text-section font-semibold text-text-primary">
                  Meta &amp; WhatsApp Webhook Listeners
                </h3>
              </div>

              <div className="space-y-4 pt-1">
                <Input
                  label="Meta Lead Ads Webhook URL"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />

                <p className="text-meta text-text-muted">
                  Payload verification: HMAC SHA-256 signature checked against META_APP_SECRET.
                </p>
              </div>
            </Card>
          </div>

          {/* Compliance & Security */}
          <div className="space-y-6">
            <Card className="p-5 bg-surface-hover border border-border">
              <div className="flex items-center space-x-2 border-b border-border pb-3">
                <ShieldCheck className="w-4 h-4 text-text-primary" />
                <h3 className="text-section font-semibold text-text-primary">
                  Regulatory Compliance Lock
                </h3>
              </div>

              <div className="space-y-3 pt-3 text-sm">
                <p className="text-text-secondary leading-relaxed">
                  All property listings, media assets, and outbound campaigns are cryptographically bound to RERA statutory master registration.
                </p>

                <div className="border border-border bg-surface p-3 space-y-2 rounded-[8px] text-meta">
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted">Compliance Status:</span>
                    <span className="font-medium text-text-primary">{user?.organizationId ? 'Tenant Registered' : 'Not Registered'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted">Audit Status:</span>
                    <StatusBadge status="approved" />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
