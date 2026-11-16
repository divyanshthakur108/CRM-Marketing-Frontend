import { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';
import { useGenerateCopy } from '../hooks/useCreatives';
import { useProjects, BackendProject } from '../hooks/useProjects';
import {
  Sparkles,
  Copy,
  Check,
  Save,
  Share2,
  Search,
  Building2,
  Languages,
  Heart,
  MessageCircle,
  Bookmark,
  ArrowRight,
  SlidersHorizontal,
  Plus,
  X,
  MapPin,
  CheckCircle2,
  ChevronDown,
  ShieldCheck,
  Eye,
  Edit3,
  Layers,
  Clock,
  RotateCcw,
  FileText,
} from 'lucide-react';

export interface CaptionStudioItem {
  id: string;
  projectId: string;
  projectName: string;
  customPropertyName?: string;
  title: string;
  angle: string;
  category: string;
  city?: string;
  tone?: string;
  persona?: string;
  alternativeHooks?: {
    English: string[];
    Hindi: string[];
    Hinglish: string[];
  };
  languages: {
    English: { hook: string; short: string; long: string; hashtags: string[]; cta: string };
    Hindi: { hook: string; short: string; long: string; hashtags: string[]; cta: string };
    Hinglish: { hook: string; short: string; long: string; hashtags: string[]; cta: string };
  };
}

const TONE_OPTIONS = [
  'Ultra Luxury & Architectural Elegance',
  'Strategic Investment & Urban Connectivity',
  'Family Wellness & Sustainable Living',
  'Global NRI & Premium Asset Showcase',
];

const PERSONA_OPTIONS = [
  'High-Net-Worth Individuals (HNIs)',
  'Modern Aspiring First-Time Buyers',
  'Global NRI Real Estate Investors',
  'C-Suite Executives & Business Owners',
];

const CTA_OPTIONS = [
  'Schedule VIP Site Walkthrough',
  'Download Floor Plans & Pricing Sheet',
  'Chat with Senior Sales Director on WhatsApp',
  'Claim Exclusive Launch Privilege Rates',
];

function generateDefaultCopy(p: BackendProject): CaptionStudioItem['languages'] {
  const city = p.location?.city || p.city || 'Gurugram';
  const name = p.name || 'Prime Residences';
  const category = p.category || 'Luxury Residential';

  return {
    English: {
      hook: `Step into architectural magnificence at ${name} — ${city}'s definitive luxury address.`,
      short: `Bespoke 3 & 4 BHK ${category.toLowerCase()} residences with panoramic skyline balconies, private elevators, and world-class clubhouse amenities. Limited inventory released.`,
      long: `Experience the apex of refined urban living at ${name}. Designed for connoisseurs of fine architecture, these masterfully crafted residences feature expansive floor-to-ceiling windows, imported Italian marble finishes, temperature-controlled pools, and an exclusive 25,000 sq.ft. resident clubhouse.\n\nStrategically positioned in prime ${city} with swift connectivity to premier financial hubs, international schools, and luxury retail destinations.`,
      cta: 'Schedule VIP Site Walkthrough',
      hashtags: [
        '#LuxuryRealEstate',
        '#UltraLuxuryLiving',
        '#DreamHome',
        `#${city.replace(/\s+/g, '')}RealEstate`,
        '#PenthouseCollection',
        '#PrimeLocation',
        '#NewLaunch',
      ],
    },
    Hindi: {
      hook: `${name} में आपका स्वागत है — ${city} का सबसे प्रतिष्ठित और भव्य लग्जरी लाइफस्टाइल प्रोजेक्ट।`,
      short: `भव्य 3 और 4 BHK अल्ट्रा-लक्जरी अपार्टमेंट्स। प्राइवेट क्लब हाउस, विशाल बालकनी और 24x7 3-टियर सुरक्षा के साथ।`,
      long: `${name} में जीवन को दें एक नया स्तर। आधुनिक वास्तुकला, विशाल हरे-भरे परिदृश्य और विश्वस्तरीय सुख-सुविधाओं का अनूठा संगम।\n\nप्राइम ${city} में स्थित, बेहतरीन कनेक्टिविटी और विश्वसनीय बिल्डर की गारंटी। अपने परिवार के लिए आज ही चुने सपनों का आशियाना।`,
      cta: 'साइट विजिट बुक करें',
      hashtags: [
        '#रियलएस्टेट',
        '#लक्ज़रीघर',
        '#सपनोंकाघर',
        `#${city.replace(/\s+/g, '')}प्रॉपर्टी`,
        '#प्रीमियमलाइफस्टाइल',
      ],
    },
    Hinglish: {
      hook: `Upgrade your lifestyle to true prestige at ${name} — ${city} ka sabse iconic address!`,
      short: `Expansive residences with uninterrupted skyline views aur world-class amenities. Schedule your exclusive private tour today.`,
      long: `${name} me experience karein effortless luxury aur lush green serenity. Private high-speed elevators, infinity swimming pool, aur bespoke concierge services.\n\nPrime ${city} location with zero-delay highway access. Limited inventory remaining for discerning buyers!`,
      cta: 'Book Private Walkthrough',
      hashtags: [
        '#RealEstateIndia',
        '#LuxuryLiving',
        '#HinglishCopy',
        `#${city.replace(/\s+/g, '')}Homes`,
        '#PropertyGoals',
        '#SiteVisitOpen',
      ],
    },
  };
}

export function CaptionStudioPage() {
  const { toast } = useToast();
  const generateCopyMutation = useGenerateCopy();
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects();

  // Project search filter for selector
  const [searchTerm, setSearchTerm] = useState('');
  const [isPropertyMenuOpen, setIsPropertyMenuOpen] = useState(false);
  const propertyMenuRef = useRef<HTMLDivElement>(null);

  // Localized items pool (one per project)
  const [items, setItems] = useState<CaptionStudioItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [activeLang, setActiveLang] = useState<'English' | 'Hindi' | 'Hinglish'>('English');
  const [captionLength, setCaptionLength] = useState<'short' | 'long'>('long');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Per-project dirty tracking (truthful state)
  const [dirtyProjects, setDirtyProjects] = useState<Set<string>>(new Set());
  const [lastGeneratedAt, setLastGeneratedAt] = useState<Date | null>(null);

  // Marketing Positioning Config
  const [selectedTone, setSelectedTone] = useState(TONE_OPTIONS[0]);
  const [selectedPersona, setSelectedPersona] = useState(PERSONA_OPTIONS[0]);
  const [selectedCta, setSelectedCta] = useState(CTA_OPTIONS[0]);
  const [newHashtagInput, setNewHashtagInput] = useState('');

  // DOM Refs for interactive stepper navigation
  const briefPanelRef = useRef<HTMLDivElement>(null);
  const editorPanelRef = useRef<HTMLDivElement>(null);

  // Stepper Click Handler
  const handleStepClick = (stepNum: number) => {
    if (stepNum === 1) {
      setIsPropertyMenuOpen((prev) => !prev);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (stepNum === 2) {
      briefPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (stepNum === 3) {
      handleGenerate();
    } else if (stepNum === 4) {
      setActiveTab('editor');
      editorPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Close property selector popover on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (propertyMenuRef.current && !propertyMenuRef.current.contains(event.target as Node)) {
        setIsPropertyMenuOpen(false);
      }
    }
    if (isPropertyMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPropertyMenuOpen]);

  // Close property dropdown on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isPropertyMenuOpen) {
        setIsPropertyMenuOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPropertyMenuOpen]);

  // Initialize items from projects with localStorage persistence restore
  useEffect(() => {
    if (projects.length > 0) {
      setItems((prevItems) => {
        if (prevItems.length > 0) return prevItems;
        return projects.map((p) => {
          let savedCopy: CaptionStudioItem['languages'] | null = null;
          let savedCustomName: string | undefined;
          let savedHooks: CaptionStudioItem['alternativeHooks'] | undefined;
          try {
            const raw = localStorage.getItem(`realcrm_caption_draft_${p._id}`);
            if (raw) savedCopy = JSON.parse(raw);
            const custom = localStorage.getItem(`realcrm_caption_propname_${p._id}`);
            if (custom) savedCustomName = custom;
            const rawHooks = localStorage.getItem(`realcrm_caption_hooks_${p._id}`);
            if (rawHooks) savedHooks = JSON.parse(rawHooks);
          } catch {
            // fallback to default
          }

          const isPersonalName = (p.name || '').toLowerCase().includes('divyansh');
          const resolvedMarketingName = savedCustomName || (isPersonalName ? 'RS Heritage' : p.name);

          return {
            id: p._id,
            projectId: p._id,
            projectName: p.name,
            customPropertyName: savedCustomName || (isPersonalName ? 'RS Heritage' : undefined),
            title: `${resolvedMarketingName} Campaign Copy`,
            angle: p.category || 'Luxury Residential',
            category: p.category || 'RESIDENTIAL',
            city: p.location?.city || p.city || 'Chandigarh',
            tone: TONE_OPTIONS[0],
            persona: PERSONA_OPTIONS[0],
            alternativeHooks: savedHooks,
            languages: savedCopy || generateDefaultCopy({ ...p, name: resolvedMarketingName }),
          };
        });
      });

      setSelectedItemId((prev) => prev || projects[0]._id);
    }
  }, [projects]);

  // Filtered project list for search
  const filteredProjects = useMemo(() => {
    if (!searchTerm.trim()) return projects;
    const q = searchTerm.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.city && p.city.toLowerCase().includes(q)) ||
        (p.location?.city && p.location.city.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
    );
  }, [projects, searchTerm]);

  // Active Selected Item and Project
  const activeItem = useMemo(() => {
    return items.find((i) => i.id === selectedItemId) || items[0];
  }, [items, selectedItemId]);

  const activeProject = useMemo(() => {
    return projects.find((p) => p._id === activeItem?.projectId || p.id === activeItem?.projectId);
  }, [projects, activeItem?.projectId]);

  // Current language data
  const langData = useMemo(() => {
    if (!activeItem) {
      return { hook: '', short: '', long: '', hashtags: [], cta: '' };
    }
    return activeItem.languages[activeLang] || activeItem.languages.English || {
      hook: '',
      short: '',
      long: '',
      hashtags: [],
      cta: '',
    };
  }, [activeItem, activeLang]);

  // Sync selected CTA when language data updates
  useEffect(() => {
    if (langData.cta) {
      setSelectedCta(langData.cta);
    }
  }, [langData.cta]);

  // Whether active project has unsaved edits
  const isCurrentProjectDirty = useMemo(() => {
    return activeItem ? dirtyProjects.has(activeItem.id) : false;
  }, [activeItem, dirtyProjects]);

  // Safe clipboard handler with fallback
  const handleCopy = async (text: string, key: string, label: string = 'Copied to clipboard') => {
    if (!text) return;
    let succeeded = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        succeeded = true;
      }
    } catch {
      succeeded = false;
    }

    if (!succeeded) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        succeeded = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        succeeded = false;
      }
    }

    if (succeeded) {
      setCopiedKey(key);
      toast({
        title: label,
        message: 'Ready to paste into your marketing campaigns or social channels.',
        type: 'info',
      });
      setTimeout(() => setCopiedKey(null), 2000);
    } else {
      toast({
        title: 'Copy Notice',
        message: 'Please manually select and copy the text.',
        type: 'warning',
      });
    }
  };

  // Copy full composite caption
  const handleCopyFullCaption = () => {
    if (!langData) return;
    const mainBody = captionLength === 'short' ? langData.short : langData.long;
    const tagsString = (langData.hashtags || []).join(' ');
    const fullText = [
      langData.hook,
      mainBody,
      langData.cta ? `👉 ${langData.cta}` : '',
      tagsString,
    ]
      .filter(Boolean)
      .join('\n\n');

    handleCopy(fullText, 'full-caption', `Full ${activeLang} Caption Copied`);
  };

  // Field updates in memory with dirty state tracking
  const handleUpdateCaption = (
    field: 'hook' | 'short' | 'long' | 'cta',
    value: string
  ) => {
    if (!activeItem) return;
    setDirtyProjects((prev) => new Set(prev).add(activeItem.id));
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== activeItem.id) return item;
        const currentLang = item.languages[activeLang] || {
          hook: '',
          short: '',
          long: '',
          hashtags: [],
          cta: '',
        };
        return {
          ...item,
          languages: {
            ...item.languages,
            [activeLang]: {
              ...currentLang,
              [field]: value,
            },
          },
        };
      })
    );
  };

  // Add / Remove Hashtags
  const handleAddHashtag = () => {
    if (!newHashtagInput.trim() || !activeItem) return;
    let tag = newHashtagInput.trim();
    if (!tag.startsWith('#')) tag = `#${tag}`;
    tag = tag.replace(/\s+/g, '');

    const currentTags = langData.hashtags || [];
    if (!currentTags.includes(tag)) {
      const updated = [...currentTags, tag];
      setDirtyProjects((prev) => new Set(prev).add(activeItem.id));
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== activeItem.id) return item;
          return {
            ...item,
            languages: {
              ...item.languages,
              [activeLang]: {
                ...item.languages[activeLang],
                hashtags: updated,
              },
            },
          };
        })
      );
    }
    setNewHashtagInput('');
  };

  const handleRemoveHashtag = (tagToRemove: string) => {
    if (!activeItem) return;
    const updated = (langData.hashtags || []).filter((t) => t !== tagToRemove);
    setDirtyProjects((prev) => new Set(prev).add(activeItem.id));
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== activeItem.id) return item;
        return {
          ...item,
          languages: {
            ...item.languages,
            [activeLang]: {
              ...item.languages[activeLang],
              hashtags: updated,
            },
          },
        };
      })
    );
  };

  // Switch project safely without state cross-contamination
  const handleSelectProject = (projectId: string) => {
    if (projectId === activeItem?.id) {
      setIsPropertyMenuOpen(false);
      return;
    }

    if (isCurrentProjectDirty) {
      toast({
        title: 'Draft Preserved',
        message: `Your edits for ${activeItem?.projectName} have been preserved in memory.`,
        type: 'info',
      });
    }

    setSelectedItemId(projectId);
    setIsPropertyMenuOpen(false);
    setSearchTerm('');
  };

  // AI Generation Trigger
  const handleGenerate = async () => {
    if (!activeItem) return;
    try {
      const targetName = activeItem.customPropertyName?.trim() || activeItem.projectName;
      const result = await generateCopyMutation.mutateAsync({
        projectName: targetName,
        category: activeItem.angle || 'Residential',
        location: activeItem.city,
        language: activeLang,
        tone: selectedTone,
      });

      const resAny = result as Record<string, unknown>;
      const hooksList = Array.isArray(resAny?.hooks) ? (resAny.hooks as string[]) : [];
      const captionsObj = resAny?.captions as Record<string, string> | undefined;
      const hashtagsList = Array.isArray(resAny?.hashtags) ? (resAny.hashtags as string[]) : [];

      const newHook = hooksList[0] || (resAny?.hook as string) || langData.hook;
      const newShort = captionsObj?.short || (resAny?.short as string) || langData.short;
      const newLong = captionsObj?.long || (resAny?.long as string) || langData.long;
      const newHashtags = hashtagsList.length > 0 ? hashtagsList : langData.hashtags;
      const newCta = (resAny?.cta as string) || selectedCta || langData.cta;

      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== activeItem.id) return item;
          const updatedLangs = {
            ...item.languages,
            [activeLang]: {
              ...item.languages[activeLang],
              hook: newHook,
              short: newShort,
              long: newLong,
              hashtags: newHashtags,
              cta: newCta,
            },
          };
          const updatedHooks = {
            ...(item.alternativeHooks || { English: [], Hindi: [], Hinglish: [] }),
            [activeLang]: hooksList.length > 0 ? hooksList : [newHook],
          };

          // Save draft immediately to localStorage
          try {
            localStorage.setItem(
              `realcrm_caption_draft_${item.projectId}`,
              JSON.stringify(updatedLangs)
            );
            localStorage.setItem(
              `realcrm_caption_hooks_${item.projectId}`,
              JSON.stringify(updatedHooks)
            );
          } catch {
            // ignore
          }

          return {
            ...item,
            alternativeHooks: updatedHooks,
            languages: updatedLangs,
          };
        })
      );

      setLastGeneratedAt(new Date());
      setDirtyProjects((prev) => {
        const next = new Set(prev);
        next.delete(activeItem.id);
        return next;
      });

      toast({
        title: 'Caption Generated',
        message: `Created fresh ${activeLang} caption for "${targetName}" tuned for ${selectedTone}.`,
        type: 'success',
      });
    } catch (err: unknown) {
      toast({
        title: 'Generation Failed',
        message:
          err instanceof Error
            ? err.message
            : 'AI copywriting service temporarily unavailable. Please retry.',
        type: 'error',
      });
    }
  };

  // Reset to default template copy
  const handleResetToDefault = () => {
    if (!activeProject || !activeItem) return;
    const targetName = activeItem.customPropertyName?.trim() || activeProject.name;
    const defaults = generateDefaultCopy({ ...activeProject, name: targetName });
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== activeItem.id) return item;
        return {
          ...item,
          languages: defaults,
        };
      })
    );
    setDirtyProjects((prev) => {
      const next = new Set(prev);
      next.delete(activeItem.id);
      return next;
    });
    try {
      localStorage.removeItem(`realcrm_caption_draft_${activeItem.projectId}`);
      localStorage.removeItem(`realcrm_caption_hooks_${activeItem.projectId}`);
    } catch {
      // ignore
    }
    toast({
      title: 'Reset to Template',
      message: `Restored standard localized templates for ${targetName}.`,
      type: 'info',
    });
  };

  // Persist edits to state and localStorage truthfully
  const handleSave = () => {
    if (!activeItem) return;
    try {
      localStorage.setItem(
        `realcrm_caption_draft_${activeItem.projectId}`,
        JSON.stringify(activeItem.languages)
      );
      if (activeItem.customPropertyName) {
        localStorage.setItem(
          `realcrm_caption_propname_${activeItem.projectId}`,
          activeItem.customPropertyName
        );
      }
      if (activeItem.alternativeHooks) {
        localStorage.setItem(
          `realcrm_caption_hooks_${activeItem.projectId}`,
          JSON.stringify(activeItem.alternativeHooks)
        );
      }
    } catch {
      // storage unavailable
    }
    setDirtyProjects((prev) => {
      const next = new Set(prev);
      next.delete(activeItem.id);
      return next;
    });
    toast({
      title: 'Captions Saved',
      message: `Saved marketing copy draft for ${activeItem.customPropertyName || activeItem.projectName} (${activeLang}).`,
      type: 'success',
    });
  };

  // Loading Skeleton State
  if (isLoadingProjects) {
    return (
      <div className="space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse">
          <div className="space-y-2">
            <div className="h-4 w-48 bg-slate-200 rounded-md" />
            <div className="h-8 w-72 bg-slate-200 rounded-md" />
          </div>
          <div className="h-10 w-36 bg-slate-200 rounded-xl" />
        </div>
        <div className="h-16 bg-white border border-[#EDF0F2] rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
          <div className="h-[480px] bg-white border border-[#EDF0F2] rounded-2xl animate-pulse" />
          <div className="h-[640px] bg-white border border-[#EDF0F2] rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  // Catalog Empty State
  if (projects.length === 0) {
    return (
      <div className="space-y-6 pb-12">
        <div>
          <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs text-[#64748B] mb-1">
            <Link to="/dashboard" className="hover:text-[#10B981] transition-colors">
              Dashboard
            </Link>
            <span className="text-slate-300">/</span>
            <Link to="/studio" className="hover:text-[#10B981] transition-colors">
              Creative Studio
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-[#1F2937]">Caption Studio</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-[#1F2937]">
            AI Caption Studio
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Create, edit, and save marketing captions for your properties.
          </p>
        </div>

        <EmptyState
          icon={<Sparkles className="w-10 h-10 text-[#64748B]" />}
          title="No properties in catalog"
          description="Your organization has not added any real estate properties yet. Add your first property in the Catalog to generate marketing captions."
          action={
            <Link to="/projects/new">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#10B981] text-white text-xs font-semibold hover:bg-[#059669] shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Property</span>
              </button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* ========================================================================= */}
      {/* 1. COMPACT PAGE HEADER                                                    */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs text-[#64748B] mb-1">
            <Link to="/dashboard" className="hover:text-[#10B981] transition-colors">
              Dashboard
            </Link>
            <span className="text-slate-300">/</span>
            <Link to="/studio" className="hover:text-[#10B981] transition-colors">
              Creative Studio
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-[#1F2937]">Caption Studio</span>
          </nav>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#1F2937]">
              AI Caption Studio
            </h1>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Create, edit, and save marketing captions for your properties.
          </p>
        </div>

        {/* Global Action Header Controls */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Truthful Draft Status Badge */}
          <div className="flex items-center">
            {isCurrentProjectDirty ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Unsaved Edits</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Saved Locally</span>
              </span>
            )}
          </div>

          {/* Quick Copy Full Post */}
          <button
            type="button"
            onClick={handleCopyFullCaption}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#EDF0F2] bg-white text-xs font-semibold text-[#1F2937] hover:bg-slate-50 shadow-xs transition-all cursor-pointer"
            title="Copy composite post (Headline + Body + CTA + Hashtags)"
          >
            {copiedKey === 'full-caption' ? (
              <Check className="w-3.5 h-3.5 text-[#10B981]" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-[#64748B]" />
            )}
            <span>{copiedKey === 'full-caption' ? 'Copied' : 'Copy All'}</span>
          </button>

          {/* Save Draft Action */}
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#10B981] text-white text-xs font-semibold hover:bg-[#059669] shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            title="Persist current caption draft to local storage"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Caption</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. COMPACT PROPERTY SELECTOR TOP-BAR                                      */}
      {/* ========================================================================= */}
      <div className="rounded-2xl bg-white border border-[#EDF0F2] p-4 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Active Property Meta Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-[#E8F7F1] text-[#10B981] flex items-center justify-center shrink-0 border border-[#10B981]/20">
              <Building2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-[#1F2937] truncate">
                  {activeItem?.projectName || 'Select Property'}
                </span>
                <span className="text-[11px] font-semibold text-[#64748B] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#94A3B8]" />
                  <span>{activeItem?.city || 'Gurugram'}</span>
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-[#475569] uppercase tracking-wide">
                  {activeItem?.angle || 'Residential'}
                </span>
                <span className="text-slate-400 font-mono text-[10px]">
                  #{activeItem?.projectId.slice(-4)}
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                Active target property for multilingual marketing copywriting
              </p>
            </div>
          </div>

          {/* Searchable Dropdown Combobox */}
          <div className="relative shrink-0" ref={propertyMenuRef}>
            <button
              type="button"
              onClick={() => setIsPropertyMenuOpen((prev) => !prev)}
              aria-haspopup="listbox"
              aria-expanded={isPropertyMenuOpen}
              className="w-full sm:w-auto inline-flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl border border-[#EDF0F2] bg-slate-50/70 hover:bg-slate-100 text-xs font-semibold text-[#1F2937] shadow-xs transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <Search className="w-3.5 h-3.5 text-[#64748B]" />
                <span>Switch Property ({projects.length})</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-[#64748B] transition-transform duration-200 ${
                  isPropertyMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu Popover */}
            {isPropertyMenuOpen && (
              <div className="absolute right-0 left-0 sm:left-auto sm:w-80 mt-2 z-30 rounded-2xl bg-white border border-[#EDF0F2] shadow-xl p-3 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                {/* Search Field */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    autoFocus
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search properties by name or city..."
                    className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border border-[#EDF0F2] bg-slate-50 text-[#1F2937] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:bg-white transition-all"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Filtered List */}
                <div className="max-h-60 overflow-y-auto space-y-1 pr-1" role="listbox">
                  {filteredProjects.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#64748B]">
                      No properties found matching &quot;{searchTerm}&quot;
                    </div>
                  ) : (
                    filteredProjects.map((p) => {
                      const isSelected = p._id === activeItem?.projectId;
                      const city = p.location?.city || p.city || 'Gurugram';
                      return (
                        <button
                          key={p._id}
                          type="button"
                          onClick={() => handleSelectProject(p._id)}
                          role="option"
                          aria-selected={isSelected}
                          className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                            isSelected
                              ? 'bg-[#E8F7F1] text-[#10B981] font-bold'
                              : 'hover:bg-slate-50 text-[#1F2937]'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs truncate block">{p.name}</span>
                              {isSelected && (
                                <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-[#64748B] mt-0.5">
                              <span>{city}</span>
                              <span>&bull;</span>
                              <span className="uppercase text-[9px] font-semibold text-slate-500">
                                {p.category || 'RESIDENTIAL'}
                              </span>
                              <span className="text-slate-400 font-mono text-[9px]">
                                #{p._id.slice(-4)}
                              </span>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#10B981] shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DYNAMIC 4-STAGE WORKFLOW GUIDANCE (INTERACTIVE & CLICKABLE)            */}
      {/* ========================================================================= */}
      <div className="rounded-2xl bg-white border border-[#EDF0F2] p-3 sm:p-4 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
          {/* Stage 1: Property Selected */}
          <button
            type="button"
            onClick={() => handleStepClick(1)}
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#E8F7F1]/80 hover:bg-[#E8F7F1] border border-[#10B981]/30 text-left transition-all cursor-pointer group shadow-2xs"
            title="Click to switch property"
          >
            <div className="h-7 w-7 rounded-lg bg-[#10B981] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
              <Check className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider block leading-none">
                Step 1 &bull; Done
              </span>
              <span className="text-xs font-bold text-[#1F2937] truncate block mt-0.5 group-hover:text-[#10B981] transition-colors">
                {activeItem?.customPropertyName || activeItem?.projectName || 'Property Selected'}
              </span>
            </div>
          </button>

          {/* Stage 2: Set Campaign Brief */}
          <button
            type="button"
            onClick={() => handleStepClick(2)}
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#E8F7F1]/80 hover:bg-[#E8F7F1] border border-[#10B981]/30 text-left transition-all cursor-pointer group shadow-2xs"
            title="Click to configure Campaign Brief (Tone, Persona, Name)"
          >
            <div className="h-7 w-7 rounded-lg bg-[#10B981] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
              <Check className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider block leading-none">
                Step 2 &bull; Done
              </span>
              <span className="text-xs font-bold text-[#1F2937] truncate block mt-0.5 group-hover:text-[#10B981] transition-colors">
                Campaign Brief Configured
              </span>
            </div>
          </button>

          {/* Stage 3: Generate Caption */}
          <button
            type="button"
            onClick={() => handleStepClick(3)}
            disabled={generateCopyMutation.isPending}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all cursor-pointer group shadow-2xs ${
              generateCopyMutation.isPending
                ? 'bg-amber-50 border border-amber-300'
                : lastGeneratedAt || langData.hook
                ? 'bg-[#E8F7F1]/80 hover:bg-[#E8F7F1] border border-[#10B981]/30'
                : 'bg-[#EDE9FE]/70 hover:bg-[#EDE9FE] border border-[#8B5CF6]/30'
            }`}
            title="Click to generate or regenerate AI captions"
          >
            <div
              className={`h-7 w-7 rounded-lg text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs ${
                generateCopyMutation.isPending
                  ? 'bg-amber-500'
                  : lastGeneratedAt || langData.hook
                  ? 'bg-[#10B981]'
                  : 'bg-[#8B5CF6]'
              }`}
            >
              {generateCopyMutation.isPending ? (
                <RotateCcw className="w-4 h-4 animate-spin" />
              ) : lastGeneratedAt || langData.hook ? (
                <Check className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider block leading-none ${
                  generateCopyMutation.isPending
                    ? 'text-amber-700'
                    : lastGeneratedAt || langData.hook
                    ? 'text-[#10B981]'
                    : 'text-[#8B5CF6]'
                }`}
              >
                {generateCopyMutation.isPending
                  ? 'Step 3 &bull; Generating...'
                  : lastGeneratedAt || langData.hook
                  ? 'Step 3 &bull; Done'
                  : 'Step 3 &bull; Click to Run'}
              </span>
              <span className="text-xs font-bold text-[#1F2937] truncate block mt-0.5">
                {generateCopyMutation.isPending
                  ? 'Synthesizing...'
                  : lastGeneratedAt || langData.hook
                  ? 'AI Caption Generated'
                  : 'Generate AI Copy'}
              </span>
            </div>
          </button>

          {/* Stage 4: Review, Edit & Save */}
          <button
            type="button"
            onClick={() => handleStepClick(4)}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all cursor-pointer group shadow-2xs ${
              isCurrentProjectDirty
                ? 'bg-amber-50/80 hover:bg-amber-50 border border-amber-300'
                : lastGeneratedAt || langData.hook
                ? 'bg-[#E8F7F1]/80 hover:bg-[#E8F7F1] border border-[#10B981]/30'
                : 'bg-slate-50 hover:bg-slate-100 border border-slate-200'
            }`}
            title="Click to jump to Editor & review/save draft"
          >
            <div
              className={`h-7 w-7 rounded-lg text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs ${
                isCurrentProjectDirty
                  ? 'bg-amber-500'
                  : lastGeneratedAt || langData.hook
                  ? 'bg-[#10B981]'
                  : 'bg-slate-400'
              }`}
            >
              {lastGeneratedAt || langData.hook ? (
                <Check className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <span>4</span>
              )}
            </div>
            <div className="min-w-0">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider block leading-none ${
                  isCurrentProjectDirty
                    ? 'text-amber-700'
                    : lastGeneratedAt || langData.hook
                    ? 'text-[#10B981]'
                    : 'text-[#64748B]'
                }`}
              >
                {isCurrentProjectDirty
                  ? 'Step 4 &bull; Unsaved Edits'
                  : lastGeneratedAt || langData.hook
                  ? 'Step 4 &bull; Done'
                  : 'Step 4 &bull; Review & Save'}
              </span>
              <span className="text-xs font-bold text-[#1F2937] truncate block mt-0.5">
                {isCurrentProjectDirty ? 'Click to Save' : 'Review, Edit & Save'}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MAIN 2-COLUMN WORKSPACE: LEFT (BRIEF) & RIGHT (CONSOLIDATED EDITOR)    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
        {/* ======================================================================= */}
        {/* LEFT COLUMN: STICKY CAMPAIGN BRIEF & GENERATE TRIGGER                   */}
        {/* ======================================================================= */}
        <div className="space-y-4 lg:sticky lg:top-6" ref={briefPanelRef}>
          <div className="rounded-2xl bg-white border border-[#EDF0F2] p-5 shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] space-y-4">
            {/* Panel Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#EDF0F2]">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-[#EDE9FE] text-[#8B5CF6] flex items-center justify-center shrink-0">
                  <SlidersHorizontal className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#1F2937]">Campaign Brief</h2>
                  <p className="text-[11px] text-[#64748B]">Tone, persona &amp; conversion goal</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-[#8B5CF6] bg-[#EDE9FE]/70 px-2 py-0.5 rounded-full">
                Step 2 &amp; 3
              </span>
            </div>

            {/* Field 0: Property Marketing Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#1F2937] flex items-center justify-between">
                <span>Marketing Property / Project Name</span>
                {activeItem?.customPropertyName && (
                  <span className="text-[10px] font-semibold text-[#10B981]">Customized</span>
                )}
              </label>
              <input
                type="text"
                value={activeItem?.customPropertyName ?? activeItem?.projectName ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setItems((prev) =>
                    prev.map((item) =>
                      item.id === activeItem?.id
                        ? { ...item, customPropertyName: val }
                        : item
                    )
                  );
                  if (activeItem) setDirtyProjects((prev) => new Set(prev).add(activeItem.id));
                }}
                placeholder="e.g. RS Heritage, Grand Residency..."
                className="w-full h-10 px-3 py-2 text-xs rounded-xl border border-[#EDF0F2] bg-slate-50/50 text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:bg-white transition-all font-medium"
              />
              <p className="text-[10px] text-[#94A3B8]">
                Changes the property name in all generated hooks and descriptions
              </p>
            </div>

            {/* Field 1: Tone & Style Preset */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#1F2937] flex items-center justify-between">
                <span>Tone &amp; Style Preset</span>
              </label>
              <select
                value={selectedTone}
                onChange={(e) => {
                  setSelectedTone(e.target.value);
                  if (activeItem) setDirtyProjects((prev) => new Set(prev).add(activeItem.id));
                }}
                className="w-full h-10 px-3 py-2 text-xs rounded-xl border border-[#EDF0F2] bg-slate-50/50 text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:bg-white transition-all cursor-pointer font-medium"
              >
                {TONE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-[#94A3B8]">Controls the narrative mood and vocabulary</p>
            </div>

            {/* Field 2: Target Buyer Persona */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#1F2937] flex items-center justify-between">
                <span>Target Buyer Persona</span>
              </label>
              <select
                value={selectedPersona}
                onChange={(e) => {
                  setSelectedPersona(e.target.value);
                  if (activeItem) setDirtyProjects((prev) => new Set(prev).add(activeItem.id));
                }}
                className="w-full h-10 px-3 py-2 text-xs rounded-xl border border-[#EDF0F2] bg-slate-50/50 text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:bg-white transition-all cursor-pointer font-medium"
              >
                {PERSONA_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-[#94A3B8]">Tailors messaging to buyer motivations</p>
            </div>

            {/* Field 3: Primary Call to Action */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#1F2937] flex items-center justify-between">
                <span>Primary Call-to-Action</span>
              </label>
              <select
                value={selectedCta}
                onChange={(e) => {
                  setSelectedCta(e.target.value);
                  handleUpdateCaption('cta', e.target.value);
                }}
                className="w-full h-10 px-3 py-2 text-xs rounded-xl border border-[#EDF0F2] bg-slate-50/50 text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:bg-white transition-all cursor-pointer font-medium"
              >
                {!CTA_OPTIONS.includes(selectedCta) && selectedCta && (
                  <option value={selectedCta}>{selectedCta}</option>
                )}
                {CTA_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-[#94A3B8]">Main lead generation destination</p>
            </div>

            {/* STEP 3: GENERATE CAPTION ACTION (Placed directly below configuration) */}
            <div className="pt-2 space-y-2 border-t border-[#EDF0F2]">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generateCopyMutation.isPending}
                className="w-full h-11 inline-flex items-center justify-center gap-2 px-4 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-xs font-bold hover:opacity-95 shadow-md shadow-[#10B981]/20 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                <Sparkles
                  className={`w-4 h-4 ${generateCopyMutation.isPending ? 'animate-spin' : ''}`}
                />
                <span>
                  {generateCopyMutation.isPending
                    ? 'AI Synthesizing Copy...'
                    : lastGeneratedAt
                    ? `Regenerate Caption (${activeLang})`
                    : `Generate Caption (${activeLang})`}
                </span>
              </button>

              <div className="flex items-center justify-between text-[11px] text-[#64748B] px-1 pt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#94A3B8]" />
                  {lastGeneratedAt
                    ? `Generated at ${lastGeneratedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'Ready to generate'}
                </span>
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  title="Reset to default baseline template"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Template</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Context Card */}
          <div className="rounded-2xl bg-slate-50/70 border border-[#EDF0F2] p-4 text-xs text-[#64748B] space-y-1.5">
            <div className="flex items-center gap-2 text-[#1F2937] font-semibold">
              <Layers className="w-4 h-4 text-[#10B981]" />
              <span>Project Context</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Synthesizing for <strong className="text-[#1F2937] font-medium">{activeItem?.projectName}</strong> in{' '}
              <strong className="text-[#1F2937] font-medium">{activeItem?.city || 'Gurugram'}</strong> ({activeItem?.angle || 'Residential'}).
            </p>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN: STEP 4 - CONSOLIDATED CAPTION WORKSPACE (NO NESTED CARDS)  */}
        {/* ======================================================================= */}
        <div ref={editorPanelRef} className="rounded-2xl bg-white border border-[#EDF0F2] shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] overflow-hidden">
          {/* 4A. Integrated Workspace Toolbar */}
          <div className="p-4 border-b border-[#EDF0F2] bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Language Segmented Tabs */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center shrink-0">
                <Languages className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="inline-flex rounded-xl bg-slate-100 p-0.5 text-xs font-semibold">
                {(['English', 'Hindi', 'Hinglish'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveLang(lang)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeLang === lang
                        ? 'bg-white text-[#10B981] shadow-xs'
                        : 'text-[#64748B] hover:text-[#1F2937]'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Controls: Short/Long Toggle & View Mode */}
            <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
              {/* Short/Long Form Switcher */}
              {activeTab === 'editor' && (
                <div className="inline-flex rounded-xl bg-slate-100 p-0.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setCaptionLength('short')}
                    className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                      captionLength === 'short'
                        ? 'bg-white text-[#1F2937] shadow-xs'
                        : 'text-[#64748B] hover:text-[#1F2937]'
                    }`}
                  >
                    Short Form
                  </button>
                  <button
                    type="button"
                    onClick={() => setCaptionLength('long')}
                    className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                      captionLength === 'long'
                        ? 'bg-white text-[#1F2937] shadow-xs'
                        : 'text-[#64748B] hover:text-[#1F2937]'
                    }`}
                  >
                    Long Story
                  </button>
                </div>
              )}

              {/* View Mode Toggle */}
              <div className="inline-flex rounded-xl bg-slate-100 p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('editor')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'editor'
                      ? 'bg-white text-[#1F2937] shadow-xs'
                      : 'text-[#64748B] hover:text-[#1F2937]'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Editor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'preview'
                      ? 'bg-white text-[#1F2937] shadow-xs'
                      : 'text-[#64748B] hover:text-[#1F2937]'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span>Feed Preview</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4B. CONSOLIDATED EDITOR VIEW (NO NESTED CARDS) */}
          {activeTab === 'editor' && (
            <div className="divide-y divide-[#EDF0F2]">
              {/* SECTION 1: HEADLINE & HOOK */}
              <div className="p-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-[#1F2937]">Headline &amp; Hook</h3>
                    <p className="text-[11px] text-[#64748B]">
                      First 3-second attention grabber for feed scrolls
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-[#64748B] tabular-nums">
                      {langData.hook?.length || 0} chars
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(langData.hook, 'hook', 'Hook Copied')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#EDF0F2] bg-white text-xs font-semibold text-[#1F2937] hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      {copiedKey === 'hook' ? (
                        <Check className="w-3 h-3 text-[#10B981]" />
                      ) : (
                        <Copy className="w-3 h-3 text-[#64748B]" />
                      )}
                      <span>{copiedKey === 'hook' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <textarea
                  value={langData.hook}
                  onChange={(e) => handleUpdateCaption('hook', e.target.value)}
                  rows={2}
                  placeholder="Enter attention-grabbing hook headline..."
                  className="w-full text-xs font-semibold p-3 rounded-xl border border-[#EDF0F2] bg-slate-50/40 text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:bg-white leading-relaxed resize-none transition-all"
                />

                {/* Alternative Hooks Option Pills */}
                {activeItem?.alternativeHooks?.[activeLang] &&
                  activeItem.alternativeHooks[activeLang].length > 1 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Alternative Hooks (Click to use):
                      </span>
                      <div className="flex flex-col gap-1.5">
                        {activeItem.alternativeHooks[activeLang].map((hk, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleUpdateCaption('hook', hk)}
                            className={`p-2 rounded-lg text-left text-xs transition-all cursor-pointer border ${
                              langData.hook === hk
                                ? 'bg-[#E8F7F1] border-[#10B981] text-[#10B981] font-semibold'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span className="text-[10px] font-bold text-slate-400 mr-1.5">
                              #{idx + 1}
                            </span>
                            {hk}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              {/* SECTION 2: MAIN CAPTION BODY (VISUALLY DOMINANT) */}
              <div className="p-5 space-y-2.5 bg-slate-50/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-[#1F2937]">Main Caption Body</h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-[#475569]">
                        {captionLength === 'short' ? 'Short Form' : 'Long Story'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#64748B]">
                      Storytelling narrative highlighting property features and lifestyle
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-[#64748B] tabular-nums">
                      {(captionLength === 'short' ? langData.short : langData.long)?.length || 0} chars
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          captionLength === 'short' ? langData.short : langData.long,
                          'body',
                          'Caption Body Copied'
                        )
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#EDF0F2] bg-white text-xs font-semibold text-[#1F2937] hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      {copiedKey === 'body' ? (
                        <Check className="w-3 h-3 text-[#10B981]" />
                      ) : (
                        <Copy className="w-3 h-3 text-[#64748B]" />
                      )}
                      <span>{copiedKey === 'body' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <textarea
                  value={captionLength === 'short' ? langData.short : langData.long}
                  onChange={(e) =>
                    handleUpdateCaption(captionLength === 'short' ? 'short' : 'long', e.target.value)
                  }
                  rows={captionLength === 'short' ? 4 : 7}
                  placeholder="Enter narrative property caption..."
                  className="w-full text-xs p-3.5 rounded-xl border border-[#EDF0F2] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#10B981] leading-relaxed resize-y min-h-[120px] max-h-[360px] transition-all font-normal shadow-2xs"
                />
              </div>

              {/* SECTION 3: CALL TO ACTION (CTA) */}
              <div className="p-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-[#1F2937]">Call to Action (CTA)</h3>
                    <p className="text-[11px] text-[#64748B]">Action-driving prompt for lead generation</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(langData.cta, 'cta', 'CTA Copied')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#EDF0F2] bg-white text-xs font-semibold text-[#1F2937] hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    {copiedKey === 'cta' ? (
                      <Check className="w-3 h-3 text-[#10B981]" />
                    ) : (
                      <Copy className="w-3 h-3 text-[#64748B]" />
                    )}
                    <span>{copiedKey === 'cta' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <input
                    type="text"
                    value={langData.cta}
                    onChange={(e) => handleUpdateCaption('cta', e.target.value)}
                    placeholder="e.g. Schedule VIP Site Walkthrough"
                    className="flex-1 h-10 px-3.5 py-2 text-xs font-semibold rounded-xl border border-[#EDF0F2] bg-slate-50/40 text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:bg-white transition-all"
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      WhatsApp Action
                    </span>
                    <span className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      Ad Lead Form
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 4: REAL ESTATE HASHTAGS */}
              <div className="p-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-[#1F2937]">Real Estate Hashtags</h3>
                    <p className="text-[11px] text-[#64748B]">
                      Search-optimized tags for Meta &amp; social algorithms
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-[#64748B]">
                      {langData.hashtags?.length || 0} tags
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          (langData.hashtags || []).join(' '),
                          'hashtags',
                          'Hashtags Copied'
                        )
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#EDF0F2] bg-white text-xs font-semibold text-[#1F2937] hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      {copiedKey === 'hashtags' ? (
                        <Check className="w-3 h-3 text-[#10B981]" />
                      ) : (
                        <Copy className="w-3 h-3 text-[#64748B]" />
                      )}
                      <span>{copiedKey === 'hashtags' ? 'Copied' : 'Copy All'}</span>
                    </button>
                  </div>
                </div>

                {/* Tag Pills */}
                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-[#EDF0F2] bg-slate-50/50 min-h-[46px] items-center">
                  {(langData.hashtags || []).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#EDF0F2] text-xs font-medium text-[#1F2937] shadow-2xs group"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveHashtag(tag)}
                        className="text-slate-400 hover:text-rose-500 cursor-pointer ml-0.5"
                        title="Remove tag"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add Custom Hashtag Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newHashtagInput}
                    onChange={(e) => setNewHashtagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddHashtag();
                      }
                    }}
                    placeholder="Add custom tag (e.g. #GolfCourseFacing)..."
                    className="flex-1 h-9 px-3 py-1.5 text-xs rounded-xl border border-[#EDF0F2] bg-white text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#10B981] transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleAddHashtag}
                    className="h-9 inline-flex items-center gap-1 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-[#1F2937] transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Tag</span>
                  </button>
                </div>
              </div>

              {/* SECTION 5: FACTUAL ACCURACY NOTICE (NON-BLOCKING) */}
              <div className="p-4 bg-amber-50/60 border-t border-amber-100 flex items-start gap-2.5 text-xs text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Verify AI-generated property details, amenities, pricing, and regulatory claims before publishing.
                </p>
              </div>

              {/* SECTION 6: BOTTOM ACTION FOOTER */}
              <div className="p-4 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-[#64748B]">
                  <FileText className="w-4 h-4 text-[#10B981]" />
                  <span>
                    Editing <strong className="text-[#1F2937]">{activeItem?.projectName}</strong> ({activeLang})
                  </span>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleCopyFullCaption}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#EDF0F2] bg-white text-xs font-semibold text-[#1F2937] hover:bg-slate-50 shadow-xs transition-all cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>Copy Full Caption</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#10B981] text-white text-xs font-semibold hover:bg-[#059669] shadow-xs transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Caption</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4C. SECONDARY SOCIAL FEED PREVIEW (SIMULATOR ONLY) */}
          {activeTab === 'preview' && (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EDF0F2]">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-[#E8F7F1] text-[#10B981] flex items-center justify-center shrink-0">
                    <Share2 className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1F2937]">Social Feed Simulator</h3>
                    <p className="text-[11px] text-[#64748B]">
                      Accurate mobile feed mockup based on current draft text
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#10B981] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Preview Only</span>
                </div>
              </div>

              {/* Mobile Feed Frame Simulator */}
              <div className="max-w-md mx-auto rounded-2xl border border-slate-200 bg-white shadow-md overflow-hidden">
                {/* Header */}
                <div className="p-3 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-[#10B981] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                      {(activeItem?.projectName || 'RC').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1F2937] leading-none">
                        {activeItem?.projectName || 'Property'}
                      </h4>
                      <span className="text-[10px] text-[#64748B] flex items-center gap-1 mt-0.5">
                        <span>Sponsored</span>
                        <span>&bull;</span>
                        <span className="text-[#10B981] font-semibold">{activeLang}</span>
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-bold tracking-widest">&bull;&bull;&bull;</span>
                </div>

                {/* Media Banner */}
                {activeProject?.coverImageUrl ? (
                  <div className="h-44 w-full relative overflow-hidden bg-slate-900">
                    <img
                      src={activeProject.coverImageUrl}
                      alt={activeItem?.projectName}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3.5 text-white">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                        {activeItem?.category || 'Luxury Real Estate'}
                      </span>
                      <h5 className="text-xs font-bold text-white line-clamp-1">
                        {activeItem?.projectName}
                      </h5>
                      <span className="text-[10px] text-slate-300">
                        {activeItem?.city || 'Gurugram'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-44 bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center p-6 text-center text-white relative">
                    <Building2 className="w-10 h-10 text-[#10B981] mb-2 opacity-80" />
                    <span className="text-xs font-semibold tracking-wide text-emerald-400 uppercase">
                      {activeItem?.category || 'Luxury Real Estate'}
                    </span>
                    <h5 className="text-sm font-bold text-white mt-1 max-w-xs line-clamp-1">
                      {activeItem?.projectName}
                    </h5>
                    <span className="text-[11px] text-slate-300 mt-0.5">
                      {activeItem?.city || 'Gurugram'} &bull; Visual Placeholder
                    </span>
                  </div>
                )}

                {/* Decorative Action Bar */}
                <div className="px-3.5 py-2 flex items-center justify-between border-b border-slate-100 text-slate-400 select-none">
                  <div className="flex items-center gap-3">
                    <Heart className="w-4 h-4" aria-hidden="true" />
                    <MessageCircle className="w-4 h-4" aria-hidden="true" />
                    <Share2 className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                      Feed Mockup
                    </span>
                    <Bookmark className="w-4 h-4" aria-hidden="true" />
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-3.5 space-y-2 text-xs">
                  <p className="font-bold text-[#1F2937] leading-snug">{langData.hook}</p>
                  <p className="text-[#475569] leading-relaxed whitespace-pre-line text-[11px]">
                    {captionLength === 'short' ? langData.short : langData.long}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {(langData.hashtags || []).join(' ')}
                  </p>
                </div>

                {/* CTA Action Banner */}
                <div className="p-3 border-t border-slate-100 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => handleCopy(langData.cta, 'feed-cta', 'CTA Copied')}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#10B981] text-white text-xs font-bold text-center hover:bg-[#059669] shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>{langData.cta || 'Schedule VIP Site Walkthrough'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Bottom Quick Switch */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('editor')}
                  className="inline-flex items-center gap-1.5 text-xs text-[#10B981] font-semibold hover:underline cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Return to Editor to refine text</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
