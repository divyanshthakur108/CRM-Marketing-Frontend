import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Brain, Clapperboard, Code2, Film, FlaskConical, ImageIcon, Pencil, Plus, RefreshCw, Trash2, Upload } from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useToast } from '../components/ui/Toast';

// ── Types (mirror the backend knowledge cards) ─────────────────────────────

interface ProjectBrief {
  projectName: string | null;
  developer: string | null;
  city: string | null;
  locality: string | null;
  propertyType: string | null;
  configurations: string[];
  sizes: string[];
  floors: string | null;
  towersOrBlocks: string | null;
  totalUnits: string | null;
  price: string | null;
  possession: string | null;
  reraNumber: string | null;
  amenities: string[];
  nearbyPlaces: Array<{ name: string; distance: string | null }>;
  highlights: string[];
  targetBuyer: string | null;
  contact: string | null;
  missingFacts: string[];
  summary: string;
}

interface LabProject {
  _id: string;
  name: string;
  infoText: string;
  briefStatus: 'PENDING' | 'DONE' | 'FAILED';
  brief?: ProjectBrief;
  briefError?: string;
  assetCount?: number;
  createdAt: string;
}

interface IdeaUse {
  idea: string;
  why: string;
}

interface QualityInfo {
  score: number;
  issues: string[];
}

interface ImageKnowledge {
  kind: 'image';
  title: string;
  description: string;
  sourceType: string;
  space: string;
  spaceDetail: string;
  visibleElements: string[];
  materialsAndFinishes: string[];
  colors: string[];
  lighting: { timeOfDay: string; notes: string };
  camera: { shotType: string; angle: string };
  people: { present: boolean; count: number; description: string };
  textInImage: string[];
  logosOrWatermarks: string[];
  quality: QualityInfo;
  composition: { mainSubject: string; emptySpaceForText: string[] };
  animation: { imageToVideoScore: number; suggestedMotion: string; risks: string };
  bestUses: IdeaUse[];
  matchesProjectInfo: string[];
  conflictsWithProjectInfo: string[];
  tags: string[];
  searchText: string;
}

interface VideoShot {
  start: number;
  end: number;
  title: string;
  description: string;
  space: string;
  visibleElements: string[];
  materialsAndFinishes: string[];
  cameraMotion: string;
  people: string;
  textOnScreen: string[];
  quality: QualityInfo;
  hookScore: number;
  bestStart: number;
  bestEnd: number;
  keep: boolean;
  reason: string;
  bestUses: IdeaUse[];
  thumbnail?: string;
}

interface VideoKnowledge {
  kind: 'video';
  title: string;
  summary: string;
  sourceType: string;
  filmedWith: string;
  durationSeconds: number;
  analyzedSeconds: number;
  speech: { hasSpeech: boolean; language: string; speakers: string; transcript: Array<{ start: number; end: number; text: string }> };
  hasMusic: boolean;
  quality: QualityInfo;
  shots: VideoShot[];
  sceneCuts: number[];
  bestUses: IdeaUse[];
  matchesProjectInfo: string[];
  conflictsWithProjectInfo: string[];
  tags: string[];
  searchText: string;
}

interface LabAsset {
  _id: string;
  kind: 'image' | 'video';
  url: string;
  filename: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
  hasAudio?: boolean;
  previewThumb?: string;
  status: 'QUEUED' | 'ANALYZING' | 'DONE' | 'FAILED';
  knowledge?: ImageKnowledge | VideoKnowledge;
  reusedFromAssetId?: string;
  aiModel?: string;
  steps: Array<{ name: string; ms: number }>;
  error?: string;
  analysisMs?: number;
}

interface LabResult {
  _id: string;
  title: string;
  notes: string;
  aiDisclosure: string;
  tags: string[];
  verdict: 'USE' | 'CHECK' | 'DONT_USE';
  url: string;
  filename: string;
  sizeBytes: number;
  durationSeconds?: number;
  previewThumb?: string;
  source: 'poc-script' | 'upload';
  createdAt: string;
}

interface GeminiUsage {
  totalCount: number;
  limit: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const formatSize = (bytes: number) =>
  bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
const fmtTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
const pretty = (s: string) => s.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
const errMsg = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback);

