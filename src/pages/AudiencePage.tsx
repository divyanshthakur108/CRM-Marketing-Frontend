import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PageHeader } from '../components/ui/PageHeader';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import {
  useAudienceBriefs,
  useCreateAudienceBrief,
  useUpdateAudienceBrief,
} from '../hooks/useAudience';
import {
  Users,
  AlertTriangle,
  Plus,
  X,
  Save,
  MapPin,
  Check,
  RefreshCw,
} from 'lucide-react';

export function AudiencePage() {
  const { toast } = useToast();

  const { data: briefs = [], isLoading, refetch } = useAudienceBriefs();
  const createMutation = useCreateAudienceBrief();
  const updateMutation = useUpdateAudienceBrief();

  const [selectedBriefId, setSelectedBriefId] = useState<string>('');
  const [name, setName] = useState('');
  const [targetPersona, setTargetPersona] = useState('');
  const [incomeBracket, setIncomeBracket] = useState('');
  const [locations, setLocations] = useState<string[]>([]);
  const [keyAppeals, setKeyAppeals] = useState<string[]>([]);

  const [newLocationInput, setNewLocationInput] = useState('');
  const [newAppealInput, setNewAppealInput] = useState('');

  // Sync active brief
  useEffect(() => {
    if (briefs.length > 0) {
      const current = briefs.find((b) => b.id === selectedBriefId) || briefs[0];
      setSelectedBriefId(current.id!);
      setName(current.name || current.projectName || '');
      setTargetPersona(current.targetPersona || '');
      setIncomeBracket(current.incomeBracket || '');
      setLocations(current.locations || []);
      setKeyAppeals(current.keyAppealDrivers || current.interests || []);
    }
  }, [briefs, selectedBriefId]);

  const activeBrief = briefs.find((b) => b.id === selectedBriefId) || briefs[0];

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    const loc = newLocationInput.trim();
    if (loc && !locations.includes(loc)) {
      setLocations([...locations, loc]);
      setNewLocationInput('');
    }
  };

  const handleRemoveLocation = (loc: string) => {
    setLocations(locations.filter((l) => l !== loc));
  };

  const handleAddAppeal = (e: React.FormEvent) => {
    e.preventDefault();
    const app = newAppealInput.trim();
    if (app && !keyAppeals.includes(app)) {
      setKeyAppeals([...keyAppeals, app]);
      setNewAppealInput('');
    }
  };

  const handleRemoveAppeal = (app: string) => {
    setKeyAppeals(keyAppeals.filter((a) => a !== app));
  };

  const handleSaveBrief = async () => {
    if (!name.trim()) {
      toast({ title: 'Validation error', message: 'Brief name is required', type: 'error' });
      return;
    }

    try {
      if (activeBrief && activeBrief.id) {
        await updateMutation.mutateAsync({
          id: activeBrief.id,
          data: {
            name,
            targetPersona,
            incomeBracket,
            locations,
            interests: keyAppeals,
            housingAdPolicyAcknowledged: true,
          },
        });
        toast({
          title: 'Audience brief saved',
          message: `Targeting parameters for "${name}" updated.`,
          type: 'success',
        });
      } else {
        const created = await createMutation.mutateAsync({
          name,
          targetPersona,
          incomeBracket,
          locations,
          interests: keyAppeals,
          housingAdPolicyAcknowledged: true,
        });
        setSelectedBriefId(created.id!);
        toast({
          title: 'Audience brief created',
          message: `Created "${name}" targeting profile.`,
          type: 'success',
        });
      }
    } catch (err: unknown) {
      toast({
        title: 'Save failed',
        message: err instanceof Error ? err.message : 'Could not save audience brief',
        type: 'error',
      });
    }
  };

  const handleCreateNew = () => {
    setSelectedBriefId('');
    setName('New Buyer Persona Brief');
    setTargetPersona('Ultra HNIs, Family Offices, NRIs');
    setIncomeBracket('₹2.0 Cr+ Annual Income');
    setLocations(['Golf Course Road', 'DLF Phase 5']);
    setKeyAppeals(['High Capital Appreciation', 'Architectural Eminence']);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Audience briefs & targeting profiles"
        description="Configure project-specific buyer personas, geographic radiuses, and statutory compliance parameters."
        actions={
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCreateNew}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              New brief
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSaveBrief}
              isLoading={updateMutation.isPending || createMutation.isPending}
              leftIcon={<Save className="w-3.5 h-3.5" />}
            >
              Save brief
            </Button>
          </div>
        }
      />

      {/* STATUTORY HOUSING-AD TARGETING RESTRICTIONS WARNING BANNER */}
      <div className="border border-[#FEE2E2] bg-[#FEF2F2] rounded-[10px] p-4 relative">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-white border border-[#FEE2E2] rounded-[6px] shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-[#B91C1C]" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[14px] font-semibold text-[#B91C1C]">
                Statutory regulation: Housing advertisement targeting limitations
              </span>
              <StatusBadge status="FAILED" label="Regulatory enforcement" />
            </div>
            <p className="text-[13px] text-[#B91C1C] leading-relaxed">
              <strong>Fair Housing Act &amp; Ad Platform Policy:</strong> Real estate advertisements are strictly prohibited from targeting or excluding audiences on the basis of age, gender, parental status, marital status, religion, caste, national origin, or disability. RealCRM AI models enforce broad geographic interest targeting only.
            </p>
          </div>
        </div>
      </div>

      {/* Briefs Selector Tabs */}
      {briefs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {briefs.map((brief) => {
            const isSelected = brief.id === selectedBriefId;
            return (
              <button
                key={brief.id}
                type="button"
                onClick={() => setSelectedBriefId(brief.id!)}
                className={`p-3.5 text-left border rounded-[8px] transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#0A0A0A] bg-white shadow-card'
                    : 'border-[#E5E5E5] bg-white text-[#0A0A0A] hover:border-[#737373]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-[#0A0A0A]">{brief.name || brief.projectName}</span>
                  {isSelected && <Check className="w-4 h-4 text-[#0A0A0A]" />}
                </div>
                <p className="text-[12px] text-[#737373] mt-1 truncate">
                  {brief.targetPersona}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Brief Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Persona & Demographics */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="border-b border-[#E5E5E5] pb-3">
              <CardTitle className="text-[16px] font-semibold text-[#0A0A0A] flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#0A0A0A]" />
                <span>1. Ideal buyer profile &amp; demographics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <Input
                label="Target audience brief title *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. South Delhi & Gurugram HNIs"
              />

              <Input
                label="Primary target persona *"
                value={targetPersona}
                onChange={(e) => setTargetPersona(e.target.value)}
                placeholder="e.g. C-Suite Tech Executives, Founders, Specialized Consultants"
              />

              <Input
                label="Income bracket qualification"
                value={incomeBracket}
                onChange={(e) => setIncomeBracket(e.target.value)}
                placeholder="e.g. ₹1.5 Cr+ Annual Household Income"
              />
            </CardContent>
          </Card>

          {/* Key Appeal Drivers */}
          <Card>
            <CardHeader className="border-b border-[#E5E5E5] pb-3">
              <CardTitle className="text-[16px] font-semibold text-[#0A0A0A] flex items-center space-x-2">
                <span>2. Key appeal drivers &amp; value propositions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex flex-wrap gap-2 min-h-[36px] p-2.5 border border-[#E5E5E5] rounded-[8px] bg-[#FAFAFA]">
                {keyAppeals.map((app) => (
                  <span
                    key={app}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-[12px] bg-white border border-[#E5E5E5] rounded-[6px] text-[#0A0A0A] font-medium"
                  >
                    {app}
                    <button
                      type="button"
                      onClick={() => handleRemoveAppeal(app)}
                      className="text-[#737373] hover:text-[#0A0A0A] ml-1 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              <form onSubmit={handleAddAppeal} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add value proposition (e.g. 100% DG Power Backup)..."
                  value={newAppealInput}
                  onChange={(e) => setNewAppealInput(e.target.value)}
                  className="flex-1 p-2 text-[14px] border border-[#E5E5E5] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
                />
                <Button type="submit" variant="secondary" size="sm">
                  Add appeal
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Geography */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-[#E5E5E5] pb-3">
              <CardTitle className="text-[16px] font-semibold text-[#0A0A0A] flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-[#0A0A0A]" />
                <span>Target micro-markets</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex flex-wrap gap-1.5 min-h-[44px] p-2.5 border border-[#E5E5E5] rounded-[8px] bg-[#FAFAFA]">
                {locations.map((loc) => (
                  <span
                    key={loc}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] bg-white border border-[#E5E5E5] rounded-[6px] text-[#0A0A0A] font-medium"
                  >
                    {loc}
                    <button
                      type="button"
                      onClick={() => handleRemoveLocation(loc)}
                      className="text-[#737373] hover:text-[#0A0A0A] ml-1 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              <form onSubmit={handleAddLocation} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add location (e.g. DLF CyberCity)..."
                  value={newLocationInput}
                  onChange={(e) => setNewLocationInput(e.target.value)}
                  className="flex-1 p-2 text-[14px] border border-[#E5E5E5] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
                />
                <Button type="submit" variant="secondary" size="sm">
                  Add
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
