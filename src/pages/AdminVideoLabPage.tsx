import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Clapperboard, Download, Eye, Film, ImageIcon, Mic, Music, Scissors, Trash2, Upload, Wand2 } from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useToast } from '../components/ui/Toast';

type AssetKind = 'video' | 'image' | 'audio';

interface LabAsset {
  key: string;
  url: string;
  kind: AssetKind;
  filename: string;
  sizeBytes: number;
  durationSeconds?: number;
  width?: number;
  height?: number;
  hasAudio?: boolean;
}

interface CaptionCue {
  start: number;
  end: number;
  text: string;
}

/** Captions from the speech in one clip, for one caption language */
interface Transcript {
  status: 'loading' | 'done' | 'error';
  cues: CaptionCue[];
  spokenLanguage?: string;
  error?: string;
}

interface TimeRange {
  start: number;
  end: number;
}

interface ClipShot {
  start: number;
  end: number;
  label: string;
  category: string;
  quality: number;
  hookScore: number;
  issues: string[];
  hasSpeech: boolean;
  bestStart: number;
  bestEnd: number;
  keep: boolean;
  reason: string;
  thumbnail?: string;
}

interface ClipAnalysis {
  clipKey: string;
  durationSeconds: number;
  analyzedSeconds: number;
  summary: string;
  shots: ClipShot[];
  sceneCuts: number[];
  silences: TimeRange[];
  ms: number;
  steps: Array<{ name: string; ms: number }>;
}

/** "Understand clips" result for one clip */
interface AnalysisState {
  status: 'loading' | 'done' | 'error';
  data?: ClipAnalysis;
  error?: string;
}

interface RenderStep {
  name: string;
  ms: number;
  command?: string;
}

interface LabRender {
  _id: string;
  batchId: string;
  status: 'QUEUED' | 'RENDERING' | 'DONE' | 'FAILED';
  recipe: { variant: { index: number; label: string } } & Record<string, unknown>;
  input: { facts: { projectName: string }; captions: { language: string } };
  outputUrl?: string;
  posterUrl?: string;
  durationSeconds?: number;
  renderMs?: number;
  steps: RenderStep[];
  error?: string;
  createdAt: string;
}

const LANGUAGES = [
  { value: 'hinglish', label: 'Hinglish (Roman script)' },
  { value: 'hi', label: 'Hindi (देवनागरी)' },
  { value: 'pa', label: 'Punjabi (ਗੁਰਮੁਖੀ)' },
  { value: 'en', label: 'English' },
];

const STATUS_BADGE: Record<LabRender['status'], { status: string; label: string }> = {
  QUEUED: { status: 'scheduled', label: 'Queued' },
  RENDERING: { status: 'generating', label: 'Rendering…' },
  DONE: { status: 'published', label: 'Done' },
  FAILED: { status: 'failed', label: 'Failed' },
};

const transcriptKey = (clipKey: string, language: string) => `${clipKey}|${language}`;

const CATEGORY_LABEL: Record<string, string> = {
  AERIAL: 'Drone',
  EXTERIOR: 'Exterior',
  ENTRANCE: 'Entrance',
  LIVING: 'Living',
  KITCHEN: 'Kitchen',
  BEDROOM: 'Bedroom',
  BATHROOM: 'Bathroom',
  BALCONY_VIEW: 'Balcony / view',
  AMENITY: 'Amenity',
  LOCATION: 'Location',
  PRESENTER: 'Presenter',
  OTHER: 'Other',
};
const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;

const formatSize = (bytes: number) =>
  bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;

/** Cloudinary: ask the CDN to send the file as a download */
const downloadUrl = (url: string) => url.replace('/upload/', '/upload/fl_attachment/');

