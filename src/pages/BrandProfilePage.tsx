import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import { useBrandProfile, useUpdateBrandProfile } from '../hooks/useBrand';
import { useAuthStore } from '../store/useAuthStore';
import { formatDisplayDate } from '../lib/formatters';
import {
  Palette,
  Check,
  Save,
  Building2,
  FileCheck,
  Languages,
  ShieldCheck,
  RefreshCw,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Image as ImageIcon,
  Eye,
  Sliders,
} from 'lucide-react';

// Real estate luxury palette presets
const PALETTE_PRESETS = [
  { name: 'Emerald Luxe', primary: '#064E3B', secondary: '#1F2937', accent: '#10B981' },
  { name: 'Onyx & Gold', primary: '#0A0A0A', secondary: '#525252', accent: '#D4AF37' },
  { name: 'Sovereign Navy', primary: '#0F172A', secondary: '#475569', accent: '#3B82F6' },
  { name: 'Imperial Bronze', primary: '#291807', secondary: '#4D3E35', accent: '#D97706' },
];

export function BrandProfilePage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { data: brandProfile, isLoading, refetch, isFetching } = useBrandProfile();
  const updateMutation = useUpdateBrandProfile();

  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [secondaryColor, setSecondaryColor] = useState('#525252');
  const [accentColor, setAccentColor] = useState('#D4AF37');
  const [tone, setTone] = useState('Authoritative & Sophisticated Luxury');
  const [languages, setLanguages] = useState<('English' | 'Hindi' | 'Hinglish')[]>(['English']);
  const [disclaimer, setDisclaimer] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [watermarkUrl, setWatermarkUrl] = useState('');

  // Image load error trackers for preview fallbacks
  const [logoLoadError, setLogoLoadError] = useState(false);

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

  // Reset logo error states when URLs change
  useEffect(() => {
    setLogoLoadError(false);
  }, [logoUrl]);

  // Unsaved changes detection
  const isDirty = useMemo(() => {
    if (!brandProfile) return false;
    const initialLanguages = brandProfile.languages || ['English'];
    const langsMatch =
      languages.length === initialLanguages.length &&
      languages.every((l) => initialLanguages.includes(l));

    return (
      primaryColor.toLowerCase() !== (brandProfile.primaryColor || '#000000').toLowerCase() ||
      secondaryColor.toLowerCase() !== (brandProfile.secondaryColor || '#525252').toLowerCase() ||
      accentColor.toLowerCase() !== (brandProfile.accentColor || '#D4AF37').toLowerCase() ||
      tone !== (brandProfile.tone || '') ||
      !langsMatch ||
      disclaimer !== (brandProfile.disclaimer || '') ||
      logoUrl !== (brandProfile.logoUrl || '') ||
      watermarkUrl !== (brandProfile.watermarkUrl || '')
    );
  }, [
    brandProfile,
    primaryColor,
    secondaryColor,
    accentColor,
    tone,
    languages,
    disclaimer,
    logoUrl,
    watermarkUrl,
  ]);

  // Warn before leaving if dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const toneOptions = [
    'Authoritative & Sophisticated Luxury',
    'Modern, Direct & Value-Focused',
    'High-Yield Investment & Institutional',
    'Warm, Family-Oriented & Community',
    'Ultra Luxury, Exclusive, Sophisticated',
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
            title: 'Language Requirement',
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

  const handleApplyPreset = (preset: typeof PALETTE_PRESETS[0]) => {
    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
    setAccentColor(preset.accent);
    toast({
      title: 'Preset Applied',
      message: `Applied ${preset.name} palette tokens.`,
      type: 'info',
    });
  };

  const handleReset = () => {
    if (brandProfile) {
      setPrimaryColor(brandProfile.primaryColor || '#000000');
      setSecondaryColor(brandProfile.secondaryColor || '#525252');
      setAccentColor(brandProfile.accentColor || '#D4AF37');
      setTone(brandProfile.tone || 'Authoritative & Sophisticated Luxury');
      setLanguages(brandProfile.languages || ['English']);
      setDisclaimer(brandProfile.disclaimer || '');
      setLogoUrl(brandProfile.logoUrl || '');
      setWatermarkUrl(brandProfile.watermarkUrl || '');
      toast({
        title: 'Changes Reverted',
        message: 'Reverted all fields to saved server profile.',
        type: 'info',
      });
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (updateMutation.isPending) return;

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
        title: 'Brand Profile Saved',
        message: 'Updated branding assets, color palette, and disclaimers.',
        type: 'success',
      });
    } catch (err: unknown) {
      toast({
        title: 'Save Failed',
        message: err instanceof Error ? err.message : 'Could not save brand profile',
        type: 'error',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <Skeleton className="h-56 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/dashboard" className="hover:text-slate-900 transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <Link to="/settings" className="hover:text-slate-900 transition-colors">
          Settings
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="text-slate-900 font-medium">Brand Identity</span>
      </nav>

      {/* 2. Sticky Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Brand Identity &amp; Creative Guidelines
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                {user?.organizationName || 'Real Estate Enterprise'}
              </span>
              {isDirty && (
                <Badge variant="outline" className="border-amber-200 text-amber-800 bg-amber-50 text-xs">
                  Unsaved edits
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Configure corporate design tokens, tone of voice, logos, and statutory RERA disclaimers applied across AI creative engines.
            </p>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isFetching ? 'animate-spin' : ''}`} />}
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
            >
              Refresh
            </Button>
            {isDirty && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                leftIcon={<RotateCcw className="w-3.5 h-3.5 text-slate-600" />}
                className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
              >
                Revert
              </Button>
            )}
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => handleSave()}
              isLoading={updateMutation.isPending}
              leftIcon={<Save className="w-3.5 h-3.5" />}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
            >
              Save Brand Kit
            </Button>
          </div>
        </div>
      </div>

      {/* 3. Main Two-Column Layout */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: BRAND SETTINGS FORM (Col-span 8) */}
          <div className="lg:col-span-8 space-y-6">
            {/* SECTION 1: VISUAL BRANDING ASSETS */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">1. Visual Branding Assets</h2>
                    <p className="text-xs text-slate-500">Master enterprise logo and compositing watermark overlays.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Input
                  label="Master Brand Logo URL (Vector SVG or Transparent PNG)"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://storage.googleapis.com/.../master-logo.png"
                />

                <Input
                  label="Watermark Overlay URL (Optional transparent PNG for video & social overlays)"
                  value={watermarkUrl}
                  onChange={(e) => setWatermarkUrl(e.target.value)}
                  placeholder="https://storage.googleapis.com/.../watermark.png"
                />

                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/60 text-xs text-slate-600 flex items-start gap-2.5">
                  <ImageIcon className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Brand logos are automatically superimposed onto AI Video Lab reels, social banner creatives, and property collateral. Use a transparent background for optimal visual presentation.
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 2: COLOR SYSTEM & DESIGN TOKENS */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                    <Palette className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">2. Design System &amp; Color Palette</h2>
                    <p className="text-xs text-slate-500">Corporate color tokens applied across marketing creatives, banners, and landing pages.</p>
                  </div>
                </div>

                {/* Preset Palettes Quick Switch */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-semibold text-slate-400 mr-1">Presets:</span>
                  {PALETTE_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-medium text-slate-700 transition-colors flex items-center gap-1"
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.accent }} />
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3 Color Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Primary Color Card */}
                <div className="rounded-xl border border-slate-200/80 p-4 bg-white space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Primary Key
                    </span>
                    <span className="text-[11px] text-slate-400">Headlines &amp; Headers</span>
                  </div>
                  <div
                    className="w-full h-14 rounded-xl border border-slate-200 shadow-inner flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: primaryColor,
                      color: primaryColor.toLowerCase() === '#ffffff' ? '#000000' : '#ffffff',
                    }}
                  >
                    {primaryColor}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor.startsWith('#') && primaryColor.length === 7 ? primaryColor : '#000000'}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-slate-300 p-0.5 cursor-pointer shrink-0"
                      title="Pick primary color"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#000000"
                      className="w-full text-xs font-mono font-medium border border-slate-300 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Secondary Color Card */}
                <div className="rounded-xl border border-slate-200/80 p-4 bg-white space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Secondary Key
                    </span>
                    <span className="text-[11px] text-slate-400">Subtitles &amp; Borders</span>
                  </div>
                  <div
                    className="w-full h-14 rounded-xl border border-slate-200 shadow-inner flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: secondaryColor,
                      color: secondaryColor.toLowerCase() === '#ffffff' ? '#000000' : '#ffffff',
                    }}
                  >
                    {secondaryColor}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={secondaryColor.startsWith('#') && secondaryColor.length === 7 ? secondaryColor : '#525252'}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-slate-300 p-0.5 cursor-pointer shrink-0"
                      title="Pick secondary color"
                    />
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      placeholder="#525252"
                      className="w-full text-xs font-mono font-medium border border-slate-300 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Accent Color Card */}
                <div className="rounded-xl border border-slate-200/80 p-4 bg-white space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Accent / CTA
                    </span>
                    <span className="text-[11px] text-slate-400">Buttons &amp; Badges</span>
                  </div>
                  <div
                    className="w-full h-14 rounded-xl border border-slate-200 shadow-inner flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: accentColor,
                      color: accentColor.toLowerCase() === '#ffffff' ? '#000000' : '#ffffff',
                    }}
                  >
                    {accentColor}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={accentColor.startsWith('#') && accentColor.length === 7 ? accentColor : '#D4AF37'}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-slate-300 p-0.5 cursor-pointer shrink-0"
                      title="Pick accent color"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      placeholder="#D4AF37"
                      className="w-full text-xs font-mono font-medium border border-slate-300 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: TONE OF VOICE & MULTI-LANGUAGE ENGINE */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                  <Languages className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">3. AI Copywriting Tone &amp; Languages</h2>
                  <p className="text-xs text-slate-500">Defines editorial voice parameters and regional languages for AI copy generation.</p>
                </div>
              </div>

              {/* Tone Selection */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Editorial Tone of Voice
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {toneOptions.map((t) => {
                    const isSelected = tone === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTone(t)}
                        className={`p-3 text-xs rounded-xl text-left border flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/70 font-semibold text-emerald-950 shadow-sm ring-1 ring-emerald-500'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span>{t}</span>
                        {isSelected && <Check className="w-4 h-4 shrink-0 text-emerald-600 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Languages Selection */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Supported Marketing Languages
                  </label>
                  <span className="text-[11px] text-slate-400">At least 1 required</span>
                </div>
                <p className="text-xs text-slate-500">
                  Select languages available for multilingual ad captioning, WhatsApp broadcast dispatches, and campaign translations.
                </p>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {availableLanguages.map((lang) => {
                    const isSelected = languages.includes(lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => handleToggleLanguage(lang)}
                        className={`px-4 py-2 text-xs rounded-xl border transition-all flex items-center gap-2 font-medium cursor-pointer ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-600 text-white font-semibold shadow-sm'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span>{lang}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SECTION 4: MANDATORY STATUTORY RERA DISCLAIMERS */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">4. Statutory RERA Disclaimers</h2>
                  <p className="text-xs text-slate-500">Legal disclosure copy automatically appended to campaign creatives and ad copy.</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Default Legal Disclaimer *
                </label>
                <p className="text-xs text-slate-500">
                  Appended to Meta ad bodies, brochure collateral, landing page footers, and official correspondence.
                </p>
                <Textarea
                  rows={5}
                  value={disclaimer}
                  onChange={(e) => setDisclaimer(e.target.value)}
                  placeholder="All images and specifications are artistic impressions. Prices subject to change without prior notice. Subject to State RERA conditions."
                  className="rounded-xl border-slate-300 text-xs focus:ring-emerald-500/20 focus:border-emerald-500 font-sans leading-relaxed"
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2.5">
                <FileCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-slate-900">Statutory Advertising Guard Active</p>
                  <p className="leading-relaxed">
                    Under Indian Real Estate (Regulation and Development) Act guidelines, all public promotional material must contain official registration details and clear artistic impression notices to safeguard against regulatory non-compliance.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: LIVE BRAND KIT PREVIEW & AUDIT (Col-span 4) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            {/* BRAND KIT LIVE PREVIEW CARD */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Live Brand Kit Preview
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  Preview Only
                </span>
              </div>

              {/* Sample Collateral Card */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm space-y-4">
                {/* Header Strip with Primary Color */}
                <div
                  className="p-4 transition-colors"
                  style={{ backgroundColor: primaryColor }}
                >
                  <div className="flex items-center justify-between">
                    {/* Logo rendering with fallback */}
                    {logoUrl && !logoLoadError ? (
                      <img
                        src={logoUrl}
                        alt="Brand Logo"
                        className="h-9 max-w-[130px] object-contain"
                        onError={() => setLogoLoadError(true)}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white font-bold text-sm">
                          {(user?.organizationName || 'RC').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-sm text-white tracking-tight">
                          {user?.organizationName || 'RealCRM Brand'}
                        </span>
                      </div>
                    )}

                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: accentColor,
                        color: accentColor.toLowerCase() === '#ffffff' ? '#000000' : '#ffffff',
                      }}
                    >
                      Exclusive
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="px-4 pb-4 space-y-3">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                      Editorial Tone
                    </span>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">
                      {tone}
                    </p>
                  </div>

                  {/* Palette Swatches Bar */}
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Active Color Harmony
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="flex-1 h-6 rounded-md shadow-xs flex items-center justify-center text-[10px] font-mono font-bold text-white"
                        style={{ backgroundColor: primaryColor }}
                        title={`Primary: ${primaryColor}`}
                      >
                        P
                      </div>
                      <div
                        className="flex-1 h-6 rounded-md shadow-xs flex items-center justify-center text-[10px] font-mono font-bold text-white"
                        style={{ backgroundColor: secondaryColor }}
                        title={`Secondary: ${secondaryColor}`}
                      >
                        S
                      </div>
                      <div
                        className="flex-1 h-6 rounded-md shadow-xs flex items-center justify-center text-[10px] font-mono font-bold text-white"
                        style={{ backgroundColor: accentColor }}
                        title={`Accent: ${accentColor}`}
                      >
                        A
                      </div>
                    </div>
                  </div>

                  {/* Sample Mock CTA Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled
                      className="w-full py-2 px-3 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                      style={{
                        backgroundColor: accentColor,
                        color: accentColor.toLowerCase() === '#ffffff' ? '#000000' : '#ffffff',
                      }}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Explore Residences &rarr;</span>
                    </button>
                  </div>

                  {/* Sample Disclaimer Preview */}
                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                      Statutory Footnote Preview
                    </span>
                    <p className="text-[10px] text-slate-500 line-clamp-3 leading-relaxed italic">
                      {disclaimer || 'All images and specifications are artistic impressions...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* BRAND AUDIT SUMMARY CARD */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-emerald-600" />
                Guidelines Telemetry
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Languages Configured:</span>
                  <span className="font-bold text-slate-900">{languages.join(', ')}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Watermark Configured:</span>
                  <span className="font-bold text-slate-900">
                    {watermarkUrl ? 'Yes (Active)' : 'None'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Logo Specified:</span>
                  <span className="font-bold text-slate-900">
                    {logoUrl ? 'Yes' : 'Not set'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Last Profile Update:</span>
                  <span className="font-bold text-slate-900">
                    {brandProfile?.updatedAt ? formatDisplayDate(brandProfile.updatedAt) : 'Initial setup'}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => handleSave()}
                  isLoading={updateMutation.isPending}
                  leftIcon={<Save className="w-3.5 h-3.5" />}
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
                >
                  Save Brand Kit
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
