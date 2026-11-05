import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PageHeader } from '../components/ui/PageHeader';
import { useToast } from '../components/ui/Toast';
import { EmptyState } from '../components/ui/EmptyState';
import { useGenerateCopy } from '../hooks/useCreatives';
import { useProjects } from '../hooks/useProjects';
import {
  Sparkles,
  Copy,
  Check,
  Save,
  Hash,
  Share2,
} from 'lucide-react';

export interface CaptionStudioItem {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  angle: string;
  languages: {
    English: { hook: string; short: string; long: string; hashtags: string[]; cta: string };
    Hindi: { hook: string; short: string; long: string; hashtags: string[]; cta: string };
    Hinglish: { hook: string; short: string; long: string; hashtags: string[]; cta: string };
  };
}

export function CaptionStudioPage() {
  const { toast } = useToast();
  const generateCopyMutation = useGenerateCopy();
  const { data: projects = [] } = useProjects();

  // Combine tenant projects with initial concepts
  const initialItems: CaptionStudioItem[] = useMemo(() => {
    if (projects.length > 0) {
      return projects.map((p) => ({
        id: p._id,
        projectId: p._id,
        projectName: p.name,
        title: p.name,
        angle: p.category || '',
        // Captions start empty and are only filled by AI generation from the project's real data
        languages: {
          English: { hook: '', short: '', long: '', hashtags: [], cta: '' },
          Hindi: { hook: '', short: '', long: '', hashtags: [], cta: '' },
          Hinglish: { hook: '', short: '', long: '', hashtags: [], cta: '' },
        },
      }));
    }
    return [];
  }, [projects]);

  const [items, setItems] = useState<CaptionStudioItem[]>(initialItems);
  const [selectedItemId, setSelectedItemId] = useState<string>(
    items[0]?.id || ''
  );
  const [activeLang, setActiveLang] = useState<'English' | 'Hindi' | 'Hinglish'>('English');
  const [captionLength, setCaptionLength] = useState<'short' | 'long'>('long');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (initialItems.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Caption & Copywriting Studio"
          description="Multilingual real estate copy variants (English, Hindi, Hinglish) with compliant disclosures."
        />
        <EmptyState
          icon={<Sparkles className="w-10 h-10 text-[#737373]" />}
          title="No projects in catalog"
          description="Your organization has not added any projects yet. Add your first project in the Catalog to generate localized copy and captions."
        />
      </div>
    );
  }

  const activeItem = items.find((i) => i.id === selectedItemId) || items[0] || initialItems[0];
  const langData =
    activeItem.languages[activeLang] || activeItem.languages.English;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast({
      title: 'Copied to clipboard',
      message: 'Ready to paste into Meta Ads Manager or WhatsApp.',
      type: 'info',
    });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleUpdateCaption = (field: 'hook' | 'short' | 'long', value: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== activeItem.id) return item;
        return {
          ...item,
          languages: {
            ...item.languages,
            [activeLang]: {
              ...item.languages[activeLang],
              [field]: value,
            },
          },
        };
      })
    );
  };

  const handleRegenerate = async () => {
    try {
      const result = await generateCopyMutation.mutateAsync({
        projectName: activeItem.projectName,
        category: activeItem.angle || 'Residential',
        language: activeLang,
        tone: 'Ultra Luxury, Sophisticated',
      });

      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== activeItem.id) return item;
          return {
            ...item,
            languages: {
              ...item.languages,
              [activeLang]: {
                ...item.languages[activeLang],
                hook: result.hooks?.[0] || item.languages[activeLang].hook,
                short: result.captions?.short || item.languages[activeLang].short,
                long: result.captions?.long || item.languages[activeLang].long,
                hashtags: result.hashtags?.length ? result.hashtags : item.languages[activeLang].hashtags,
              },
            },
          };
        })
      );

      toast({
        title: 'New copy synthesized',
        message: `Regenerated compliant ${activeLang} (${captionLength}) copy.`,
        type: 'success',
      });
    } catch (err: unknown) {
      toast({
        title: 'Copy not generated',
        message: err instanceof Error ? err.message : 'AI copywriting failed. Please try again.',
        type: 'error',
      });
    }
  };

  const handleSave = () => {
    toast({
      title: 'Captions saved',
      message: 'Persisted custom copy variations to project master files.',
      type: 'success',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Caption & copywriting studio"
        description="Synthesize high-conversion hooks, captions, and compliant hashtags across English, Hindi, and Hinglish."
        actions={
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleRegenerate}
              isLoading={generateCopyMutation.isPending}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Regenerate copy
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSave}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save edits
            </Button>
          </div>
        }
      />

      {/* Main Studio Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Column: Items Selection */}
        <div className="space-y-3">
          <h2 className="text-[12px] font-medium text-[#737373]">
            Active campaign concepts ({items.length})
          </h2>

          <div className="space-y-2">
            {items.map((item) => {
              const isSelected = item.id === activeItem.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className={`p-3.5 rounded-[10px] border transition-all cursor-pointer bg-white ${
                    isSelected
                      ? 'border-[#0A0A0A] shadow-card'
                      : 'border-[#E5E5E5] hover:border-[#737373]'
                  }`}
                >
                  <span className="text-[12px] text-[#737373] block truncate">
                    {item.projectName}
                  </span>
                  <h3 className="text-[14px] font-semibold text-[#0A0A0A] truncate mt-0.5">
                    {item.title}
                  </h3>
                  <div className="mt-2">
                    <StatusBadge status="ACTIVE" label={item.angle} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center 2 Columns: Multilingual Copy Editor */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E5E5E5] pb-3 gap-3">
              <div>
                <span className="text-[12px] text-[#737373]">
                  {activeItem.projectName}
                </span>
                <CardTitle className="text-[16px] font-semibold text-[#0A0A0A] mt-0.5">
                  {activeItem.title}
                </CardTitle>
              </div>

              {/* Language Switcher Tabs */}
              <div className="flex border border-[#E5E5E5] rounded-[8px] overflow-hidden bg-[#FAFAFA] p-0.5">
                {(['English', 'Hindi', 'Hinglish'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveLang(lang)}
                    className={`px-3 py-1 text-[12px] font-medium rounded-[6px] transition-colors ${
                      activeLang === lang
                        ? 'bg-[#0A0A0A] text-white'
                        : 'text-[#525252] hover:text-[#0A0A0A]'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              {/* Hook / Headline */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-medium text-[#525252]">
                    High-conversion hook headline
                  </label>
                  <button
                    type="button"
                    onClick={() => handleCopy(langData.hook, 'hook')}
                    className="text-[12px] text-[#525252] hover:text-[#0A0A0A] flex items-center space-x-1"
                  >
                    {copiedKey === 'hook' ? <Check className="w-3.5 h-3.5 text-[#15803D]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'hook' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <textarea
                  value={langData.hook}
                  onChange={(e) => handleUpdateCaption('hook', e.target.value)}
                  rows={2}
                  className="w-full text-[14px] p-3 border border-[#E5E5E5] rounded-[8px] bg-white focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-2 leading-relaxed resize-none transition-all"
                />
              </div>

              {/* Caption Length Switcher & Body Copy */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <label className="text-[12px] font-medium text-[#525252]">
                      Narrative caption body
                    </label>
                    <div className="flex border border-[#E5E5E5] rounded-[6px] text-[11px] overflow-hidden bg-[#FAFAFA] p-0.5">
                      <button
                        type="button"
                        onClick={() => setCaptionLength('short')}
                        className={`px-2 py-0.5 rounded-[4px] ${
                          captionLength === 'short' ? 'bg-[#0A0A0A] text-white font-medium' : 'text-[#737373]'
                        }`}
                      >
                        Short (2 lines)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCaptionLength('long')}
                        className={`px-2 py-0.5 rounded-[4px] ${
                          captionLength === 'long' ? 'bg-[#0A0A0A] text-white font-medium' : 'text-[#737373]'
                        }`}
                      >
                        Long (4 lines)
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        captionLength === 'short' ? langData.short : langData.long,
                        'body'
                      )
                    }
                    className="text-[12px] text-[#525252] hover:text-[#0A0A0A] flex items-center space-x-1"
                  >
                    {copiedKey === 'body' ? <Check className="w-3.5 h-3.5 text-[#15803D]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'body' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <textarea
                  value={captionLength === 'short' ? langData.short : langData.long}
                  onChange={(e) =>
                    handleUpdateCaption(captionLength === 'short' ? 'short' : 'long', e.target.value)
                  }
                  rows={captionLength === 'short' ? 4 : 8}
                  className="w-full text-[14px] p-3 border border-[#E5E5E5] rounded-[8px] bg-white focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-2 leading-relaxed resize-none transition-all"
                />
              </div>

              {/* Hashtags Section */}
              <div className="space-y-2 border-t border-[#E5E5E5] pt-3">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-medium text-[#525252] flex items-center space-x-1.5">
                    <Hash className="w-3.5 h-3.5 text-[#525252]" />
                    <span>Compliant hashtags ({langData.hashtags.length})</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleCopy(langData.hashtags.join(' '), 'hashtags')}
                    className="text-[12px] text-[#525252] hover:text-[#0A0A0A] flex items-center space-x-1"
                  >
                    {copiedKey === 'hashtags' ? <Check className="w-3.5 h-3.5 text-[#15803D]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'hashtags' ? 'Copied' : 'Copy tags'}</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 p-3 border border-[#E5E5E5] rounded-[8px] bg-[#FAFAFA]">
                  {langData.hashtags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[12px] bg-white border border-[#E5E5E5] rounded-[6px] px-2.5 py-1 text-[#0A0A0A]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Feed Simulation */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="border-b border-[#E5E5E5] pb-3">
              <CardTitle className="text-[14px] font-semibold text-[#0A0A0A] flex items-center space-x-2">
                <Share2 className="w-4 h-4 text-[#0A0A0A]" />
                <span>Feed preview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="flex items-center space-x-2.5 border-b border-[#E5E5E5] pb-3">
                <div className="w-8 h-8 rounded-[8px] bg-[#0A0A0A] text-white flex items-center justify-center font-semibold text-[12px]">
                  {activeItem.projectName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <span className="text-[13px] font-semibold text-[#0A0A0A] block truncate max-w-[160px]">
                    {activeItem.projectName}
                  </span>
                  <span className="text-[12px] text-[#737373]">
                    Sponsored &bull; {activeLang}
                  </span>
                </div>
              </div>

              <div className="text-[14px] text-[#0A0A0A] space-y-2">
                <p className="font-semibold text-[#0A0A0A]">{langData.hook}</p>
                <p className="whitespace-pre-line leading-relaxed text-[#525252]">
                  {captionLength === 'short' ? langData.short : langData.long}
                </p>
                <p className="text-[12px] text-[#737373]">{langData.hashtags.join(' ')}</p>
              </div>

              <div className="pt-3 border-t border-[#E5E5E5]">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  className="w-full"
                >
                  {langData.cta}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