async function uploadAsset(file: File): Promise<LabAsset> {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post('/admin/video-lab/assets', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data as LabAsset;
}

export function AdminVideoLabPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [clips, setClips] = useState<LabAsset[]>([]);
  const [logo, setLogo] = useState<LabAsset | null>(null);
  const [music, setMusic] = useState<LabAsset | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  const [orgName, setOrgName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [phone, setPhone] = useState('');
  const [rera, setRera] = useState('');
  const [language, setLanguage] = useState('hinglish');
  const [captionSource, setCaptionSource] = useState<'speech' | 'typed'>('speech');
  const [captionText, setCaptionText] = useState('');
  const [transcripts, setTranscripts] = useState<Record<string, Transcript>>({});
  const [transcribing, setTranscribing] = useState(false);
  const [editing, setEditing] = useState<'smart' | 'whole'>('smart');
  const [targetSeconds, setTargetSeconds] = useState('30');
  const [analyses, setAnalyses] = useState<Record<string, AnalysisState>>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [variants, setVariants] = useState('3');
  const [submitting, setSubmitting] = useState(false);

  const clipInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const musicInput = useRef<HTMLInputElement>(null);

  const { data: renders = [] } = useQuery({
    queryKey: ['video-lab-renders'],
    queryFn: async () => (await api.get('/admin/video-lab/renders')).data.data as LabRender[],
    // Poll only while something is still rendering
    refetchInterval: (query) =>
      (query.state.data || []).some((r) => r.status === 'QUEUED' || r.status === 'RENDERING') ? 3000 : false,
  });

  const handleFiles = async (files: FileList | null, kind: 'clip' | 'logo' | 'music') => {
    if (!files?.length) return;
    const list = Array.from(files).slice(0, kind === 'clip' ? 5 - clips.length : 1);
    for (const file of list) {
      setUploading(file.name);
      try {
        const asset = await uploadAsset(file);
        if (kind === 'clip') setClips((prev) => [...prev, asset].slice(0, 5));
        if (kind === 'logo') setLogo(asset);
        if (kind === 'music') setMusic(asset);
      } catch (err) {
        toast({
          title: `Upload failed: ${file.name}`,
          message: err instanceof Error ? err.message : 'Could not upload the file',
          type: 'error',
        });
      }
    }
    setUploading(null);
  };

  const captionLines = captionText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const clipsWithSound = clips.filter((c) => c.hasAudio !== false);

  /**
   * Gets captions from the speech in every clip that has sound (one clip at a time, to stay under
   * Gemini's per-minute limit). Clips already done for this language are skipped. Returns all transcripts.
   */
  const transcribeClips = async (force = false): Promise<Record<string, Transcript>> => {
    const result: Record<string, Transcript> = { ...transcripts };
    setTranscribing(true);
    for (const clip of clipsWithSound) {
      const key = transcriptKey(clip.key, language);
      if (!force && result[key]?.status === 'done') continue;
      setTranscripts((prev) => ({ ...prev, [key]: { status: 'loading', cues: [] } }));
      try {
        const res = await api.post('/admin/video-lab/transcribe', { clipKey: clip.key, language });
        const data = res.data.data as { cues: CaptionCue[]; spokenLanguage?: string };
        result[key] = { status: 'done', cues: data.cues, spokenLanguage: data.spokenLanguage };
      } catch (err) {
        result[key] = { status: 'error', cues: [], error: err instanceof Error ? err.message : 'Could not get captions' };
      }
      setTranscripts((prev) => ({ ...prev, [key]: result[key] }));
    }
    setTranscribing(false);
    return result;
  };

  /** Watches every clip that isn't understood yet (one at a time). Returns all results. */
  const analyzeClips = async (force = false): Promise<Record<string, AnalysisState>> => {
    const result: Record<string, AnalysisState> = { ...analyses };
    setAnalyzing(true);
    for (const clip of clips) {
      if (!force && result[clip.key]?.status === 'done') continue;
      setAnalyses((prev) => ({ ...prev, [clip.key]: { status: 'loading' } }));
      try {
        const res = await api.post('/admin/video-lab/analyze', { clipKey: clip.key });
        result[clip.key] = { status: 'done', data: res.data.data as ClipAnalysis };
      } catch (err) {
        result[clip.key] = { status: 'error', error: err instanceof Error ? err.message : 'Could not understand the clip' };
      }
      setAnalyses((prev) => ({ ...prev, [clip.key]: result[clip.key] }));
    }
    setAnalyzing(false);
    return result;
  };

  const toggleKeep = (clipKey: string, index: number) => {
    setAnalyses((prev) => {
      const a = prev[clipKey];
      if (!a?.data) return prev;
      const shots = a.data.shots.map((sh, i) => (i === index ? { ...sh, keep: !sh.keep } : sh));
      return { ...prev, [clipKey]: { ...a, data: { ...a.data, shots } } };
    });
  };

  const editCue = (clipKey: string, index: number, text: string) => {
    const key = transcriptKey(clipKey, language);
    setTranscripts((prev) => {
      const t = prev[key];
      if (!t) return prev;
      return { ...prev, [key]: { ...t, cues: t.cues.map((c, i) => (i === index ? { ...c, text } : c)) } };
    });
  };

  const canGenerate =
    clips.length > 0 && orgName.trim() && projectName.trim() && !uploading && !submitting && !transcribing && !analyzing;

  const handleGenerate = async () => {
    setSubmitting(true);
    try {
      let currentAnalyses = analyses;
      if (editing === 'smart') {
        currentAnalyses = await analyzeClips();
        const failed = clips.filter((c) => currentAnalyses[c.key]?.status === 'error');
        if (failed.length) {
          toast({
            title: 'Could not understand the clips',
            message: `${failed.map((c) => c.filename).join(', ')}: ${currentAnalyses[failed[0].key]?.error}. Try again, or switch to "Use whole clips".`,
            type: 'error',
          });
          return;
        }
      }
      let current = transcripts;
      if (captionSource === 'speech') {
        current = await transcribeClips();
        const failed = clipsWithSound.filter((c) => current[transcriptKey(c.key, language)]?.status === 'error');
        if (failed.length) {
          toast({
            title: 'Captions from speech failed',
            message: `${failed.map((c) => c.filename).join(', ')}: ${current[transcriptKey(failed[0].key, language)]?.error}. Fix this or switch to typed captions, then generate again.`,
            type: 'error',
          });
          return;
        }
      }
      const res = await api.post('/admin/video-lab/renders', {
        clips: clips.map((c) => ({
          key: c.key,
          filename: c.filename,
          durationSeconds: c.durationSeconds,
          ...(editing === 'smart' && currentAnalyses[c.key]?.data
            ? {
                // Thumbnails stay in the browser
                shots: currentAnalyses[c.key]!.data!.shots.map(({ thumbnail: _t, ...shot }) => shot),
                silences: currentAnalyses[c.key]!.data!.silences,
              }
            : {}),
          ...(captionSource === 'speech'
            ? { cues: (current[transcriptKey(c.key, language)]?.cues || []).filter((cue) => cue.text.trim()) }
            : {}),
        })),
        logoKey: logo?.key,
        musicKey: music?.key,
        facts: { orgName, projectName, phone, rera },
        captions: { language, source: captionSource, lines: captionSource === 'typed' ? captionLines : [] },
        editing,
        ...(editing === 'smart' ? { targetSeconds: Number(targetSeconds) } : {}),
        variants: Number(variants),
      });
      toast({ title: 'Generating', message: res.data.meta?.message || 'Videos queued', type: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['video-lab-renders'] });
    } catch (err) {
      toast({
        title: 'Could not start generation',
        message: err instanceof Error ? err.message : 'Please check the inputs',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Video Lab"
        description="Test the video editing pipeline: upload raw clips, type the details, and generate different reels. No organization or project needed."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Files */}
        <Card>
          <CardHeader className="border-b border-[#E5E5E5] pb-3">
            <CardTitle className="text-[15px] font-semibold">1. Upload files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-[#0A0A0A]">Raw clips (1–5) *</span>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  leftIcon={<Upload className="w-3.5 h-3.5" />}
                  disabled={clips.length >= 5 || Boolean(uploading)}
                  onClick={() => clipInput.current?.click()}
                >
                  Add clips
                </Button>
                <input
                  ref={clipInput}
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    handleFiles(e.target.files, 'clip');
                    e.target.value = '';
                  }}
                />
              </div>
              <ul className="mt-2 space-y-1.5">
                {clips.map((c, i) => (
                  <li key={c.key} className="flex items-center justify-between text-[12px] bg-[#FAFAFA] border border-[#E5E5E5] rounded-[8px] px-3 py-2">
                    <span className="flex items-center gap-2 min-w-0">
                      <Film className="w-3.5 h-3.5 text-[#737373] shrink-0" />
                      <span className="truncate">
                        {i + 1}. {c.filename}
                      </span>
                      <span className="text-[#737373] shrink-0">
                        {c.durationSeconds ? `${c.durationSeconds}s · ` : ''}
                        {c.width && c.height ? `${c.width}×${c.height} · ` : ''}
                        {c.hasAudio === false ? 'no sound · ' : ''}
                        {formatSize(c.sizeBytes)}
                      </span>
                    </span>
                    <button type="button" aria-label="Remove clip" onClick={() => setClips((p) => p.filter((x) => x.key !== c.key))}>
                      <Trash2 className="w-3.5 h-3.5 text-[#737373] hover:text-[#B91C1C]" />
                    </button>
                  </li>
                ))}
                {clips.length === 0 && <li className="text-[12px] text-[#737373]">No clips yet. MP4, MOV or WebM.</li>}
              </ul>
            </div>

            <FileRow
              icon={<ImageIcon className="w-3.5 h-3.5 text-[#737373]" />}
              label="Logo (optional; otherwise the org name is used as the watermark)"
              asset={logo}
              onPick={() => logoInput.current?.click()}
              onRemove={() => setLogo(null)}
              disabled={Boolean(uploading)}
            />
            <input ref={logoInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { handleFiles(e.target.files, 'logo'); e.target.value = ''; }} />

            <FileRow
              icon={<Music className="w-3.5 h-3.5 text-[#737373]" />}
              label="Background music (optional; use licensed/royalty-free tracks)"
              asset={music}
              onPick={() => musicInput.current?.click()}
              onRemove={() => setMusic(null)}
              disabled={Boolean(uploading)}
            />
            <input ref={musicInput} type="file" accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,audio/wav" className="hidden" onChange={(e) => { handleFiles(e.target.files, 'music'); e.target.value = ''; }} />

            {uploading && <p className="text-[12px] text-[#525252]">Uploading {uploading}…</p>}
          </CardContent>
        </Card>

        {/* 2. Details */}
        <Card>
          <CardHeader className="border-b border-[#E5E5E5] pb-3">
            <CardTitle className="text-[15px] font-semibold">2. Details &amp; captions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Org name *" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="e.g. Skyline Developers" />
              <Input label="Project name *" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g. Skyline Heights" />
              <Input label="Phone / WhatsApp (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Shown on the end card only if filled" />
              <Input label="RERA number (optional)" value={rera} onChange={(e) => setRera(e.target.value)} placeholder="Shown on the end card only if filled" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select label="Caption language" value={language} onChange={(e) => setLanguage(e.target.value)} options={LANGUAGES} />
              <Select
                label="Captions come from"
                value={captionSource}
                onChange={(e) => setCaptionSource(e.target.value as 'speech' | 'typed')}
                options={[
                  { value: 'speech', label: 'Speech in the clips (automatic)' },
                  { value: 'typed', label: 'Lines I type' },
                ]}
              />
            </div>
            {captionSource === 'typed' ? (
              <Textarea
                label="Caption lines (one per row, shown in order and spread evenly over the video)"
                rows={5}
                value={captionText}
                onChange={(e) => setCaptionText(e.target.value)}
                placeholder={'Aapka dream ghar ab ready hai\nMohali mein 3 BHK flats\nAaj hi site visit book karein'}
              />
            ) : (
              <SpeechCaptions
                clips={clips}
                language={language}
                transcripts={transcripts}
                transcribing={transcribing}
                onTranscribe={() => transcribeClips(true)}
                onEditCue={editCue}
              />
            )}
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="sm:w-56">
                <Select
                  label="How many different videos?"
                  value={variants}
                  onChange={(e) => setVariants(e.target.value)}
                  options={[
                    { value: '1', label: '1 video' },
                    { value: '2', label: '2 variants' },
                    { value: '3', label: '3 variants' },
                  ]}
                />
              </div>
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={!canGenerate}
                isLoading={submitting}
                leftIcon={<Wand2 className="w-4 h-4" />}
              >
                Generate
              </Button>
            </div>
            <p className="text-[12px] text-[#737373]">
              Variants change only the presentation; facts stay the same. Smart cut: A = property-tour order, B = best shot
              first, C = fast cuts. Each also has its own caption style, end-card design and music level.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Understand clips */}
      <Card>
        <CardHeader className="border-b border-[#E5E5E5] pb-3">
          <CardTitle className="text-[15px] font-semibold">3. Understand clips (where to cut)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          <div className="flex flex-col md:flex-row md:items-end gap-3">
            <div className="md:w-80">
              <Select
                label="Editing"
                value={editing}
                onChange={(e) => setEditing(e.target.value as 'smart' | 'whole')}
                options={[
                  { value: 'smart', label: 'Smart cut: AI picks the best shots' },
                  { value: 'whole', label: 'Use whole clips (first 25 s of each)' },
                ]}
              />
            </div>
            {editing === 'smart' && (
              <>
                <div className="md:w-48">
                  <Select
                    label="Video length (before end card)"
                    value={targetSeconds}
                    onChange={(e) => setTargetSeconds(e.target.value)}
                    options={[
                      { value: '15', label: 'About 15 s' },
                      { value: '30', label: 'About 30 s' },
                      { value: '45', label: 'About 45 s' },
                      { value: '60', label: 'About 60 s' },
                    ]}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  leftIcon={<Eye className="w-4 h-4" />}
                  disabled={!clips.length || analyzing}
                  isLoading={analyzing}
                  onClick={() => analyzeClips(true)}
                >
                  Understand clips
                </Button>
              </>
            )}
          </div>
          {editing === 'smart' ? (
            <>
              <p className="text-[12px] text-[#525252]">
                ffmpeg finds the exact cuts and pauses; Gemini watches each clip and describes every shot (room, quality,
                problems, speech, best part). Untick a shot to leave it out. Generate uses the ticked shots in property-tour
                order (drone → exterior → entrance → rooms → amenities), never cutting in the middle of a sentence.
                If you skip this, Generate does it automatically. Clips are understood up to 3 minutes.
              </p>
              {clips.map((clip, i) => (
                <ClipShots
                  key={clip.key}
                  index={i}
                  clip={clip}
                  state={analyses[clip.key]}
                  onToggle={(shotIndex) => toggleKeep(clip.key, shotIndex)}
                />
              ))}
              {clips.length === 0 && <p className="text-[12px] text-[#737373]">Upload clips first.</p>}
            </>
          ) : (
            <p className="text-[12px] text-[#525252]">Each clip is used from the start (up to 25 s), in the order uploaded.</p>
          )}
        </CardContent>
      </Card>

      {/* 4. Results */}
      <div className="space-y-3">
        <h2 className="text-[15px] font-semibold text-[#0A0A0A] flex items-center gap-2">
          <Clapperboard className="w-4 h-4" /> Generated videos
        </h2>
        {renders.length === 0 && <p className="text-[13px] text-[#737373]">Nothing generated yet.</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {renders.map((r) => (
            <RenderCard key={r._id} render={r} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ClipShots(props: { index: number; clip: LabAsset; state?: AnalysisState; onToggle: (shotIndex: number) => void }) {
  const { index, clip, state, onToggle } = props;
  const data = state?.data;
  const kept = data?.shots.filter((s) => s.keep) || [];
  return (
    <div className="border border-[#E5E5E5] rounded-[8px] p-3 text-[12px]">
      <div className="flex justify-between gap-2">
        <span className="font-medium text-[#0A0A0A] truncate">
          {index + 1}. {clip.filename}
        </span>
        <span className="text-[#737373] shrink-0">
          {!state
            ? 'Not understood yet'
            : state.status === 'loading'
              ? 'Watching…'
              : state.status === 'error'
                ? 'Failed'
                : `${data!.shots.length} shots · ${kept.length} kept · ${(data!.ms / 1000).toFixed(1)}s`}
        </span>
      </div>
      {state?.status === 'error' && <p className="mt-1 text-[#B91C1C]">{state.error}</p>}
      {data && (
        <>
          {data.summary && <p className="mt-1 text-[#525252]">{data.summary}</p>}
          {data.analyzedSeconds < data.durationSeconds && (
            <p className="mt-1 text-[#92400E]">Only the first {Math.round(data.analyzedSeconds)} s of this clip are used.</p>
          )}
          <ul className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
            {data.shots.map((shot, si) => (
              <li
                key={si}
                className={`flex gap-2 border rounded-[6px] p-2 ${shot.keep ? 'border-[#E5E5E5]' : 'border-[#FECACA] bg-[#FEF2F2] opacity-75'}`}
              >
                {shot.thumbnail ? (
                  <img src={shot.thumbnail} alt="" className="w-20 h-14 object-cover rounded shrink-0 bg-[#F5F5F5]" />
                ) : (
                  <div className="w-20 h-14 rounded shrink-0 bg-[#F5F5F5]" />
                )}
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-[#0A0A0A]">{shot.label}</span>
                    <label className="flex items-center gap-1 shrink-0 cursor-pointer">
                      <input type="checkbox" checked={shot.keep} onChange={() => onToggle(si)} />
                      Keep
                    </label>
                  </div>
                  <div className="text-[#525252] flex flex-wrap gap-x-2">
                    <span className="tabular-nums">
                      {formatTime(shot.start)}–{formatTime(shot.end)}
                    </span>
                    <span>{CATEGORY_LABEL[shot.category] || shot.category}</span>
                    <span title="Quality">{'★'.repeat(shot.quality)}{'☆'.repeat(5 - shot.quality)}</span>
                    {shot.hasSpeech && (
                      <span className="flex items-center gap-0.5">
                        <Mic className="w-3 h-3" /> speech
                      </span>
                    )}
                    {!shot.hasSpeech && (shot.bestStart > shot.start + 0.05 || shot.bestEnd < shot.end - 0.05) && (
                      <span className="flex items-center gap-0.5">
                        <Scissors className="w-3 h-3" /> best {formatTime(shot.bestStart)}–{formatTime(shot.bestEnd)}
                      </span>
                    )}
                  </div>
                  {shot.issues.length > 0 && <div className="text-[#92400E]">{shot.issues.map((i) => i.replace(/_/g, ' ')).join(', ')}</div>}
                  {shot.reason && <div className="text-[#737373]">{shot.reason}</div>}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function SpeechCaptions(props: {
  clips: LabAsset[];
  language: string;
  transcripts: Record<string, Transcript>;
  transcribing: boolean;
  onTranscribe: () => void;
  onEditCue: (clipKey: string, index: number, text: string) => void;
}) {
  const { clips, language, transcripts, transcribing, onTranscribe, onEditCue } = props;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] text-[#525252]">
          Gemini listens to each clip and writes timed captions in the chosen language. Check and fix the text before
          generating. If you skip this, Generate does it automatically.
        </p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          leftIcon={<Mic className="w-3.5 h-3.5" />}
          disabled={!clips.some((c) => c.hasAudio !== false) || transcribing}
          isLoading={transcribing}
          onClick={onTranscribe}
        >
          Get captions from speech
        </Button>
      </div>
      {clips.map((clip, i) => {
        const t = transcripts[transcriptKey(clip.key, language)];
        return (
          <div key={clip.key} className="border border-[#E5E5E5] rounded-[8px] p-2 text-[12px]">
            <div className="flex justify-between gap-2 font-medium text-[#0A0A0A]">
              <span className="truncate">
                {i + 1}. {clip.filename}
              </span>
              <span className="text-[#737373] font-normal shrink-0">
                {clip.hasAudio === false
                  ? 'No sound: no captions'
                  : !t
                    ? 'Not listened yet'
                    : t.status === 'loading'
                      ? 'Listening…'
                      : t.status === 'error'
                        ? 'Failed'
                        : t.cues.length
                          ? `${t.cues.length} captions${t.spokenLanguage ? ` · spoken: ${t.spokenLanguage}` : ''}`
                          : 'No speech found'}
              </span>
            </div>
            {t?.status === 'error' && <p className="mt-1 text-[#B91C1C]">{t.error}</p>}
            {t?.status === 'done' && t.cues.length > 0 && (
              <ul className="mt-2 space-y-1">
                {t.cues.map((cue, ci) => (
                  <li key={ci} className="flex items-center gap-2">
                    <span className="text-[#737373] tabular-nums shrink-0 w-[92px]">
                      {formatTime(cue.start)}–{formatTime(cue.end)}
                    </span>
                    <input
                      value={cue.text}
                      onChange={(e) => onEditCue(clip.key, ci, e.target.value)}
                      className="flex-1 min-w-0 border border-[#E5E5E5] rounded-[6px] px-2 py-1 text-[13px] focus:outline-none focus:border-[#0A0A0A]"
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
      {clips.length === 0 && <p className="text-[12px] text-[#737373]">Upload clips first.</p>}
    </div>
  );
}

function FileRow(props: {
  icon: React.ReactNode;
  label: string;
  asset: LabAsset | null;
  onPick: () => void;
  onRemove: () => void;
  disabled: boolean;
}) {
  const { icon, label, asset, onPick, onRemove, disabled } = props;
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <span className="text-[13px] font-medium text-[#0A0A0A] block">{label}</span>
        {asset ? (
          <span className="flex items-center gap-2 text-[12px] text-[#525252] mt-1">
            {icon}
            <span className="truncate">{asset.filename}</span>
            <span className="text-[#737373]">{formatSize(asset.sizeBytes)}</span>
            <button type="button" aria-label="Remove" onClick={onRemove}>
              <Trash2 className="w-3.5 h-3.5 text-[#737373] hover:text-[#B91C1C]" />
            </button>
          </span>
        ) : null}
      </div>
      <Button type="button" size="sm" variant="secondary" disabled={disabled} onClick={onPick}>
        {asset ? 'Replace' : 'Choose'}
      </Button>
    </div>
  );
}

function RenderCard({ render }: { render: LabRender }) {
  const badge = STATUS_BADGE[render.status];
  const totalStepMs = render.steps.reduce((sum, s) => sum + s.ms, 0);
  return (
    <Card className="flex flex-col">
      <CardContent className="p-4 space-y-3 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[#0A0A0A] truncate">{render.input.facts.projectName}</p>
            <p className="text-[12px] text-[#525252]">{render.recipe.variant.label}</p>
          </div>
          <StatusBadge status={badge.status} label={badge.label} />
        </div>

        {render.status === 'DONE' && render.outputUrl ? (
          <video
            src={render.outputUrl}
            poster={render.posterUrl}
            controls
            playsInline
            className="w-full aspect-[9/16] bg-black rounded-[8px] object-contain"
          />
        ) : (
          <div className="w-full aspect-[9/16] bg-[#F5F5F5] rounded-[8px] flex items-center justify-center text-[12px] text-[#737373] text-center p-4">
            {render.status === 'FAILED'
              ? render.error || 'Render failed'
              : render.steps.length
                ? `Working… ${render.steps[render.steps.length - 1].name}`
                : 'Waiting in queue…'}
          </div>
        )}

        <div className="flex items-center justify-between text-[12px] text-[#525252]">
          <span>
            {render.durationSeconds ? `${render.durationSeconds}s video` : ''}
            {render.renderMs ? ` · made in ${(render.renderMs / 1000).toFixed(1)}s` : ''}
          </span>
          {render.status === 'DONE' && render.outputUrl && (
            <a href={downloadUrl(render.outputUrl)} className="flex items-center gap-1 font-medium text-[#0A0A0A] hover:underline">
              <Download className="w-3.5 h-3.5" /> Download
            </a>
          )}
        </div>

        <details className="text-[12px]">
          <summary className="cursor-pointer font-medium text-[#0A0A0A]">How this video was made</summary>
          <ol className="mt-2 space-y-1.5">
            {render.steps.map((s, i) => (
              <li key={i} className="border border-[#E5E5E5] rounded-[6px] p-2">
                <div className="flex justify-between gap-2">
                  <span>
                    {i + 1}. {s.name}
                  </span>
                  <span className="text-[#737373] shrink-0">{(s.ms / 1000).toFixed(1)}s</span>
                </div>
                {s.command && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-[#737373]">ffmpeg command</summary>
                    <pre className="mt-1 whitespace-pre-wrap break-all text-[10px] bg-[#FAFAFA] p-2 rounded">{s.command}</pre>
                  </details>
                )}
              </li>
            ))}
          </ol>
          {totalStepMs > 0 && <p className="mt-2 text-[#737373]">Total processing: {(totalStepMs / 1000).toFixed(1)}s</p>}
          <details className="mt-2">
            <summary className="cursor-pointer text-[#737373]">Edit recipe (JSON)</summary>
            <pre className="mt-1 whitespace-pre-wrap break-all text-[10px] bg-[#FAFAFA] p-2 rounded">
              {JSON.stringify(render.recipe, null, 2)}
            </pre>
          </details>
        </details>
      </CardContent>
    </Card>
  );
}