const EXAMPLE_INFO = `Green Heights by ABC Developers, Sector 82 Mohali.
3 and 4 BHK apartments, 1,850 to 2,400 sq ft super area. G+14, 2 towers, 112 units.
Price from 1.2 Cr. Possession Dec 2027. RERA PBRERA-SAS80-PR0123.
Amenities: clubhouse, pool, gym, kids play area, 24x7 security.
10 min to airport, 5 min to Chandigarh highway. Target: families upgrading from 2 BHK.`;

const statusStyle: Record<LabAsset['status'], string> = {
  QUEUED: 'bg-neutral-100 text-neutral-600',
  ANALYZING: 'bg-amber-100 text-amber-800',
  DONE: 'bg-emerald-100 text-emerald-800',
  FAILED: 'bg-red-100 text-red-700',
};
const statusLabel: Record<LabAsset['status'], string> = {
  QUEUED: 'Waiting',
  ANALYZING: 'AI is studying…',
  DONE: 'Understood',
  FAILED: 'Failed',
};

function Pill({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${className}`}>{children}</span>;
}

function Chips({ items, tone = 'neutral' }: { items: string[]; tone?: 'neutral' | 'red' | 'green' }) {
  if (!items.length) return <span className="text-xs text-neutral-400">—</span>;
  const cls = tone === 'red' ? 'bg-red-50 text-red-700' : tone === 'green' ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-700';
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((t) => (
        <Pill key={t} className={cls}>
          {t}
        </Pill>
      ))}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-2 py-1.5 border-b border-neutral-100 last:border-0">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 pt-0.5">{label}</div>
      <div className="text-xs text-neutral-800 min-w-0">{children}</div>
    </div>
  );
}

function Score({ value, max = 5 }: { value: number; max?: number }) {
  const tone = value >= 4 ? 'text-emerald-700' : value >= 3 ? 'text-amber-700' : 'text-red-700';
  return (
    <span className={`font-bold ${tone}`}>
      {value}/{max}
    </span>
  );
}

function IdeaList({ uses, ideas }: { uses: IdeaUse[]; ideas: Record<string, string> }) {
  if (!uses.length) return <span className="text-xs text-neutral-400">—</span>;
  return (
    <ul className="space-y-1">
      {uses.map((u) => (
        <li key={u.idea} className="text-xs">
          <span className="font-semibold text-violet-700">{ideas[u.idea] || u.idea}</span>
          {u.why && <span className="text-neutral-600"> — {u.why}</span>}
        </li>
      ))}
    </ul>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export const AdminCreativeLabPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [infoText, setInfoText] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploads, setUploads] = useState<Array<{ name: string; state: 'uploading' | 'error'; error?: string }>>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const usage = useQuery({
    queryKey: ['creative-lab-usage'],
    queryFn: async () => (await api.get('/admin/creative-lab/usage')).data.data as GeminiUsage,
    refetchInterval: 15000,
  });

  const ideas = useQuery({
    queryKey: ['creative-lab-ideas'],
    queryFn: async () => (await api.get('/admin/creative-lab/ideas')).data.data as Record<string, string>,
    staleTime: Infinity,
  });

  const projects = useQuery({
    queryKey: ['creative-lab-projects'],
    queryFn: async () => (await api.get('/admin/creative-lab/projects')).data.data as LabProject[],
  });

  const detail = useQuery({
    queryKey: ['creative-lab-project', projectId],
    enabled: Boolean(projectId),
    queryFn: async () =>
      (await api.get(`/admin/creative-lab/projects/${projectId}`)).data.data as {
        project: LabProject;
        assets: LabAsset[];
        results?: LabResult[];
      },
    refetchInterval: (q) => {
      const assets = (q.state.data as { assets: LabAsset[] } | undefined)?.assets || [];
      return assets.some((a) => a.status === 'QUEUED' || a.status === 'ANALYZING') ? 3000 : false;
    },
  });

  // Open the newest project on first load
  useEffect(() => {
    if (!projectId && projects.data?.length) setProjectId(projects.data[0]._id);
  }, [projects.data, projectId]);

  // Gemini counter moves when an analysis finishes
  const doneCount = detail.data?.assets.filter((a) => a.status === 'DONE' || a.status === 'FAILED').length || 0;
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['creative-lab-usage'] });
  }, [doneCount, queryClient]);

  const project = detail.data?.project;
  const assets = detail.data?.assets || [];
  const results = detail.data?.results || [];
  const selected = assets.find((a) => a._id === selectedAssetId) || null;
  const ideaNames = ideas.data || {};
  const showForm = editing || !projectId;

  const startNew = () => {
    setProjectId(null);
    setSelectedAssetId(null);
    setName('');
    setInfoText('');
    setEditing(true);
  };

  const startEdit = () => {
    if (!project) return;
    setName(project.name);
    setInfoText(project.infoText);
    setEditing(true);
  };

  const saveProject = async () => {
    if (!name.trim()) {
      toast({ message: 'Give the test project a name', type: 'warning' });
      return;
    }
    setSaving(true);
    try {
      const body = { name: name.trim(), infoText };
      const res = projectId
        ? await api.put(`/admin/creative-lab/projects/${projectId}`, body)
        : await api.post('/admin/creative-lab/projects', body);
      const saved = res.data.data as LabProject;
      setProjectId(saved._id);
      setEditing(false);
      await queryClient.invalidateQueries({ queryKey: ['creative-lab-projects'] });
      await queryClient.invalidateQueries({ queryKey: ['creative-lab-project', saved._id] });
      await queryClient.invalidateQueries({ queryKey: ['creative-lab-usage'] });
      if (saved.briefStatus === 'FAILED') {
        toast({ title: 'Saved, but the AI could not read the facts', message: saved.briefError || '', type: 'warning' });
      }
    } catch (err) {
      toast({ title: 'Could not save', message: errMsg(err, 'Please try again'), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const deleteProject = async () => {
    if (!projectId) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      const res = await api.delete(`/admin/creative-lab/projects/${projectId}`);
      toast({ message: `Test project removed (${res.data.data.deletedFiles} file record(s)). The files stay in storage.`, type: 'success' });
      setProjectId(null);
      setSelectedAssetId(null);
      setEditing(false);
      await queryClient.invalidateQueries({ queryKey: ['creative-lab-projects'] });
    } catch (err) {
      toast({ title: 'Could not delete', message: errMsg(err, ''), type: 'error' });
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length || !projectId) return;
    for (const file of Array.from(files)) {
      setUploads((u) => [...u, { name: file.name, state: 'uploading' }]);
      try {
        const form = new FormData();
        form.append('file', file);
        await api.post(`/admin/creative-lab/projects/${projectId}/assets`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setUploads((u) => u.filter((x) => x.name !== file.name));
        await queryClient.invalidateQueries({ queryKey: ['creative-lab-project', projectId] });
      } catch (err) {
        setUploads((u) => u.map((x) => (x.name === file.name ? { ...x, state: 'error', error: errMsg(err, 'Upload failed') } : x)));
      }
    }
    await queryClient.invalidateQueries({ queryKey: ['creative-lab-projects'] });
  };

  const reanalyze = async (asset: LabAsset) => {
    try {
      await api.post(`/admin/creative-lab/assets/${asset._id}/reanalyze`);
      await queryClient.invalidateQueries({ queryKey: ['creative-lab-project', projectId] });
    } catch (err) {
      toast({ title: 'Could not analyze again', message: errMsg(err, ''), type: 'error' });
    }
  };

  const removeAsset = async (asset: LabAsset) => {
    try {
      await api.delete(`/admin/creative-lab/assets/${asset._id}`);
      if (selectedAssetId === asset._id) setSelectedAssetId(null);
      await queryClient.invalidateQueries({ queryKey: ['creative-lab-project', projectId] });
    } catch (err) {
      toast({ title: 'Could not remove', message: errMsg(err, ''), type: 'error' });
    }
  };

  const removeResult = async (result: LabResult) => {
    try {
      await api.delete(`/admin/creative-lab/results/${result._id}`);
      await queryClient.invalidateQueries({ queryKey: ['creative-lab-project', projectId] });
      toast({ message: 'Removed from the page. The video stays in storage.', type: 'success' });
    } catch (err) {
      toast({ title: 'Could not remove', message: errMsg(err, ''), type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Creative Lab"
        description="Step 1 test: describe a project, upload its photos and videos, and see what the AI understands from every file."
        actions={
          <div className="flex items-center gap-2">
            {usage.data && (
              <Pill className={usage.data.totalCount >= usage.data.limit ? 'bg-red-100 text-red-700' : 'bg-neutral-100 text-neutral-700'}>
                Gemini today: {usage.data.totalCount}/{usage.data.limit}
              </Pill>
            )}
            <Button variant="secondary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={startNew}>
              New test project
            </Button>
          </div>
        }
      />

      {/* Project picker */}
      {!!projects.data?.length && (
        <div className="flex flex-wrap gap-2">
          {projects.data.map((p) => (
            <button
              key={p._id}
              onClick={() => {
                setProjectId(p._id);
                setSelectedAssetId(null);
                setEditing(false);
              }}
              className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${
                p._id === projectId ? 'border-black bg-black text-white' : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
              }`}
            >
              {p.name} <span className="opacity-60">· {p.assetCount || 0} files</span>
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        {/* Left: project info + facts */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FlaskConical className="w-4 h-4" /> 1. Project information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {showForm ? (
                <>
                  <Input label="Project name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Green Heights" />
                  <Textarea
                    label="Everything you know about the project (plain text)"
                    rows={9}
                    value={infoText}
                    onChange={(e) => setInfoText(e.target.value)}
                    placeholder={EXAMPLE_INFO}
                    helperText="Size, BHK, floors, price, location, nearby places, amenities, RERA, target buyer… The AI only uses what you write."
                  />
                  <div className="flex gap-2">
                    <Button size="sm" isLoading={saving} onClick={saveProject} leftIcon={<Brain className="w-4 h-4" />}>
                      Save and read facts (1 AI request)
                    </Button>
                    {!infoText && (
                      <Button size="sm" variant="ghost" onClick={() => setInfoText(EXAMPLE_INFO)}>
                        Use example
                      </Button>
                    )}
                    {projectId && (
                      <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </>
              ) : project ? (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{project.name}</p>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" leftIcon={<Pencil className="w-3.5 h-3.5" />} onClick={startEdit}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant={confirmDelete ? 'destructive' : 'ghost'}
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                        isLoading={deleting}
                        onClick={deleteProject}
                        onBlur={() => setConfirmDelete(false)}
                      >
                        {confirmDelete ? 'Click again to remove project' : 'Remove project'}
                      </Button>
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap text-xs text-neutral-600">{project.infoText || 'No information typed.'}</p>
                </>
              ) : (
                <p className="text-xs text-neutral-500">Loading…</p>
              )}
            </CardContent>
          </Card>

          {project && !showForm && <BriefCard project={project} />}
        </div>

        {/* Right: uploads + files */}
        <div className="space-y-6">
          {project && !showForm && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Upload className="w-4 h-4" /> 2. Upload photos and videos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    uploadFiles(e.dataTransfer.files);
                  }}
                  onClick={() => fileInput.current?.click()}
                  className="cursor-pointer rounded-2xl border-2 border-dashed border-neutral-200 p-6 text-center hover:border-neutral-400"
                >
                  <p className="text-sm font-medium">Drop files here or click to choose</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    JPG / PNG / WebP photos, MP4 / MOV / WebM videos (first 3 minutes are analyzed). Each new file uses 1 AI request;
                    the same file uploaded again is free.
                  </p>
                  <input
                    ref={fileInput}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                    className="hidden"
                    onChange={(e) => {
                      uploadFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </div>
                {uploads.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {uploads.map((u) => (
                      <li key={u.name} className="flex items-center justify-between text-xs">
                        <span className="truncate">{u.name}</span>
                        {u.state === 'uploading' ? (
                          <span className="text-neutral-500">Uploading…</span>
                        ) : (
                          <span className="text-red-600">
                            {u.error}{' '}
                            <button className="underline" onClick={() => setUploads((x) => x.filter((y) => y.name !== u.name))}>
                              dismiss
                            </button>
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}

          {project && !showForm && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Brain className="w-4 h-4" /> 3. What the AI understood ({assets.length} files)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!assets.length ? (
                  <p className="text-xs text-neutral-500">No files yet.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                    {assets.map((a) => (
                      <button
                        key={a._id}
                        onClick={() => setSelectedAssetId(a._id)}
                        className={`overflow-hidden rounded-xl border text-left transition-colors ${
                          a._id === selectedAssetId ? 'border-black ring-1 ring-black' : 'border-neutral-200 hover:border-neutral-400'
                        }`}
                      >
                        <div className="relative aspect-video bg-neutral-100">
                          {a.previewThumb ? (
                            <img src={a.previewThumb} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-neutral-400">
                              {a.kind === 'video' ? <Film className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                            </div>
                          )}
                          <Pill className={`absolute left-1.5 top-1.5 ${statusStyle[a.status]}`}>{statusLabel[a.status]}</Pill>
                          {a.kind === 'video' && a.durationSeconds !== undefined && (
                            <Pill className="absolute bottom-1.5 right-1.5 bg-black/70 text-white">{fmtTime(a.durationSeconds)}</Pill>
                          )}
                        </div>
                        <div className="p-2">
                          <p className="truncate text-xs font-semibold">{a.knowledge?.title || a.filename}</p>
                          <p className="truncate text-[11px] text-neutral-500">
                            {a.knowledge ? pretty(a.knowledge.kind === 'image' ? a.knowledge.space : a.knowledge.shots[0]?.space || '') : a.filename}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {project && !showForm && <ResultsCard results={results} onRemove={removeResult} />}

          {selected && (
            <AssetDetail asset={selected} ideas={ideaNames} onReanalyze={() => reanalyze(selected)} onRemove={() => removeAsset(selected)} />
          )}
        </div>
      </div>
    </div>
  );
};

// ── Generated results ──────────────────────────────────────────────────────

const verdictStyle: Record<LabResult['verdict'], { label: string; className: string }> = {
  USE: { label: 'Good to use', className: 'bg-emerald-100 text-emerald-800' },
  CHECK: { label: 'Check first', className: 'bg-amber-100 text-amber-800' },
  DONT_USE: { label: "Don't use", className: 'bg-red-100 text-red-700' },
};

function ResultsCard({ results, onRemove }: { results: LabResult[]; onRemove: (r: LabResult) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clapperboard className="w-4 h-4" /> 4. Generated results ({results.length} videos)
        </CardTitle>
        <p className="text-xs text-neutral-500">
          Finished reels made from this project's files. Published from <code>poc/creative-lab/results.json</code> with{' '}
          <code>npm run creative-lab:publish</code>; videos are stored in the cloud, so every admin sees the same list.
        </p>
      </CardHeader>
      <CardContent>
        {!results.length ? (
          <p className="text-xs text-neutral-500">No generated videos for this project yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((r) => (
              <div key={r._id} className="flex flex-col overflow-hidden rounded-xl border border-neutral-200">
                <div className="bg-black">
                  <video
                    src={r.url}
                    poster={r.previewThumb}
                    controls
                    preload="none"
                    playsInline
                    className="mx-auto aspect-[9/16] max-h-[480px] w-full object-contain"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Pill className={verdictStyle[r.verdict].className}>{verdictStyle[r.verdict].label}</Pill>
                    {r.durationSeconds !== undefined && <Pill className="bg-neutral-100 text-neutral-600">{fmtTime(r.durationSeconds)}</Pill>}
                    <Pill className="bg-neutral-100 text-neutral-600">{formatSize(r.sizeBytes)}</Pill>
                  </div>
                  <p className="text-sm font-semibold leading-snug">{r.title}</p>
                  {r.aiDisclosure && (
                    <p className="rounded-md bg-violet-50 px-2 py-1 text-[11px] text-violet-800">
                      <span className="font-semibold">AI used: </span>
                      {r.aiDisclosure}
                    </p>
                  )}
                  {r.notes && <p className="text-xs text-neutral-600">{r.notes}</p>}
                  {!!r.tags.length && <Chips items={r.tags} />}
                  <div className="mt-auto flex items-center justify-between pt-1 text-[11px] text-neutral-400">
                    <span>
                      {new Date(r.createdAt).toLocaleDateString()} · {r.source === 'poc-script' ? 'POC script' : 'Uploaded'}
                    </span>
                    <span className="flex items-center gap-3">
                      <a href={r.url} target="_blank" rel="noreferrer" className="underline hover:text-neutral-700">
                        Open
                      </a>
                      <button onClick={() => onRemove(r)} className="flex items-center gap-1 hover:text-red-600">
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Project facts ──────────────────────────────────────────────────────────

function BriefCard({ project }: { project: LabProject }) {
  const b = project.brief;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="w-4 h-4" /> Facts the AI read
        </CardTitle>
      </CardHeader>
      <CardContent>
        {project.briefStatus === 'FAILED' && <p className="text-xs text-red-600">{project.briefError || 'Could not read the facts.'}</p>}
        {project.briefStatus === 'PENDING' && <p className="text-xs text-neutral-500">Reading…</p>}
        {b && (
          <div>
            {b.summary && <p className="mb-2 text-xs text-neutral-700">{b.summary}</p>}
            <Row label="Developer">{b.developer || '—'}</Row>
            <Row label="Location">{[b.locality, b.city].filter(Boolean).join(', ') || '—'}</Row>
            <Row label="Type">{b.propertyType || '—'}</Row>
            <Row label="Configurations">
              <Chips items={b.configurations} />
            </Row>
            <Row label="Sizes">
              <Chips items={b.sizes} />
            </Row>
            <Row label="Floors / towers / units">{[b.floors, b.towersOrBlocks, b.totalUnits].map((x) => x || '—').join(' · ')}</Row>
            <Row label="Price">{b.price || '—'}</Row>
            <Row label="Possession">{b.possession || '—'}</Row>
            <Row label="RERA">{b.reraNumber || '—'}</Row>
            <Row label="Amenities">
              <Chips items={b.amenities} />
            </Row>
            <Row label="Nearby">
              <Chips items={b.nearbyPlaces.map((p) => (p.distance ? `${p.name} · ${p.distance}` : p.name))} />
            </Row>
            <Row label="Highlights">
              <Chips items={b.highlights} />
            </Row>
            <Row label="Target buyer">{b.targetBuyer || '—'}</Row>
            <Row label="Contact">{b.contact || '—'}</Row>
            <Row label="Missing">
              <Chips items={b.missingFacts} tone="red" />
            </Row>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── One file's knowledge card ──────────────────────────────────────────────

function AssetDetail({
  asset,
  ideas,
  onReanalyze,
  onRemove,
}: {
  asset: LabAsset;
  ideas: Record<string, string>;
  onReanalyze: () => void;
  onRemove: () => void;
}) {
  const [showJson, setShowJson] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const k = asset.knowledge;
  const busy = asset.status === 'QUEUED' || asset.status === 'ANALYZING';
  const seek = (t: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = t;
      videoRef.current.play().catch(() => undefined);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{k?.title || asset.filename}</CardTitle>
            <p className="text-xs text-neutral-500">
              {asset.filename} · {formatSize(asset.sizeBytes)}
              {asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : ''}
              {asset.kind === 'video' && asset.durationSeconds !== undefined ? ` · ${fmtTime(asset.durationSeconds)}` : ''}
              {asset.kind === 'video' ? (asset.hasAudio ? ' · with sound' : ' · no sound') : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" leftIcon={<Code2 className="w-3.5 h-3.5" />} onClick={() => setShowJson((v) => !v)} disabled={!k}>
              {showJson ? 'Hide JSON' : 'Raw JSON'}
            </Button>
            <Button size="sm" variant="secondary" leftIcon={<RefreshCw className="w-3.5 h-3.5" />} onClick={onReanalyze} disabled={busy}>
              Analyze again
            </Button>
            <Button size="sm" variant="ghost" leftIcon={<Trash2 className="w-3.5 h-3.5" />} onClick={onRemove} disabled={asset.status === 'ANALYZING'}>
              Remove
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="overflow-hidden rounded-xl bg-neutral-900">
            {asset.kind === 'video' ? (
              <video ref={videoRef} src={asset.url} controls className="max-h-[420px] w-full" />
            ) : (
              <img src={asset.url} alt={asset.filename} className="max-h-[420px] w-full object-contain" />
            )}
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              <Pill className={statusStyle[asset.status]}>{statusLabel[asset.status]}</Pill>
              {asset.reusedFromAssetId && <Pill className="bg-sky-100 text-sky-800">Reused, no AI request</Pill>}
              {asset.aiModel && <Pill className="bg-neutral-100 text-neutral-600">{asset.aiModel}</Pill>}
              {asset.analysisMs !== undefined && <Pill className="bg-neutral-100 text-neutral-600">{(asset.analysisMs / 1000).toFixed(1)} s</Pill>}
            </div>
            {asset.error && <p className="rounded-lg bg-red-50 p-2 text-xs text-red-700">{asset.error}</p>}
            {asset.steps.length > 0 && (
              <ol className="space-y-0.5">
                {asset.steps.map((s, i) => (
                  <li key={i} className="flex justify-between gap-2 text-[11px] text-neutral-600">
                    <span>
                      {i + 1}. {s.name}
                    </span>
                    <span className="shrink-0 text-neutral-400">{(s.ms / 1000).toFixed(1)} s</span>
                  </li>
                ))}
                {busy && <li className="text-[11px] text-amber-700">Working…</li>}
              </ol>
            )}
            {k && <p className="text-xs leading-relaxed text-neutral-800">{k.kind === 'image' ? k.description : k.summary}</p>}
          </div>
        </div>

        {showJson && k && (
          <pre className="max-h-[480px] overflow-auto rounded-xl bg-neutral-950 p-3 text-[11px] text-emerald-200">
            {JSON.stringify(k, (key, v) => (key === 'thumbnail' ? '[image]' : v), 2)}
          </pre>
        )}

        {k?.kind === 'image' && <ImageCard k={k} ideas={ideas} />}
        {k?.kind === 'video' && <VideoCard k={k} ideas={ideas} onSeek={seek} />}
      </CardContent>
    </Card>
  );
}

function CommonRows({ k, ideas }: { k: ImageKnowledge | VideoKnowledge; ideas: Record<string, string> }) {
  return (
    <>
      <Row label="Best uses">
        <IdeaList uses={k.bestUses} ideas={ideas} />
      </Row>
      <Row label="Matches info">
        <Chips items={k.matchesProjectInfo} tone="green" />
      </Row>
      <Row label="Conflicts with info">
        <Chips items={k.conflictsWithProjectInfo} tone="red" />
      </Row>
      <Row label="Tags">
        <Chips items={k.tags} />
      </Row>
      <Row label="Search text">
        <span className="text-neutral-600">{k.searchText || '—'}</span>
      </Row>
    </>
  );
}

function ImageCard({ k, ideas }: { k: ImageKnowledge; ideas: Record<string, string> }) {
  return (
    <div>
      <Row label="Space">
        {pretty(k.space)}
        {k.spaceDetail && <span className="text-neutral-500"> — {k.spaceDetail}</span>}
      </Row>
      <Row label="Real or render">{pretty(k.sourceType)}</Row>
      <Row label="Quality">
        <Score value={k.quality.score} /> {k.quality.issues.length > 0 && <Chips items={k.quality.issues.map(pretty)} tone="red" />}
      </Row>
      <Row label="Visible">
        <Chips items={k.visibleElements} />
      </Row>
      <Row label="Materials">
        <Chips items={k.materialsAndFinishes} />
      </Row>
      <Row label="Colours">
        <Chips items={k.colors} />
      </Row>
      <Row label="Light">
        {pretty(k.lighting.timeOfDay)}
        {k.lighting.notes && <span className="text-neutral-500"> — {k.lighting.notes}</span>}
      </Row>
      <Row label="Camera">{[k.camera.shotType, k.camera.angle].filter(Boolean).map(pretty).join(' · ') || '—'}</Row>
      <Row label="People">{k.people.present ? `${k.people.count} — ${k.people.description}` : 'None'}</Row>
      <Row label="Text in image">
        <Chips items={k.textInImage} />
      </Row>
      <Row label="Logos / watermarks">
        <Chips items={k.logosOrWatermarks} />
      </Row>
      <Row label="Composition">
        {k.composition.mainSubject || '—'}
        {k.composition.emptySpaceForText.length > 0 && (
          <span className="text-neutral-500"> · free space for text: {k.composition.emptySpaceForText.join(', ')}</span>
        )}
      </Row>
      <Row label="Animate it?">
        <Score value={k.animation.imageToVideoScore} /> {k.animation.suggestedMotion}
        {k.animation.risks && <p className="mt-0.5 text-neutral-500">Risk: {k.animation.risks}</p>}
      </Row>
      <CommonRows k={k} ideas={ideas} />
    </div>
  );
}

function VideoCard({ k, ideas, onSeek }: { k: VideoKnowledge; ideas: Record<string, string>; onSeek: (t: number) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Row label="Real or render">{pretty(k.sourceType)}</Row>
        <Row label="Filmed with">{pretty(k.filmedWith)}</Row>
        <Row label="Quality">
          <Score value={k.quality.score} /> {k.quality.issues.length > 0 && <Chips items={k.quality.issues.map(pretty)} tone="red" />}
        </Row>
        <Row label="Sound">
          {k.speech.hasSpeech ? `Speech (${k.speech.language})` : 'No speech'}
          {k.hasMusic ? ' · music' : ''}
          {k.speech.speakers && <span className="text-neutral-500"> — {k.speech.speakers}</span>}
        </Row>
        <Row label="Analyzed">
          {fmtTime(k.analyzedSeconds)} of {fmtTime(k.durationSeconds)} · {k.shots.length} shots · {k.sceneCuts.length} hard cuts
        </Row>
        <CommonRows k={k} ideas={ideas} />
      </div>

      {k.speech.transcript.length > 0 && (
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Transcript (click a line to jump)</p>
          <div className="max-h-56 space-y-0.5 overflow-auto rounded-xl bg-neutral-50 p-2">
            {k.speech.transcript.map((l, i) => (
              <button key={i} onClick={() => onSeek(l.start)} className="flex w-full gap-2 rounded px-1 text-left text-xs hover:bg-white">
                <span className="shrink-0 font-mono text-neutral-400">{fmtTime(l.start)}</span>
                <span>{l.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Shot by shot (click to jump)</p>
        <div className="space-y-2">
          {k.shots.map((s, i) => (
            <div key={i} className={`flex gap-3 rounded-xl border p-2 ${s.keep ? 'border-neutral-200' : 'border-red-200 bg-red-50/40'}`}>
              <button onClick={() => onSeek(s.bestStart)} className="w-28 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                {s.thumbnail ? <img src={s.thumbnail} alt="" className="h-full w-full object-cover" /> : <Film className="m-6 w-6 h-6 text-neutral-400" />}
              </button>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-[11px] text-neutral-500">
                    {fmtTime(s.start)}–{fmtTime(s.end)}
                  </span>
                  <span className="text-xs font-semibold">{s.title}</span>
                  <Pill className="bg-neutral-100 text-neutral-700">{pretty(s.space)}</Pill>
                  <Pill className="bg-neutral-100 text-neutral-700">{pretty(s.cameraMotion)}</Pill>
                  <Pill className="bg-neutral-100 text-neutral-700">
                    Quality&nbsp;<Score value={s.quality.score} />
                  </Pill>
                  <Pill className="bg-neutral-100 text-neutral-700">
                    Hook&nbsp;<Score value={s.hookScore} />
                  </Pill>
                  {!s.keep && <Pill className="bg-red-100 text-red-700">Cut</Pill>}
                </div>
                <p className="text-xs text-neutral-700">{s.description}</p>
                <p className="text-[11px] text-neutral-500">
                  Best part {fmtTime(s.bestStart)}–{fmtTime(s.bestEnd)} · {s.reason}
                </p>
                {s.materialsAndFinishes.length > 0 && <Chips items={s.materialsAndFinishes} />}
                {s.quality.issues.length > 0 && <Chips items={s.quality.issues.map(pretty)} tone="red" />}
                {s.bestUses.length > 0 && <IdeaList uses={s.bestUses} ideas={ideas} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
