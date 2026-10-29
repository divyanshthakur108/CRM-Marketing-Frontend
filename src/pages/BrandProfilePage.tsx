import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { PageHeader } from '../components/ui/PageHeader';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import { useBrandProfile, useUpdateBrandProfile } from '../hooks/useBrand';
import {
  Palette,
  Check,
  Save,
  Building2,
  FileCheck,
  Languages,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export function BrandProfilePage() {
  const { toast } = useToast();
  const { data: brandProfile, isLoading, refetch } = useBrandProfile();
  const updateMutation = useUpdateBrandProfile();

  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [secondaryColor, setSecondaryColor] = useState('#525252');
  const [accentColor, setAccentColor] = useState('#D4AF37');
  const [tone, setTone] = useState('Authoritative & Sophisticated Luxury');
  const [languages, setLanguages] = useState<('English' | 'Hindi' | 'Hinglish')[]>(['English']);
  const [disclaimer, setDisclaimer] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [watermarkUrl, setWatermarkUrl] = useState('');

  // Sync state when real data loads from MongoDB
  useEffect(() => {
    if (brandProfile) {
      if (brandProfile.primaryColor) setPrimaryColor(brandProfile.primaryColor);
      if (brandProfile.secondaryColor) setSecondaryColor(brandProfile.secondaryColor);
      if (brandProfile.accentColor) setAccentColor(brandProfile.accentColor);
      if (brandProfile.tone) setTone(brandProfile.tone);
      if (brandProfile.languages && brandProfile.languages.length > 0) setLanguages(brandProfile.languages);
      if (brandProfile.disclaimer) setDisclaimer(brandProfile.disclaimer);
      if (brandProfile.logoUrl) setLogoUrl(brandProfile.logoUrl);
      if (brandProfile.watermarkUrl) setWatermarkUrl(brandProfile.watermarkUrl);
    }
  }, [brandProfile]);

  const toneOptions = [
    'Authoritative & Sophisticated Luxury',
    'Modern, Direct & Value-Focused',
    'High-Yield Investment & Institutional',
    'Warm, Family-Oriented & Community',
  ];

  const availableLanguages: ('English' | 'Hindi' | 'Hinglish')[] = [
    'English',
    'Hindi',
    'Hinglish',
  ];

  const handleToggleLanguage = (lang: 'English' | 'Hindi' | 'Hinglish') => {
    setLanguages((prev) => {
      const exists = prev.includes(lang);
      if (exists) {
        if (prev.length === 1) {
          toast({
            title: 'Language requirement',
            message: 'At least one marketing language must remain selected.',
            type: 'error',
          });
          return prev;
        }
        return prev.filter((l) => l !== lang);
      } else {
        return [...prev, lang];
      }
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync({
        primaryColor,
        secondaryColor,
        accentColor,
        tone,
        languages,
        disclaimer,
        logoUrl,
        watermarkUrl,
      });

      toast({
        title: 'Brand profile saved',
        message: 'Updated branding assets, color palette, and disclaimers.',
        type: 'success',
      });
    } catch (err: unknown) {
      toast({
        title: 'Save failed',
        message: err instanceof Error ? err.message : 'Could not save brand profile',
        type: 'error',
      });
    }
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
      {/* Header Bar */}
      <PageHeader
        title="Brand profile & identity kit"
        description="Define corporate design tokens, tone of voice, statutory disclosures, and multi-language parameters."
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
              variant="primary"
              size="sm"
              onClick={handleSave}
              isLoading={updateMutation.isPending}
              leftIcon={<Save className="w-3.5 h-3.5" />}
            >
              Save brand kit
            </Button>
          </div>
        }
      />

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Brand Basics & Identity */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Corporate Identity */}
            <Card>
              <CardHeader className="border-b border-[#E5E5E5] pb-3">
                <CardTitle className="text-[16px] font-semibold text-[#0A0A0A] flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-[#0A0A0A]" />
                  <span>1. Visual branding assets</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <Input
                  label="Master brand logo URL (High resolution vector or PNG)"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://domain.com/logo.png"
                />

                <Input
                  label="Watermark overlay URL (Optional PNG for ad composites)"
                  value={watermarkUrl}
                  onChange={(e) => setWatermarkUrl(e.target.value)}
                  placeholder="https://domain.com/watermark.png"
                />
              </CardContent>
            </Card>

            {/* 2. Color System & Design Tokens */}
            <Card>
              <CardHeader className="border-b border-[#E5E5E5] pb-3">
                <CardTitle className="text-[16px] font-semibold text-[#0A0A0A] flex items-center space-x-2">
                  <Palette className="w-4 h-4 text-[#0A0A0A]" />
                  <span>2. Design system &amp; color palette</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <p className="text-[13px] text-[#525252]">
                  Identity tokens applied across all AI-generated collateral, landing pages, and creative outputs.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  {/* Primary Color */}
                  <div className="border border-[#E5E5E5] rounded-[8px] p-3 space-y-2 bg-white">
                    <div
                      className="w-full h-12 rounded-[6px] border border-[#E5E5E5]"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <div>
                      <span className="text-[12px] font-medium text-[#525252] block">
                        Primary key
                      </span>
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-full text-[13px] border border-[#E5E5E5] rounded-[6px] p-1.5 mt-1 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
                      />
                    </div>
                  </div>

                  {/* Secondary Color */}
                  <div className="border border-[#E5E5E5] rounded-[8px] p-3 space-y-2 bg-white">
                    <div
                      className="w-full h-12 rounded-[6px] border border-[#E5E5E5]"
                      style={{ backgroundColor: secondaryColor }}
                    />
                    <div>
                      <span className="text-[12px] font-medium text-[#525252] block">
                        Secondary key
                      </span>
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-full text-[13px] border border-[#E5E5E5] rounded-[6px] p-1.5 mt-1 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
                      />
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div className="border border-[#E5E5E5] rounded-[8px] p-3 space-y-2 bg-white">
                    <div
                      className="w-full h-12 rounded-[6px] border border-[#E5E5E5]"
                      style={{ backgroundColor: accentColor }}
                    />
                    <div>
                      <span className="text-[12px] font-medium text-[#525252] block">
                        Accent / CTA
                      </span>
                      <input
                        type="text"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-full text-[13px] border border-[#E5E5E5] rounded-[6px] p-1.5 mt-1 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3. Tone of Voice & Language Engine */}
            <Card>
              <CardHeader className="border-b border-[#E5E5E5] pb-3">
                <CardTitle className="text-[16px] font-semibold text-[#0A0A0A] flex items-center space-x-2">
                  <Languages className="w-4 h-4 text-[#0A0A0A]" />
                  <span>3. AI copywriting tone &amp; languages</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div>
                  <label className="block text-[12px] font-medium text-[#525252] mb-1">
                    Editorial tone of voice
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {toneOptions.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTone(t)}
                        className={`p-3 text-[13px] rounded-[8px] text-left border flex items-center justify-between transition-colors ${
                          tone === t
                            ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white font-medium'
                            : 'border-[#E5E5E5] bg-white hover:border-[#737373] text-[#0A0A0A]'
                        }`}
                      >
                        <span>{t}</span>
                        {tone === t && <Check className="w-4 h-4 shrink-0 ml-1 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E5E5E5]">
                  <label className="block text-[12px] font-medium text-[#525252] mb-1">
                    Enabled marketing languages
                  </label>
                  <p className="text-[12px] text-[#737373] mb-2">
                    Select languages for automatic multilingual ad translations.
                  </p>
                  <div className="flex gap-2">
                    {availableLanguages.map((lang) => {
                      const isSelected = languages.includes(lang);
                      return (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => handleToggleLanguage(lang)}
                          className={`px-3.5 py-1.5 text-[13px] rounded-[8px] border transition-colors flex items-center space-x-1.5 ${
                            isSelected
                              ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white font-medium'
                              : 'border-[#E5E5E5] bg-white text-[#0A0A0A] hover:border-[#737373]'
                          }`}
                        >
                          <span>{lang}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Statutory & Disclaimers */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="border-b border-[#E5E5E5] pb-3">
                <CardTitle className="text-[16px] font-semibold text-[#0A0A0A] flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-[#0A0A0A]" />
                  <span>RERA disclaimers</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="block text-[12px] font-medium text-[#525252]">
                    Mandatory statutory disclaimer *
                  </label>
                  <p className="text-[12px] text-[#737373]">
                    Auto-injected into Meta primary text, brochures, and campaign footers.
                  </p>
                  <Textarea
                    rows={6}
                    value={disclaimer}
                    onChange={(e) => setDisclaimer(e.target.value)}
                    placeholder="All images and specifications are artistic impressions..."
                  />
                </div>

                <div className="border border-[#E5E5E5] rounded-[8px] p-3.5 bg-[#FAFAFA] text-[13px] text-[#525252] space-y-1">
                  <div className="flex items-center space-x-1.5 font-medium text-[#0A0A0A]">
                    <FileCheck className="w-4 h-4 text-[#0A0A0A]" />
                    <span>Real estate compliance guard</span>
                  </div>
                  <p>
                    All campaign creatives and copy strictly include state RERA disclaimers and artistic impression notices.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
