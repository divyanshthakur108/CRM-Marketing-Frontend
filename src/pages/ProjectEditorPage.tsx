import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { useForm, Path } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '../lib/zodResolver';
import * as z from 'zod';
import { useProject, useCreateProject, useUpdateProject, useSubmitProject } from '../hooks/useProjects';
import { useUnits, useCreateUnit, useUpdateUnit, useDeleteUnit, BackendUnit } from '../hooks/useUnits';
import { useProjectMedia } from '../hooks/useMedia';
import { ProjectMediaSection } from '../components/project/ProjectMediaSection';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Edit2,
  Layers,
  Image as ImageIcon,
  Clock,
  Check,
  CheckCircle2,
  X,
  History,
  AlertCircle,
  Loader2,
  Sparkles,
  ChevronRight,
  Building2,
  ShieldCheck,
  MapPin,
  Phone,
  Compass,
} from 'lucide-react';
import { useManualGenerateCreatives } from '../hooks/useCreatives';
import { parsePriceRange, parsePriceToNumber } from '../utils/priceParser';

// Preset standard amenities for real estate
const PRESET_AMENITIES = [
  'Clubhouse',
  'Swimming Pool',
  'Gym / Fitness Center',
  '24/7 Security',
  'Power Backup',
  'EV Charging Station',
  'High Speed Elevators',
  'Covered Parking',
  'Landscaped Gardens',
  'Children Play Area',
  'Jogging Track',
  'Solar Power',
  'Rainwater Harvesting',
  'Fire Safety System',
  'Wi-Fi / Fiber Connectivity',
  'Cafeteria / Lounge',
];

// Helper to determine plot classification
const isPlotType = (typeStr?: string): boolean => {
  if (!typeStr) return false;
  const lower = typeStr.toLowerCase().trim();
  return lower.includes('plot') || lower.includes('land');
};

// Form schema with Zod
const projectFormSchema = z
  .object({
    // Section 1: Basic Information
    name: z
      .string()
      .trim()
      .min(3, 'Project / Property title must be at least 3 characters')
      .max(120, 'Project title cannot exceed 120 characters'),
    category: z.enum(['Residential', 'Commercial', 'Industrial']),
    status: z.enum(['DRAFT', 'ACTIVE', 'READY', 'ready', 'SOLD_OUT', 'ARCHIVED']).default('DRAFT'),
    address: z.string().trim().min(3, 'Street address is required'),
    city: z.string().trim().min(2, 'City is required'),
    state: z.string().trim().optional().default('Haryana'),
    pincode: z
      .string()
      .trim()
      .min(3, 'Postal code is required')
      .regex(/^[1-9][0-9]{5}$|^[a-zA-Z0-9\s-]{3,10}$/, 'Enter a valid postal code'),
    developer: z.string().trim().optional(),
    contactNumber: z
      .string()
      .trim()
      .min(8, 'Official inquiries contact is required')
      .regex(/^(\+?[0-9\s()-]{8,20})$/, 'Enter a valid contact number (e.g. +91 98765 43210)'),
    contactEmail: z
      .string()
      .trim()
      .email('Enter a valid email address')
      .or(z.literal(''))
      .optional(),
    website: z
      .string()
      .trim()
      .refine(
        (val) => !val || /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i.test(val),
        { message: 'Enter a valid URL (e.g. https://example.com/project)' }
      )
      .optional()
      .or(z.literal('')),
    priceDisplay: z
      .string()
      .trim()
      .min(1, 'Pricing range is required (e.g. ₹ 1.5 Cr - ₹ 3.5 Cr)'),
    saleVsRent: z.enum(['SALE', 'RENT', 'LEASE']).default('SALE'),
    reraNumber: z.string().trim().optional(),

    // Section 2: Property Specifications
    subtype: z.string().min(1, 'Please select a subtype specification'),

    // Residential fields
    bhk: z.string().optional(),
    bathrooms: z.string().optional(),
    areaSqFt: z.string().optional(),
    floor: z.string().optional(),
    parking: z.string().optional(),
    balconies: z.string().optional(),
    facing: z.string().optional(),
    furnishing: z.string().optional(),
    possession: z.string().optional(),

    // Commercial fields
    usableAreaSqFt: z.string().optional(),
    floorOrBuilding: z.string().optional(),
    frontageFt: z.string().optional(),
    lifts: z.string().optional(),
    washrooms: z.string().optional(),
    powerBackup: z.boolean().optional(),
    commercialParking: z.string().optional(),
    lease: z.boolean().optional(),
    leaseTerms: z.string().optional(),

    // Industrial fields
    industrialType: z.string().optional(),
    accessRoadWidthFt: z.string().optional(),
    powerLoadKw: z.string().optional(),
    loadingDocks: z.string().optional(),
    ceilingHeightFt: z.string().optional(),
    permittedUse: z.string().optional(),
  })
  .refine(
    (data) => {
      // Per-category validation: Plots reject BHK, floor, and furnishing
      if (isPlotType(data.subtype)) {
        if (data.bhk || data.floor || data.furnishing) {
          return false;
        }
      }
      return true;
    },
    {
      message: 'Plots cannot specify BHK, floor, or furnishing details',
      path: ['subtype'],
    }
  );

type ProjectFormData = z.infer<typeof projectFormSchema>;

interface FormSectionMeta {
  id: number;
  label: string;
  title: string;
  description: string;
  required: boolean;
}

const FORM_SECTIONS: FormSectionMeta[] = [
  {
    id: 1,
    label: 'Basic Information',
    title: '1. Basic Information & Compliance',
    description: 'Core project identity, classification, pricing range, developer contacts, and RERA registration.',
    required: true,
  },
  {
    id: 2,
    label: 'Property Specifications',
    title: '2. Property Specifications',
    description: 'Category-dependent dimensions, layout features, and architectural specifications.',
    required: true,
  },
  {
    id: 3,
    label: 'Amenities & Features',
    title: '3. Amenities & Facilities',
    description: 'Select standard development amenities and specify custom site amenities.',
    required: false,
  },
  {
    id: 4,
    label: 'Photos & Videos',
    title: '4. Digital Media & Visual Assets',
    description: 'Upload high-resolution photography, floor plans, drone videos, and official brochures.',
    required: true,
  },
];

export function ProjectEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchParams] = useSearchParams();
  const location = useLocation();

  const isValidId = Boolean(id && id !== 'new' && id !== 'media' && id !== 'undefined' && id !== 'null');
  const isEditing = isValidId;
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const effectiveProjectId = isValidId ? id! : createdProjectId || '';

  // Reset created ID when navigating back to create mode (/projects/new)
  useEffect(() => {
    if (!isValidId) {
      setCreatedProjectId(null);
    }
  }, [isValidId]);

  useEffect(() => {
    if (id === 'media') {
      navigate('/assets', { replace: true });
    }
  }, [id, navigate]);

  // React Query Hooks
  const { data: project, isLoading: isProjectLoading, refetch: refetchProject } = useProject(effectiveProjectId);
  const { data: units = [] } = useUnits(effectiveProjectId);
  const { media: projectMedia = [] } = useProjectMedia(effectiveProjectId);

  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const submitProjectMutation = useSubmitProject();
  const createUnitMutation = useCreateUnit(effectiveProjectId);
  const updateUnitMutation = useUpdateUnit(effectiveProjectId);
  const deleteUnitMutation = useDeleteUnit(effectiveProjectId);
  const manualGenerateCreativesMutation = useManualGenerateCreatives();

  // Form Section Navigation State
  const initialSection = Number(searchParams.get('section')) || 1;
  const [activeTab, setActiveTab] = useState<'details' | 'units'>('details');
  const [currentSection, setCurrentSection] = useState<number>(initialSection);
  const [isSavingSection, setIsSavingSection] = useState<boolean>(false);
  const [autoSaveTime, setAutoSaveTime] = useState<string>('Just now');
  const [summaryIssues, setSummaryIssues] = useState<Array<{ section: number; field: string; message: string }>>([]);
  const [invalidSectionIds, setInvalidSectionIds] = useState<number[]>([]);
  const [isSubmittingFinal, setIsSubmittingFinal] = useState<boolean>(false);
  const [isSubmitSuccess, setIsSubmitSuccess] = useState<boolean>(false);
  const [conflictModalOpen, setConflictModalOpen] = useState<boolean>(false);
  const [conflictMessage, setConflictMessage] = useState<string>('');
  const isSubmittingRef = useRef<boolean>(false);
  const isSubmittedRef = useRef<boolean>(false);

  // Inventory / Unit Form State
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [selectedUnitForHistory, setSelectedUnitForHistory] = useState<BackendUnit | null>(null);
  const [unitName, setUnitName] = useState('');
  const [unitBhk, setUnitBhk] = useState('2 BHK');
  const [unitArea, setUnitArea] = useState('1450');
  const [unitPrice, setUnitPrice] = useState('₹ 1.65 Cr');
  const [unitStatus, setUnitStatus] = useState<'AVAILABLE' | 'BLOCKED' | 'SOLD'>('AVAILABLE');
  const [unitErrors, setUnitErrors] = useState<{ name?: string; area?: string; price?: string }>({});

  // Amenities State
  const [amenitiesList, setAmenitiesList] = useState<string[]>([]);
  const [customAmenity, setCustomAmenity] = useState('');

  const {
    register,
    watch,
    getValues,
    reset,
    trigger,
    setError,
    clearErrors,
    formState: { errors, isDirty },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: '',
      category: 'Residential',
      status: 'DRAFT',
      subtype: 'Apartment',
      saleVsRent: 'SALE',
      priceDisplay: '',
      address: '',
      city: '',
      state: 'Haryana',
      pincode: '',
      developer: '',
      contactNumber: '',
      contactEmail: '',
      website: '',
      reraNumber: '',
      // Residential
      bhk: '',
      bathrooms: '',
      areaSqFt: '',
      floor: '',
      parking: '',
      balconies: '',
      facing: '',
      furnishing: '',
      possession: '',
      // Commercial
      usableAreaSqFt: '',
      floorOrBuilding: '',
      frontageFt: '',
      lifts: '',
      washrooms: '',
      powerBackup: false,
      commercialParking: '',
      lease: false,
      leaseTerms: '',
      // Industrial
      industrialType: '',
      accessRoadWidthFt: '',
      powerLoadKw: '',
      loadingDocks: '',
      ceilingHeightFt: '',
      permittedUse: '',
    },
  });

  const category = watch('category');
  const subtype = watch('subtype');
  const isPlot = useMemo(() => isPlotType(subtype), [subtype]);

  // Warn about unsaved changes before leaving page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !isSubmittedRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Restore draft backup from sessionStorage (safe try/catch, project-scoped)
  useEffect(() => {
    try {
      const storageKey = `realcrm_draft_${effectiveProjectId || 'new'}`;
      const saved = sessionStorage.getItem(storageKey);
      if (saved && !project) {
        const parsed = JSON.parse(saved);
        if (parsed?.values) {
          reset(parsed.values);
        }
        if (Array.isArray(parsed?.amenities) && parsed.amenities.length > 0) {
          setAmenitiesList(parsed.amenities);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, [effectiveProjectId, project, reset]);

  // Load project values when fetched from real database
  useEffect(() => {
    if (project) {
      const details = (project.details || {}) as Record<string, unknown>;
      reset({
        name: project.name || '',
        category: (project.category
          ? project.category.charAt(0) + project.category.slice(1).toLowerCase()
          : 'Residential') as 'Residential' | 'Commercial' | 'Industrial',
        status: project.status || 'DRAFT',
        subtype: project.subtype || 'Apartment',
        saleVsRent: (details.saleVsRent as 'SALE' | 'RENT' | 'LEASE') || 'SALE',
        priceDisplay: project.priceRange?.display || project.priceDisplay || '',
        address: project.location?.address || project.address || '',
        city: project.location?.city || project.city || 'Gurugram',
        state: project.location?.state || project.state || 'Haryana',
        pincode: project.location?.pincode || project.pincode || '122001',
        developer: (details.developer as string) || '',
        contactNumber: project.ownerContacts?.[0]?.phone || '+91 98765 43210',
        contactEmail: project.ownerContacts?.[0]?.email || (details.contactEmail as string) || '',
        website: (details.website as string) || '',
        reraNumber: project.reraNumber || '',
        // Residential
        bhk: (details.bhk as string) || '3 BHK',
        bathrooms: (details.bathrooms as string) || '3',
        areaSqFt: (details.areaSqFt as string) || '1850',
        floor: (details.floor as string) || 'Middle Floor',
        parking: (details.parking as string) || 'Covered',
        balconies: (details.balconies as string) || '2',
        facing: (details.facing as string) || 'North-East',
        furnishing: (details.furnishing as string) || 'Semi-Furnished',
        possession: (details.possession as string) || 'Ready to Move',
        // Commercial
        usableAreaSqFt: (details.usableAreaSqFt as string) || '',
        floorOrBuilding: (details.floorOrBuilding as string) || '',
        frontageFt: (details.frontageFt as string) || '',
        lifts: (details.lifts as string) || '',
        washrooms: (details.washrooms as string) || '',
        powerBackup: Boolean(details.powerBackup),
        commercialParking: (details.commercialParking as string) || '',
        lease: Boolean(details.lease),
        leaseTerms: (details.leaseTerms as string) || '',
        // Industrial
        industrialType: (details.industrialType as string) || '',
        accessRoadWidthFt: (details.accessRoadWidthFt as string) || '',
        powerLoadKw: (details.powerLoadKw as string) || '',
        loadingDocks: (details.loadingDocks as string) || '',
        ceilingHeightFt: (details.ceilingHeightFt as string) || '',
        permittedUse: (details.permittedUse as string) || '',
      });

      if (Array.isArray(project.amenities) && project.amenities.length > 0) {
        setAmenitiesList(project.amenities);
      }
    }
  }, [project, reset]);

  // Section completion calculations
  const values = watch();

  // Save draft backup to sessionStorage on edit (safe try/catch, project-scoped)
  useEffect(() => {
    if (isSubmittedRef.current) return;
    try {
      const storageKey = `realcrm_draft_${effectiveProjectId || 'new'}`;
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          values,
          amenities: amenitiesList,
          timestamp: Date.now(),
        })
      );
    } catch {
      // Ignore quota errors
    }
  }, [values, amenitiesList, effectiveProjectId]);

  const isSection1Complete = useMemo(() => {
    return Boolean(
      values.name &&
        values.name.trim().length >= 3 &&
        values.category &&
        values.address &&
        values.address.trim().length >= 3 &&
        values.city &&
        values.city.trim().length >= 2 &&
        values.pincode &&
        values.contactNumber &&
        values.priceDisplay
    );
  }, [values.name, values.category, values.address, values.city, values.pincode, values.contactNumber, values.priceDisplay]);

  const isSection2Complete = useMemo(() => {
    if (!values.subtype) return false;
    if (isPlot) return true;
    if (values.category?.toUpperCase() === 'RESIDENTIAL') {
      return Boolean(values.bhk || values.areaSqFt);
    }
    return true;
  }, [values.subtype, isPlot, values.category, values.bhk, values.areaSqFt]);

  const isSection3Complete = useMemo(() => {
    return amenitiesList.length > 0;
  }, [amenitiesList]);

  const hasApprovedCoverImage = useMemo(() => {
    if (!effectiveProjectId || projectMedia.length === 0) return false;
    return projectMedia.some(
      (m) => m.isCover && (m.isApproved || m.approvalStatus === 'APPROVED')
    );
  }, [effectiveProjectId, projectMedia]);

  // Count complete sections (out of 4)
  const completedSectionsCount = useMemo(() => {
    return [
      isSection1Complete,
      isSection2Complete,
      isSection3Complete,
      hasApprovedCoverImage,
    ].filter(Boolean).length;
  }, [isSection1Complete, isSection2Complete, isSection3Complete, hasApprovedCoverImage]);

  const isReady = Boolean(
    isSubmitSuccess ||
      project?.status?.toLowerCase() === 'ready' ||
      getValues('status')?.toLowerCase() === 'ready'
  );

  // Amenity Management
  const toggleAmenity = (item: string) => {
    setAmenitiesList((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const handleAddCustomAmenity = () => {
    const trimmed = customAmenity.trim();
    if (trimmed && !amenitiesList.includes(trimmed)) {
      setAmenitiesList((prev) => [...prev, trimmed]);
      setCustomAmenity('');
    }
  };

  const handleRemoveAmenity = (item: string) => {
    setAmenitiesList((prev) => prev.filter((a) => a !== item));
  };

  // Seamless Section Navigation (form values remain preserved in useForm & sessionStorage draft)
  const handleNavigateSection = (targetSection: number) => {
    if (targetSection === currentSection) return;
    setCurrentSection(targetSection);
  };

  // Per-Section Independent Save
  const handleSaveSection = async (sectionNumber: number) => {
    setIsSavingSection(true);

    try {
      if (sectionNumber === 1) {
        // Validate Section 1 fields with Zod
        const isValid = await trigger([
          'name',
          'category',
          'status',
          'address',
          'city',
          'state',
          'pincode',
          'developer',
          'contactNumber',
          'contactEmail',
          'website',
          'priceDisplay',
          'saleVsRent',
          'reraNumber',
        ]);

        if (!isValid) {
          toast({
            title: 'Incomplete Section',
            message: 'Please resolve required fields in Basic Information before continuing.',
            type: 'error',
          });
          setIsSavingSection(false);
          return;
        }

        const parsedPrice = parsePriceRange(getValues('priceDisplay'));
        const payload = {
          name: getValues('name').trim(),
          category: getValues('category').toUpperCase() as 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL',
          subtype: getValues('subtype') || (getValues('category') === 'Residential' ? 'Apartment' : getValues('category') === 'Commercial' ? 'Office' : 'Warehouse'),
          status: getValues('status') || 'DRAFT',
          reraNumber: getValues('reraNumber')?.trim() || '',
          location: {
            address: getValues('address').trim(),
            city: getValues('city').trim(),
            microMarket: getValues('address').split(',')[0]?.trim() || getValues('city').trim(),
            state: getValues('state')?.trim() || 'Haryana',
            pincode: getValues('pincode').trim(),
          },
          priceRange: {
            min: parsedPrice.min,
            max: parsedPrice.max,
            display: getValues('priceDisplay').trim(),
          },
          ownerContacts: [
            {
              name: getValues('developer') || 'Official Sales Desk',
              phone: getValues('contactNumber').trim(),
              email: getValues('contactEmail')?.trim() || undefined,
              role: 'Primary Inquiries',
            },
          ],
          details: {
            ...(project?.details || {}),
            developer: getValues('developer'),
            contactEmail: getValues('contactEmail'),
            website: getValues('website'),
            saleVsRent: getValues('saleVsRent'),
          },
        };

        if (effectiveProjectId) {
          await updateProjectMutation.mutateAsync({ id: effectiveProjectId, data: payload });
          toast({
            title: 'Basic Information Saved',
            message: 'Section 1 saved successfully to project draft.',
            type: 'success',
          });
        } else {
          const created = await createProjectMutation.mutateAsync(payload);
          setCreatedProjectId(created.id!);
          navigate(`/projects/${created.id}`, { replace: true });
          toast({
            title: 'Project Initialized',
            message: 'Basic Information saved. Continuing to Property Specifications.',
            type: 'success',
          });
        }

        setCurrentSection(2);
      } else if (sectionNumber === 2) {
        // Validate Section 2
        const isValid = await trigger(['subtype']);
        if (!isValid) {
          toast({
            title: 'Incomplete Section',
            message: 'Please select a valid property subtype.',
            type: 'error',
          });
          setIsSavingSection(false);
          return;
        }

        if (!effectiveProjectId) {
          toast({
            title: 'Project Not Initialized',
            message: 'Please complete Section 1 first to create the project draft.',
            type: 'warning',
          });
          setCurrentSection(1);
          setIsSavingSection(false);
          return;
        }

        const details = {
          ...(project?.details || {}),
          // Residential
          bhk: getValues('bhk'),
          bathrooms: getValues('bathrooms'),
          areaSqFt: getValues('areaSqFt'),
          floor: getValues('floor'),
          parking: getValues('parking'),
          balconies: getValues('balconies'),
          facing: getValues('facing'),
          furnishing: getValues('furnishing'),
          possession: getValues('possession'),
          // Commercial
          usableAreaSqFt: getValues('usableAreaSqFt'),
          floorOrBuilding: getValues('floorOrBuilding'),
          frontageFt: getValues('frontageFt'),
          lifts: getValues('lifts'),
          washrooms: getValues('washrooms'),
          powerBackup: getValues('powerBackup'),
          commercialParking: getValues('commercialParking'),
          lease: getValues('lease'),
          leaseTerms: getValues('leaseTerms'),
          // Industrial
          industrialType: getValues('industrialType'),
          accessRoadWidthFt: getValues('accessRoadWidthFt'),
          powerLoadKw: getValues('powerLoadKw'),
          loadingDocks: getValues('loadingDocks'),
          ceilingHeightFt: getValues('ceilingHeightFt'),
          permittedUse: getValues('permittedUse'),
        };

        await updateProjectMutation.mutateAsync({
          id: effectiveProjectId,
          data: {
            subtype: getValues('subtype'),
            details,
          },
        });

        toast({
          title: 'Specifications Saved',
          message: 'Property Specifications saved successfully.',
          type: 'success',
        });

        setCurrentSection(3);
      } else if (sectionNumber === 3) {
        if (!effectiveProjectId) {
          toast({
            title: 'Project Not Initialized',
            message: 'Please complete Section 1 first.',
            type: 'warning',
          });
          setCurrentSection(1);
          setIsSavingSection(false);
          return;
        }

        await updateProjectMutation.mutateAsync({
          id: effectiveProjectId,
          data: {
            amenities: amenitiesList,
          },
        });

        toast({
          title: 'Amenities Saved',
          message: `${amenitiesList.length} amenities saved successfully.`,
          type: 'success',
        });

        setCurrentSection(4);
      } else if (sectionNumber === 4) {
        toast({
          title: 'Photos & Videos Configured',
          message: 'All uploaded visual assets are persisted to storage.',
          type: 'info',
        });
      }
    } catch (err: unknown) {
      const apiErr = err as {
        response?: {
          data?: {
            error?: {
              message?: string;
              code?: string;
            };
          };
        };
      };
      const displayMessage =
        apiErr.response?.data?.error?.message ||
        (err instanceof Error ? err.message : 'Could not save section changes.');

      toast({
        title: 'Save Failed',
        message: displayMessage,
        type: 'error',
      });
    } finally {
      setIsSavingSection(false);
      setAutoSaveTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  };

  // Final "Finish & Mark as Ready" Action
  const handleFinishAndMarkAsReady = async () => {
    const locationState = location.state as { fromOnboarding?: boolean } | null;
    const isOnboarding = searchParams.get('onboarding') === 'true' || Boolean(locationState?.fromOnboarding);
    const destination = isOnboarding ? '/dashboard' : '/projects';

    // If already confirmed ready, navigate immediately
    if (isReady) {
      toast({
        title: 'Project is Ready',
        message: 'Redirecting to project catalog...',
        type: 'info',
      });
      navigate(destination);
      return;
    }

    if (isSubmittingRef.current || isSubmittingFinal) return;

    const currentValues = getValues();
    const issues: Array<{ section: number; field: string; message: string }> = [];

    // Clear previous errors first
    clearErrors();

    // 1. Section 1 validation
    if (!currentValues.name || currentValues.name.trim().length < 3) {
      issues.push({ section: 1, field: 'name', message: 'Project title must be at least 3 characters' });
    }
    if (!currentValues.category) {
      issues.push({ section: 1, field: 'category', message: 'Category is required' });
    }
    if (!currentValues.address || currentValues.address.trim().length < 3) {
      issues.push({ section: 1, field: 'address', message: 'Street address is required' });
    }
    if (!currentValues.city || currentValues.city.trim().length < 2) {
      issues.push({ section: 1, field: 'city', message: 'City is required' });
    }
    if (!currentValues.pincode || currentValues.pincode.trim().length < 3) {
      issues.push({ section: 1, field: 'pincode', message: 'Postal code is required' });
    }
    if (!currentValues.contactNumber || currentValues.contactNumber.trim().length < 8) {
      issues.push({ section: 1, field: 'contactNumber', message: 'Official contact phone is required' });
    }
    if (!currentValues.priceDisplay || currentValues.priceDisplay.trim().length < 1) {
      issues.push({ section: 1, field: 'priceDisplay', message: 'Pricing range display is required' });
    }

    // 2. Section 2 validation
    if (!currentValues.subtype) {
      issues.push({ section: 2, field: 'subtype', message: 'Property subtype is required' });
    } else if (isPlotType(currentValues.subtype)) {
      if (currentValues.bhk || currentValues.floor || currentValues.furnishing) {
        issues.push({ section: 2, field: 'subtype', message: 'Plots cannot specify BHK, floor, or furnishing' });
      }
    } else if (currentValues.category?.toUpperCase() === 'RESIDENTIAL') {
      if (!currentValues.areaSqFt) {
        issues.push({ section: 2, field: 'areaSqFt', message: 'Carpet area is required for residential property' });
      }
      if (!currentValues.bhk) {
        issues.push({ section: 2, field: 'bhk', message: 'BHK configuration is required for residential property' });
      }
    }

    // 3. Section 4 Media validation
    const hasApprovedCover = projectMedia.some(
      (m) => m.isCover && (m.isApproved || m.approvalStatus === 'APPROVED')
    );

    if (!hasApprovedCover) {
      issues.push({
        section: 4,
        field: 'coverImage',
        message: 'At least one approved cover image is required in Photos & Videos',
      });
    }

    const missingCategoryAsset = projectMedia.find((m) => !m.category);
    if (missingCategoryAsset) {
      issues.push({
        section: 4,
        field: 'category',
        message: `Every uploaded file must have an assigned category (${missingCategoryAsset.filename || missingCategoryAsset.fileName || 'asset'})`,
      });
    }

    const missingRightsConsentAsset = projectMedia.find(
      (m) => !(m.rightsConsent?.confirmed === true || m.rightsConsentConfirmed === true)
    );
    if (missingRightsConsentAsset) {
      issues.push({
        section: 4,
        field: 'rightsConsent',
        message: `Rights consent must be confirmed for all media assets (${missingRightsConsentAsset.filename || missingRightsConsentAsset.fileName || 'asset'})`,
      });
    }

    const failedOrInProgressAsset = projectMedia.find(
      (m) => m.processingStatus === 'failed' || m.processingStatus === 'processing'
    );
    if (failedOrInProgressAsset) {
      issues.push({
        section: 4,
        field: 'processingStatus',
        message: `Media assets have pending or failed uploads (${failedOrInProgressAsset.filename || failedOrInProgressAsset.fileName || 'asset'})`,
      });
    }

    // IF INVALID: stay on page, do not navigate, show errors, switch to first invalid section
    if (issues.length > 0) {
      setSummaryIssues(issues);
      const invalidSections = Array.from(new Set(issues.map((i) => i.section)));
      setInvalidSectionIds(invalidSections);

      const firstSection = invalidSections[0];
      setCurrentSection(firstSection);

      issues.forEach((issue) => {
        setError(issue.field as Path<ProjectFormData>, { type: 'manual', message: issue.message });
      });

      setTimeout(() => {
        const firstField = issues[0]?.field;
        if (firstField) {
          const el = document.querySelector(`[name="${firstField}"]`) as HTMLElement | null;
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.focus();
          }
        }
      }, 150);

      toast({
        title: 'Validation Errors',
        message: `Please resolve ${issues.length} issue(s) before marking as ready.`,
        type: 'error',
      });
      return;
    }

    // IF VALID:
    setSummaryIssues([]);
    setInvalidSectionIds([]);

    isSubmittingRef.current = true;
    setIsSubmittingFinal(true);

    try {
      let targetProjectId = effectiveProjectId;

      // 1. Flush Section 1/2/3 data
      const parsedPrice = parsePriceRange(currentValues.priceDisplay);
      const payload = {
        name: currentValues.name.trim(),
        category: currentValues.category.toUpperCase() as 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL',
        subtype: currentValues.subtype || 'Apartment',
        status: currentValues.status || 'DRAFT',
        reraNumber: currentValues.reraNumber?.trim() || '',
        location: {
          address: currentValues.address.trim(),
          city: currentValues.city.trim(),
          microMarket: currentValues.address.split(',')[0]?.trim() || currentValues.city.trim(),
          state: currentValues.state?.trim() || 'Haryana',
          pincode: currentValues.pincode.trim(),
        },
        priceRange: {
          min: parsedPrice.min,
          max: parsedPrice.max,
          display: currentValues.priceDisplay.trim(),
        },
        ownerContacts: [
          {
            name: currentValues.developer || 'Official Sales Desk',
            phone: currentValues.contactNumber.trim(),
            email: currentValues.contactEmail?.trim() || undefined,
            role: 'Primary Inquiries',
          },
        ],
        amenities: amenitiesList,
        details: {
          ...(project?.details || {}),
          developer: currentValues.developer,
          contactEmail: currentValues.contactEmail,
          website: currentValues.website,
          saleVsRent: currentValues.saleVsRent,
          // Residential
          bhk: currentValues.bhk,
          bathrooms: currentValues.bathrooms,
          areaSqFt: currentValues.areaSqFt,
          floor: currentValues.floor,
          parking: currentValues.parking,
          balconies: currentValues.balconies,
          facing: currentValues.facing,
          furnishing: currentValues.furnishing,
          possession: currentValues.possession,
          // Commercial
          usableAreaSqFt: currentValues.usableAreaSqFt,
          floorOrBuilding: currentValues.floorOrBuilding,
          frontageFt: currentValues.frontageFt,
          lifts: currentValues.lifts,
          washrooms: currentValues.washrooms,
          powerBackup: currentValues.powerBackup,
          commercialParking: currentValues.commercialParking,
          lease: currentValues.lease,
          leaseTerms: currentValues.leaseTerms,
          // Industrial
          industrialType: currentValues.industrialType,
          accessRoadWidthFt: currentValues.accessRoadWidthFt,
          powerLoadKw: currentValues.powerLoadKw,
          loadingDocks: currentValues.loadingDocks,
          ceilingHeightFt: currentValues.ceilingHeightFt,
          permittedUse: currentValues.permittedUse,
        },
      };

      let currentVersion = project?.version;
      if (targetProjectId) {
        const updated = await updateProjectMutation.mutateAsync({ id: targetProjectId, data: payload });
        if (updated?.version !== undefined) {
          currentVersion = updated.version;
        }
      } else {
        const created = await createProjectMutation.mutateAsync(payload);
        targetProjectId = created.id!;
        setCreatedProjectId(created.id!);
        if (created?.version !== undefined) {
          currentVersion = created.version;
        }
      }

      // 2. Call POST /api/v1/projects/:id/submit
      const submitResult = await submitProjectMutation.mutateAsync({
        id: targetProjectId,
        version: currentVersion,
      });

      const confirmedStatus = submitResult.project?.status?.toLowerCase();
      if (confirmedStatus !== 'ready') {
        throw new Error('Database write could not confirm ready status.');
      }

      // 3. Mark success
      isSubmittedRef.current = true;
      setIsSubmitSuccess(true);

      // Invalidate queries so all catalog lists update immediately
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', targetProjectId] });

      // Clear sessionStorage draft on success
      try {
        sessionStorage.removeItem(`realcrm_draft_${targetProjectId}`);
        sessionStorage.removeItem('realcrm_draft_new');
      } catch {
        // ignore
      }

      toast({
        title: 'Project Saved and Marked Ready!',
        message: submitResult.message || 'Project specifications and assets confirmed ready.',
        type: 'success',
      });

      // Navigate to project catalog (or /dashboard for onboarding)
      setTimeout(() => {
        navigate(destination);
      }, 600);
    } catch (err: unknown) {
      const apiErr = err as {
        response?: {
          status?: number;
          data?: {
            error?: {
              message?: string;
              details?: Array<{ section: number; field: string; message: string }>;
            };
          };
        };
      };

      // 409 Conflict: version mismatch
      if (apiErr.response?.status === 409) {
        setConflictMessage(
          apiErr.response?.data?.error?.message ||
            'This project has been updated in another session. Would you like to reload the latest version or keep your local changes?'
        );
        setConflictModalOpen(true);
        return;
      }

      // 401 Session expired
      if (apiErr.response?.status === 401) {
        toast({
          title: 'Session Expired',
          message: 'Your login session has expired. All changes remain saved locally in your draft. Please log in again.',
          type: 'error',
        });
        return;
      }

      // 403 Permission denied
      if (apiErr.response?.status === 403) {
        toast({
          title: 'Permission Denied',
          message: 'You do not have permission to mark projects as ready.',
          type: 'error',
        });
        return;
      }

      // 400 / 422 Validation errors from server
      const backendDetails = apiErr.response?.data?.error?.details;
      if (Array.isArray(backendDetails) && backendDetails.length > 0) {
        setSummaryIssues(backendDetails);
        const invalidSections = Array.from(new Set(backendDetails.map((d) => d.section)));
        setInvalidSectionIds(invalidSections);
        if (invalidSections[0]) {
          setCurrentSection(invalidSections[0]);
        }
        backendDetails.forEach((d) => {
          if (d.field) {
            setError(d.field as Path<ProjectFormData>, { type: 'manual', message: d.message });
          }
        });
        toast({
          title: 'Validation Failed',
          message: apiErr.response?.data?.error?.message || 'Please fix the highlighted errors.',
          type: 'error',
        });
        return;
      }

      toast({
        title: 'Submission Failed',
        message: err instanceof Error ? err.message : 'Could not submit project. Please try again.',
        type: 'error',
      });
    } finally {
      isSubmittingRef.current = false;
      setIsSubmittingFinal(false);
    }
  };

  // Unit Inventory Management
  const handleOpenAddUnitModal = () => {
    setEditingUnitId(null);
    setUnitName('');
    setUnitBhk('2 BHK');
    setUnitArea('1450');
    setUnitPrice('₹ 1.65 Cr');
    setUnitStatus('AVAILABLE');
    setUnitErrors({});
    setIsUnitModalOpen(true);
  };

  const handleOpenEditUnitModal = (unit: BackendUnit) => {
    setEditingUnitId(unit.id || unit._id || null);
    setUnitName(unit.unitNumber);
    setUnitBhk(unit.unitType || '2 BHK');
    setUnitArea(String(unit.carpetAreaSqFt || ''));
    setUnitPrice(unit.priceDisplay || `₹ ${(unit.price / 10000000).toFixed(2)} Cr`);
    setUnitStatus(unit.status || 'AVAILABLE');
    setUnitErrors({});
    setIsUnitModalOpen(true);
  };

  const handleSaveUnit = async () => {
    const trimmedName = unitName.trim();
    const numericArea = Number(unitArea);
    const trimmedPrice = unitPrice.trim();
    const numericPrice = parsePriceToNumber(trimmedPrice);

    const errs: { name?: string; area?: string; price?: string } = {};
    if (!trimmedName) errs.name = 'Unit number / identifier is required';
    if (!numericArea || isNaN(numericArea) || numericArea <= 0) errs.area = 'Valid carpet area is required';
    if (!numericPrice || isNaN(numericPrice) || numericPrice <= 0) errs.price = 'Valid price is required';

    if (Object.keys(errs).length > 0) {
      setUnitErrors(errs);
      return;
    }

    if (!effectiveProjectId) {
      toast({
        title: 'Project Not Saved',
        message: 'Please complete Section 1 first to create the project before adding units.',
        type: 'warning',
      });
      return;
    }

    try {
      if (editingUnitId) {
        await updateUnitMutation.mutateAsync({
          unitId: editingUnitId,
          data: {
            unitNumber: trimmedName,
            unitType: isPlot ? 'Plot' : unitBhk,
            carpetAreaSqFt: numericArea,
            price: numericPrice,
            priceDisplay: trimmedPrice,
            status: unitStatus,
            changeReason: 'Updated via project editor',
          },
        });
        toast({
          title: 'Unit Updated',
          message: `Updated inventory for "${trimmedName}"`,
          type: 'success',
        });
      } else {
        await createUnitMutation.mutateAsync({
          unitNumber: trimmedName,
          unitType: isPlot ? 'Plot' : unitBhk,
          carpetAreaSqFt: numericArea,
          price: numericPrice,
          priceDisplay: trimmedPrice,
          status: unitStatus,
          attributes: isPlot ? {} : { bhk: unitBhk },
        });
        toast({
          title: 'Unit Added',
          message: `Added "${trimmedName}" to inventory`,
          type: 'success',
        });
      }
      setIsUnitModalOpen(false);
      setEditingUnitId(null);
    } catch (err: unknown) {
      toast({
        title: 'Unit Error',
        message: err instanceof Error ? err.message : 'Could not save unit',
        type: 'error',
      });
    }
  };

  const handleRemoveUnit = async (unitId?: string) => {
    if (!unitId) return;
    if (confirm('Delete this unit from database?')) {
      try {
        await deleteUnitMutation.mutateAsync(unitId);
        toast({ title: 'Unit Removed', message: 'Unit deleted from inventory', type: 'info' });
      } catch (err: unknown) {
        toast({
          title: 'Delete Failed',
          message: err instanceof Error ? err.message : 'Could not remove unit',
          type: 'error',
        });
      }
    }
  };

  // Inventory KPI metrics
  const unitStats = useMemo(() => {
    const total = units.length;
    const available = units.filter((u) => u.status === 'AVAILABLE').length;
    const blocked = units.filter((u) => u.status === 'BLOCKED').length;
    const sold = units.filter((u) => u.status === 'SOLD').length;
    return { total, available, blocked, sold };
  }, [units]);

  if (isProjectLoading && effectiveProjectId) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-100 animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 lg:col-span-3 space-y-3">
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
          <div className="md:col-span-8 lg:col-span-9 space-y-4">
            <Skeleton className="h-80 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/dashboard" className="hover:text-slate-900 transition-colors flex items-center gap-1">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <Link to="/projects" className="hover:text-slate-900 transition-colors">
          Property Catalog
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="text-slate-900 font-medium truncate max-w-[260px]">
          {isEditing ? (project?.name || getValues('name') || 'Edit Development') : 'New Development'}
        </span>
      </nav>

      {/* Sticky Top Header Bar */}
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3.5 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/projects">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ArrowLeft className="w-4 h-4 text-slate-600" />}
                className="rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 font-medium"
              >
                Back
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  {isEditing ? `Edit ${project?.name || getValues('name') || 'Property'}` : 'New Property Development'}
                </h1>
                <StatusBadge status={isReady ? 'ready' : getValues('status') || 'draft'} />
                {isPlot && (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    Plot Parcel
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 tabular-nums">
                <span className="flex items-center text-slate-600">
                  <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  Auto-saved {autoSaveTime}
                </span>
                <span className="text-slate-300">&bull;</span>
                <span className="font-medium text-slate-700">{completedSectionsCount} of 4 sections complete</span>
              </div>
            </div>
          </div>

          {/* Global Header Actions */}
          <div className="flex items-center gap-2.5 self-end md:self-auto">
            {effectiveProjectId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs tracking-wide"
                onClick={async () => {
                  try {
                    const res = await manualGenerateCreativesMutation.mutateAsync(effectiveProjectId);
                    toast({
                      title: 'Creatives Enqueued',
                      message: `${res.enqueued} creative job sets enqueued. Head to Creative Studio to review them.`,
                      type: 'success',
                    });
                  } catch (err: unknown) {
                    const msg =
                      err && typeof err === 'object' && 'response' in err
                        ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
                        : 'Generation failed';
                    toast({
                      title: 'Generation Failed',
                      message: msg || 'Could not enqueue creative generation.',
                      type: 'error',
                    });
                  }
                }}
                isLoading={manualGenerateCreativesMutation.isPending}
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-emerald-600" />}
              >
                Generate Creatives
              </Button>
            )}

            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={isSubmittingFinal}
              className={`rounded-xl text-xs font-semibold tracking-wide transition-all ${
                isReady
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : isSubmittingFinal
                  ? 'bg-slate-700 text-white cursor-wait'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
              }`}
              onClick={handleFinishAndMarkAsReady}
              title={isReady ? 'Project is ready — click to view in catalog' : 'Validate all 4 sections and mark project as ready'}
            >
              {isReady ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Ready in Catalog
                </>
              ) : isSubmittingFinal ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Validating &amp; Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Finish &amp; Mark as Ready
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'details' | 'units')}>
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
          <TabsList className="bg-slate-100/90 p-1 rounded-xl border border-slate-200/60 inline-flex">
            <TabsTrigger
              value="details"
              className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all flex items-center gap-2"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Project Specifications</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200/80 text-slate-700 font-bold tabular-nums">
                {completedSectionsCount}/4
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="units"
              className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all flex items-center gap-2"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Unit &amp; Tower Inventory</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold tabular-nums">
                {units.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ================= TAB 1: 4-SECTION PROJECT SPECIFICATIONS FORM ================= */}
        <TabsContent value="details" className="pt-4">
          {/* MOBILE STEPPER (Visible only on small screens) */}
          <div className="md:hidden mb-6 bg-white rounded-2xl border border-slate-200/80 p-3 shadow-sm">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {FORM_SECTIONS.map((sec) => {
                const isActive = currentSection === sec.id;
                const hasError = invalidSectionIds.includes(sec.id);
                const isComplete =
                  sec.id === 1
                    ? isSection1Complete
                    : sec.id === 2
                    ? isSection2Complete
                    : sec.id === 3
                    ? isSection3Complete
                    : hasApprovedCoverImage;

                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => handleNavigateSection(sec.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs whitespace-nowrap rounded-xl border font-medium transition-all ${
                      hasError
                        ? 'border-rose-300 bg-rose-50 text-rose-800 font-bold'
                        : isActive
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-sm'
                        : isComplete
                        ? 'border-slate-200 bg-slate-50 text-slate-800'
                        : 'border-transparent bg-slate-100/60 text-slate-500'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                        hasError
                          ? 'bg-rose-600 text-white'
                          : isComplete
                          ? 'bg-emerald-600 text-white'
                          : isActive
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {hasError ? (
                        <AlertCircle className="w-3.5 h-3.5 text-white" />
                      ) : isComplete ? (
                        <Check className="w-3.5 h-3.5 text-white" />
                      ) : (
                        sec.id
                      )}
                    </span>
                    <span>{sec.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MAIN 4-SECTION LAYOUT: Sticky Left Step List + Active Section Form */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* DESKTOP STICKY LEFT STEP LIST */}
            <div className="hidden md:block md:col-span-4 lg:col-span-3 sticky top-24 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-4 shadow-sm">
                {/* Header & Progress Summary */}
                <div className="space-y-2 border-b border-slate-100 pb-3">
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
                    Workflow Checklist
                  </span>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span>Specifications Progress</span>
                    <span className="tabular-nums text-emerald-600 font-semibold">{completedSectionsCount} of 4 complete</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${(completedSectionsCount / 4) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Vertical Step Items */}
                <nav className="space-y-2">
                  {FORM_SECTIONS.map((sec) => {
                    const isActive = currentSection === sec.id;
                    const hasError = invalidSectionIds.includes(sec.id);
                    const isComplete =
                      sec.id === 1
                        ? isSection1Complete
                        : sec.id === 2
                        ? isSection2Complete
                        : sec.id === 3
                        ? isSection3Complete
                        : hasApprovedCoverImage;

                    return (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => handleNavigateSection(sec.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-2 ${
                          hasError
                            ? 'border-rose-400 bg-rose-50/80 text-rose-900 ring-1 ring-rose-400'
                            : isActive
                            ? 'border-emerald-500 bg-emerald-50/50 text-slate-900 shadow-sm ring-1 ring-emerald-500'
                            : isComplete
                            ? 'border-slate-200/90 bg-white hover:border-slate-300 text-slate-800'
                            : 'border-slate-100 bg-slate-50/40 hover:bg-slate-50 text-slate-500'
                        }`}
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                hasError
                                  ? 'bg-rose-600 text-white'
                                  : isComplete
                                  ? 'bg-emerald-600 text-white'
                                  : isActive
                                  ? 'bg-slate-900 text-white'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {hasError ? (
                                <AlertCircle className="w-3.5 h-3.5 text-white" />
                              ) : isComplete ? (
                                <Check className="w-3 h-3 text-white" />
                              ) : (
                                sec.id
                              )}
                            </span>
                            <span
                              className={`text-xs font-bold truncate ${
                                hasError ? 'text-rose-800' : isActive ? 'text-slate-900' : 'text-slate-700'
                              }`}
                            >
                              {sec.label}
                            </span>
                            {sec.required && (
                              <span className="text-rose-500 font-bold" title="Required section">
                                *
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1 pl-7">
                            {sec.description}
                          </p>
                        </div>
                        {hasError && (
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </nav>

                {/* Mark as Ready Bottom Box */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmittingFinal}
                    className={`w-full text-xs font-bold tracking-wide rounded-xl transition-all ${
                      isReady
                        ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                        : isSubmittingFinal
                        ? 'bg-slate-700 text-white cursor-wait border-slate-700'
                        : 'bg-slate-900 text-white hover:bg-slate-800 border-slate-900 shadow-sm'
                    }`}
                    onClick={handleFinishAndMarkAsReady}
                  >
                    {isReady ? (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Ready in Catalog
                      </>
                    ) : isSubmittingFinal ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                        Finish &amp; Mark Ready
                      </>
                    )}
                  </Button>
                  <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                    {isReady
                      ? 'All specifications validated. Click to view in catalog.'
                      : 'Validates all 4 sections, checks RERA data, and updates status.'}
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: ACTIVE SECTION FORM */}
            <div className="col-span-12 md:col-span-8 lg:col-span-9 space-y-6">
              {/* SUMMARY ISSUES BANNER (aria-live="assertive") */}
              {summaryIssues.length > 0 && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="border border-rose-200 bg-rose-50/90 rounded-2xl p-4 text-xs text-rose-800 space-y-2 animate-in fade-in shadow-sm"
                >
                  <div className="flex items-center gap-2 text-rose-900 font-bold">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Submission Blocked — {summaryIssues.length} issue(s) detected</span>
                  </div>
                  <p className="text-slate-600 font-medium">
                    Please correct the following fields before marking this development as ready:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-rose-800">
                    {summaryIssues.map((issue, idx) => (
                      <li
                        key={idx}
                        className="cursor-pointer hover:underline"
                        onClick={() => {
                          setCurrentSection(issue.section);
                          setTimeout(() => {
                            const el = document.querySelector(`[name="${issue.field}"]`) as HTMLElement | null;
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              el.focus();
                            }
                          }, 150);
                        }}
                      >
                        <span className="font-semibold">
                          Section {issue.section} ({FORM_SECTIONS[issue.section - 1]?.label}):
                        </span>{' '}
                        {issue.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* SECTION FORM CARD */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 uppercase tracking-wider">
                        Section {currentSection} of 4
                      </span>
                      {FORM_SECTIONS[currentSection - 1].required && (
                        <span className="text-[11px] font-semibold text-rose-600">Required</span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                      {FORM_SECTIONS[currentSection - 1].title}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {FORM_SECTIONS[currentSection - 1].description}
                    </p>
                  </div>

                  {isDirty && (
                    <Badge variant="outline" className="border-amber-200 text-amber-800 bg-amber-50 text-xs self-start sm:self-auto">
                      Unsaved changes
                    </Badge>
                  )}
                </div>

                {/* ================= SECTION 1: BASIC INFORMATION ================= */}
                {currentSection === 1 && (
                  <div className="space-y-6 pt-1">
                    {/* Identity & Classification Sub-Card */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                        Identity &amp; Classification
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Project Title / Marketing Name *"
                          placeholder="e.g. DLF The Arbour"
                          error={errors.name?.message}
                          {...register('name')}
                        />

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                            Typology Category *
                          </label>
                          <select
                            {...register('category')}
                            className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                          >
                            <option value="Residential">Residential Development</option>
                            <option value="Commercial">Commercial Complex</option>
                            <option value="Industrial">Industrial &amp; Logistics</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                            Development Status *
                          </label>
                          <select
                            {...register('status')}
                            className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                          >
                            <option value="DRAFT">DRAFT (Unpublished)</option>
                            <option value="ACTIVE">ACTIVE (Marketing Phase)</option>
                            <option value="SOLD_OUT">SOLD OUT</option>
                            <option value="ARCHIVED">ARCHIVED</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                            Commercial Intent *
                          </label>
                          <select
                            {...register('saleVsRent')}
                            className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                          >
                            <option value="SALE">SALE / FREEHOLD</option>
                            <option value="RENT">RENTAL</option>
                            <option value="LEASE">LONG-TERM LEASE</option>
                          </select>
                        </div>

                        <Input
                          label="Pricing Range Display *"
                          placeholder="e.g. ₹ 1.5 Cr - ₹ 3.5 Cr"
                          error={errors.priceDisplay?.message}
                          {...register('priceDisplay')}
                        />
                      </div>
                    </div>

                    {/* Geo-Location & Physical Address Sub-Card */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        Location &amp; Postal Address
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <Input
                            label="Street Address / Location *"
                            placeholder="e.g. Sector 63, Golf Course Extension Road"
                            error={errors.address?.message}
                            {...register('address')}
                          />
                        </div>
                        <Input
                          label="City *"
                          placeholder="e.g. Gurugram"
                          error={errors.city?.message}
                          {...register('city')}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Input
                          label="State"
                          placeholder="e.g. Haryana"
                          error={errors.state?.message}
                          {...register('state')}
                        />
                        <Input
                          label="Postal Code *"
                          placeholder="e.g. 122001"
                          error={errors.pincode?.message}
                          {...register('pincode')}
                        />
                        <Input
                          label="Developer / Builder"
                          placeholder="e.g. DLF Limited"
                          error={errors.developer?.message}
                          {...register('developer')}
                        />
                      </div>
                    </div>

                    {/* Developer Contacts & Website Sub-Card */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        Developer &amp; Inquiries Contact
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                          label="Official Contact Phone *"
                          placeholder="e.g. +91 98765 43210"
                          error={errors.contactNumber?.message}
                          {...register('contactNumber')}
                        />
                        <Input
                          label="Official Inquiries Email"
                          placeholder="e.g. sales@dlf.in"
                          error={errors.contactEmail?.message}
                          {...register('contactEmail')}
                        />
                        <Input
                          label="Project Website URL"
                          placeholder="e.g. https://dlf.in/the-arbour"
                          error={errors.website?.message}
                          {...register('website')}
                        />
                      </div>
                    </div>

                    {/* Statutory RERA Compliance Sub-Card */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          RERA Registration &amp; Compliance
                        </h3>
                        <span className="text-[11px] text-slate-400">Statutory Disclosure</span>
                      </div>

                      <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 space-y-3">
                        <Input
                          label="RERA Registration Certificate Number"
                          placeholder="e.g. RC/REP/HARERA/GGM/680/412/2023/24"
                          error={errors.reraNumber?.message}
                          {...register('reraNumber')}
                        />
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Enter the official project RERA number issued by the state regulatory authority (e.g. MahaRERA, HRERA, UP-RERA, K-RERA). If registration is pending, you may leave this field blank during draft preparation.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ================= SECTION 2: PROPERTY SPECIFICATIONS ================= */}
                {currentSection === 2 && (
                  <div className="space-y-6 pt-1">
                    {/* Subtype Dropdown */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Property Subtype Specification *
                      </label>
                      <select
                        {...register('subtype')}
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                      >
                        {category === 'Residential' ? (
                          <>
                            <option value="Apartment">Apartment (Standard Multistory)</option>
                            <option value="Penthouse">Penthouse</option>
                            <option value="Villa">Independent Villa / Bungalow</option>
                            <option value="Studio">Studio Apartment</option>
                            <option value="Plots">Residential Plots (Land)</option>
                            <option value="Row House">Row House / Builder Floor</option>
                          </>
                        ) : category === 'Commercial' ? (
                          <>
                            <option value="Office">Grade-A Corporate Office</option>
                            <option value="Retail">Retail Shop / High Street</option>
                            <option value="Warehouse">Commercial Warehouse</option>
                            <option value="Commercial Plot">Commercial Land / SCO</option>
                            <option value="Showroom">Automobile / Flagship Showroom</option>
                          </>
                        ) : (
                          <>
                            <option value="Factory">Industrial Factory</option>
                            <option value="Warehouse">Logistics &amp; Distribution Warehouse</option>
                            <option value="Cold Storage">Cold Storage Facility</option>
                            <option value="Industrial Land">Industrial Plot / Land</option>
                            <option value="Shed">Industrial Shed / Workshop</option>
                          </>
                        )}
                      </select>
                      {errors.subtype && (
                        <p className="text-xs text-rose-600 mt-1 font-medium">{errors.subtype.message}</p>
                      )}
                    </div>

                    {/* RESIDENTIAL FIELDS */}
                    {category === 'Residential' && (
                      <div className="space-y-4">
                        {isPlot ? (
                          <div className="p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/50 text-xs text-slate-700 space-y-2">
                            <div className="flex items-center gap-1.5 font-bold text-emerald-900 uppercase">
                              <Compass className="w-4 h-4 text-emerald-600" />
                              Residential Plot / Land Parcel Rules
                            </div>
                            <p className="text-slate-600">
                              Plots represent unbuilt land parcels and cannot specify BHK configurations, floor numbers, or furnishings.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                              <Input
                                label="Plot Area (Sq. Yards / Sq. Ft)"
                                placeholder="e.g. 250 Sq.Yds"
                                {...register('areaSqFt')}
                              />
                              <Input
                                label="Plot Facing Direction"
                                placeholder="e.g. North-East"
                                {...register('facing')}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <Input
                                label="BHK Configuration"
                                placeholder="e.g. 3 BHK or 4 BHK + Servant"
                                error={errors.bhk?.message}
                                {...register('bhk')}
                              />
                              <Input
                                label="Bathrooms"
                                placeholder="e.g. 3"
                                error={errors.bathrooms?.message}
                                {...register('bathrooms')}
                              />
                              <Input
                                label="Carpet Area (Sq. Ft.)"
                                placeholder="e.g. 1850"
                                error={errors.areaSqFt?.message}
                                {...register('areaSqFt')}
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <Input
                                label="Floor / Total Floors"
                                placeholder="e.g. 14th of 32 Floors"
                                {...register('floor')}
                              />
                              <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                  Furnishing Status
                                </label>
                                <select
                                  {...register('furnishing')}
                                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                                >
                                  <option value="Unfurnished">Unfurnished</option>
                                  <option value="Semi-Furnished">Semi-Furnished</option>
                                  <option value="Fully-Furnished">Fully-Furnished</option>
                                </select>
                              </div>
                              <Input
                                label="Possession Timeline"
                                placeholder="e.g. Ready to Move or Dec 2026"
                                {...register('possession')}
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <Input
                                label="Facing Direction"
                                placeholder="e.g. North-East / Park Facing"
                                {...register('facing')}
                              />
                              <Input
                                label="Balconies"
                                placeholder="e.g. 3 Balconies"
                                {...register('balconies')}
                              />
                              <Input
                                label="Car Parking"
                                placeholder="e.g. 2 Covered Car Parks"
                                {...register('parking')}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* COMMERCIAL FIELDS */}
                    {category === 'Commercial' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <Input
                            label="Usable Carpet Area (Sq. Ft.)"
                            placeholder="e.g. 4500"
                            {...register('usableAreaSqFt')}
                          />
                          <Input
                            label="Floor / Wing Specification"
                            placeholder="e.g. 8th Floor, North Wing"
                            {...register('floorOrBuilding')}
                          />
                          <Input
                            label="Frontage (Ft)"
                            placeholder="e.g. 45 Ft"
                            {...register('frontageFt')}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <Input
                            label="Elevators / Lifts"
                            placeholder="e.g. 6 High Speed + 2 Service"
                            {...register('lifts')}
                          />
                          <Input
                            label="Washroom Provision"
                            placeholder="e.g. Private Executive + Common"
                            {...register('washrooms')}
                          />
                          <Input
                            label="Parking Slots"
                            placeholder="e.g. 10 Dedicated Basement"
                            {...register('commercialParking')}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                          <label className="flex items-center gap-2.5 text-xs text-slate-800 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              {...register('powerBackup')}
                              className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                            />
                            <span className="font-medium">100% Full DG Power Backup Included</span>
                          </label>

                          <label className="flex items-center gap-2.5 text-xs text-slate-800 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              {...register('lease')}
                              className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                            />
                            <span className="font-medium">Pre-Leased Commercial Asset</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* INDUSTRIAL FIELDS */}
                    {category === 'Industrial' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <Input
                            label="Industry Classification"
                            placeholder="e.g. Heavy Manufacturing / FMCG"
                            {...register('industrialType')}
                          />
                          <Input
                            label="Access Road Width (Ft)"
                            placeholder="e.g. 60 Ft Wide Arterial Road"
                            {...register('accessRoadWidthFt')}
                          />
                          <Input
                            label="Sanctioned Power Load"
                            placeholder="e.g. 500 kVA Connected Load"
                            {...register('powerLoadKw')}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <Input
                            label="Loading Docks"
                            placeholder="e.g. 4 Hydraulic Docks"
                            {...register('loadingDocks')}
                          />
                          <Input
                            label="Clear Ceiling Height (Ft)"
                            placeholder="e.g. 36 Ft Clear Height"
                            {...register('ceilingHeightFt')}
                          />
                          <Input
                            label="Zoning / Permitted Use"
                            placeholder="e.g. Orange / Green Industrial Zone"
                            {...register('permittedUse')}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ================= SECTION 3: AMENITIES & FEATURES ================= */}
                {currentSection === 3 && (
                  <div className="space-y-6 pt-1">
                    <p className="text-xs text-slate-500">
                      Select all standard amenities present at the site or enter project-specific custom features for brochure and collateral generation.
                    </p>

                    {/* Selected Amenities Chips */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                          Selected Development Features ({amenitiesList.length})
                        </span>
                        {amenitiesList.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setAmenitiesList([])}
                            className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            Clear all
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 min-h-[44px] p-3 rounded-xl border border-slate-200/80 bg-slate-50/60">
                        {amenitiesList.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">
                            No amenities selected yet. Select from the presets below or add custom features.
                          </span>
                        ) : (
                          amenitiesList.map((amenity) => (
                            <span
                              key={amenity}
                              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-slate-900 text-white rounded-lg shadow-sm"
                            >
                              <span>{amenity}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveAmenity(amenity)}
                                className="hover:text-rose-300 focus:outline-none ml-0.5 cursor-pointer"
                                title={`Remove ${amenity}`}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Preset Amenities Chips Grid */}
                    <div className="space-y-2.5 pt-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        Preset Real Estate Amenities
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {PRESET_AMENITIES.map((item) => {
                          const isSelected = amenitiesList.includes(item);
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => toggleAmenity(item)}
                              className={`p-2.5 text-xs text-left rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-emerald-600 bg-emerald-50/70 font-semibold text-emerald-950 shadow-sm'
                                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <span className="truncate">{item}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom Amenity Input */}
                    <div className="space-y-2 pt-3 border-t border-slate-100">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        Add Custom Feature / Facility
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customAmenity}
                          onChange={(e) => setCustomAmenity(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomAmenity();
                            }
                          }}
                          placeholder="e.g. Helipad, Concierge 24x7, Golf Simulator, Cigar Lounge..."
                          className="flex-1 p-2.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddCustomAmenity}
                          className="rounded-xl border-slate-300 text-slate-800 hover:bg-slate-50 text-xs font-semibold px-4"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          Add Feature
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ================= SECTION 4: PHOTOS & VIDEOS ================= */}
                {currentSection === 4 && (
                  <div className="space-y-4 pt-1">
                    {effectiveProjectId ? (
                      <ProjectMediaSection
                        projectId={effectiveProjectId}
                        units={units}
                      />
                    ) : (
                      <EmptyState
                        icon={<ImageIcon className="w-10 h-10 text-slate-400" />}
                        title="Save Basic Info First"
                        description="Please complete Section 1 to initialize your project draft before uploading photos, floor plans, and videos."
                        actionLabel="Go to Section 1"
                        onAction={() => setCurrentSection(1)}
                      />
                    )}
                  </div>
                )}

                {/* SECTION FOOTER ACTIONS (BACK / SAVE & CONTINUE) */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={currentSection === 1}
                    onClick={() => handleNavigateSection(currentSection - 1)}
                    leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                    className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
                  >
                    Previous Section
                  </Button>

                  <div className="flex items-center gap-2.5">
                    {currentSection < 4 ? (
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        isLoading={isSavingSection}
                        onClick={() => handleSaveSection(currentSection)}
                        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                        className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm"
                      >
                        Save &amp; Continue
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        disabled={isSubmittingFinal}
                        onClick={handleFinishAndMarkAsReady}
                        className={`rounded-xl text-xs font-semibold transition-all ${
                          isReady
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : isSubmittingFinal
                            ? 'bg-slate-700 text-white cursor-wait'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                        }`}
                      >
                        {isReady ? (
                          <>
                            <Check className="w-3.5 h-3.5 mr-1.5" />
                            Ready in Catalog
                          </>
                        ) : isSubmittingFinal ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            Validating &amp; Saving...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                            Finish &amp; Mark as Ready
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ================= TAB 2: INVENTORY & CONFIGURED UNITS ================= */}
        <TabsContent value="units" className="pt-4 space-y-6">
          {/* Inventory KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Total Configured
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                {unitStats.total}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Towers &amp; residences</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
                Available for Sale
              </span>
              <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
                {unitStats.available}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Active marketing inventory</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">
                Reserved / Blocked
              </span>
              <div className="text-2xl font-bold text-amber-700 mt-1 tabular-nums">
                {unitStats.blocked}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Token / EOI locked</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Sold Out
              </span>
              <div className="text-2xl font-bold text-slate-700 mt-1 tabular-nums">
                {unitStats.sold}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Executed registrations</p>
            </div>
          </div>

          {/* Table Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Project Inventory &amp; Configured Units ({units.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage specific apartments, villas, commercial suites, carpet areas, and live availability logs.
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleOpenAddUnitModal}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm self-start sm:self-auto"
            >
              Add Property Unit
            </Button>
          </div>

          {units.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-10 shadow-sm">
              <EmptyState
                icon={<Layers className="w-10 h-10 text-slate-400" />}
                title="No Units Configured in Inventory"
                description="Add individual apartments, plots, or commercial suites to track real-time availability and generate unit-specific marketing collateral."
                actionLabel="Add First Unit"
                onAction={handleOpenAddUnitModal}
              />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Unit Identifier</th>
                      <th className="py-3.5 px-4">Typology</th>
                      <th className="py-3.5 px-4">Carpet Area</th>
                      <th className="py-3.5 px-4">Price Display</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {units.map((unit) => {
                      const isAvailable = unit.status === 'AVAILABLE';
                      const isBlocked = unit.status === 'BLOCKED';
                      const isSold = unit.status === 'SOLD';

                      return (
                        <tr key={unit.id} className="hover:bg-slate-50/70 transition-colors h-14">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                              <span>{unit.unitNumber}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-medium">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">
                              {unit.unitType}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 tabular-nums font-medium">
                            {unit.carpetAreaSqFt} sq ft
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900 tabular-nums">
                            {unit.priceDisplay || `₹ ${(unit.price / 10000000).toFixed(2)} Cr`}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                isAvailable
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : isBlocked
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : isSold
                                  ? 'bg-slate-100 text-slate-600 border-slate-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              {unit.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                            {unit.changeHistory && unit.changeHistory.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setSelectedUnitForHistory(unit)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                title="View Price &amp; Status Audit History"
                              >
                                <History className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenEditUnitModal(unit)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                              title="Edit Unit Specifications"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveUnit(unit.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Unit"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* UNIT CHANGE HISTORY AUDIT MODAL */}
          <Modal open={Boolean(selectedUnitForHistory)} onOpenChange={(open) => !open && setSelectedUnitForHistory(null)}>
            <ModalContent className="sm:max-w-md rounded-2xl">
              <ModalHeader>
                <ModalTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <History className="w-5 h-5 text-emerald-600" />
                  Price &amp; Availability Audit History
                </ModalTitle>
                <ModalDescription className="text-xs text-slate-500">
                  Recorded audit trail of price changes and status progressions for {selectedUnitForHistory?.unitNumber}.
                </ModalDescription>
              </ModalHeader>
              <div className="space-y-3 py-2 max-h-80 overflow-y-auto">
                {selectedUnitForHistory?.changeHistory?.map((h, i) => (
                  <div key={i} className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/70 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span className="uppercase tracking-wider text-[11px] text-slate-500">{h.field}</span>
                      <span className="text-slate-400 font-normal">{new Date(h.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div className="text-slate-800">
                      <span className="line-through text-rose-600 mr-2">{String(h.oldValue)}</span>
                      <span className="font-bold text-emerald-700">&rarr; {String(h.newValue)}</span>
                    </div>
                    {h.reason && <p className="text-[11px] text-slate-500 italic">{h.reason}</p>}
                  </div>
                ))}
              </div>
              <ModalFooter>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedUnitForHistory(null)}
                  className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
                >
                  Close
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          {/* ADD / EDIT UNIT MODAL */}
          <Modal open={isUnitModalOpen} onOpenChange={setIsUnitModalOpen}>
            <ModalContent className="sm:max-w-lg rounded-2xl">
              <ModalHeader>
                <ModalTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  {editingUnitId ? 'Edit Unit Specification' : 'Add Property Unit'}
                </ModalTitle>
                <ModalDescription className="text-xs text-slate-500">
                  {editingUnitId
                    ? 'Modify carpet area, status, and pricing for this unit. Changes are logged in audit history.'
                    : 'Add a real inventory unit with pricing and area specifications.'}
                </ModalDescription>
              </ModalHeader>
              <div className="space-y-4 py-2">
                <Input
                  label="Unit Number / Identifier *"
                  placeholder="e.g. Tower A - 1402 or Villa #12"
                  value={unitName}
                  error={unitErrors.name}
                  onChange={(e) => {
                    setUnitName(e.target.value);
                    if (unitErrors.name) setUnitErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                />
                <div className="grid grid-cols-2 gap-4">
                  {!isPlot && (
                    <Input
                      label="BHK Typology"
                      placeholder="e.g. 3 BHK"
                      value={unitBhk}
                      onChange={(e) => setUnitBhk(e.target.value)}
                    />
                  )}
                  <Input
                    label="Carpet Area (Sq Ft) *"
                    placeholder="e.g. 1850"
                    value={unitArea}
                    error={unitErrors.area}
                    onChange={(e) => {
                      setUnitArea(e.target.value);
                      if (unitErrors.area) setUnitErrors((prev) => ({ ...prev, area: undefined }));
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Price Display *"
                    placeholder="e.g. ₹ 2.10 Cr"
                    value={unitPrice}
                    error={unitErrors.price}
                    onChange={(e) => {
                      setUnitPrice(e.target.value);
                      if (unitErrors.price) setUnitErrors((prev) => ({ ...prev, price: undefined }));
                    }}
                  />
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Availability Status *
                    </label>
                    <select
                      value={unitStatus}
                      onChange={(e) => setUnitStatus(e.target.value as 'AVAILABLE' | 'BLOCKED' | 'SOLD')}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                    >
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="BLOCKED">BLOCKED</option>
                      <option value="SOLD">SOLD</option>
                    </select>
                  </div>
                </div>
              </div>
              <ModalFooter>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setIsUnitModalOpen(false);
                    setEditingUnitId(null);
                  }}
                  className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={createUnitMutation.isPending || updateUnitMutation.isPending}
                  onClick={handleSaveUnit}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
                >
                  {editingUnitId ? 'Update Unit' : 'Save Unit to Database'}
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </TabsContent>
      </Tabs>

      {/* Version Conflict Modal (HTTP 409) */}
      <Modal open={conflictModalOpen} onOpenChange={setConflictModalOpen}>
        <ModalContent className="sm:max-w-md rounded-2xl">
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Version Conflict Detected
            </ModalTitle>
            <ModalDescription className="text-xs text-slate-500">
              {conflictMessage ||
                'This project was modified in another session. Please choose whether to reload the latest server data or keep your current local edits.'}
            </ModalDescription>
          </ModalHeader>
          <div className="py-2 text-xs text-slate-600 space-y-2">
            <p>
              Your local changes have been preserved in state and cannot be overwritten unless you confirm.
            </p>
          </div>
          <ModalFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setConflictModalOpen(false);
                toast({
                  title: 'Local Changes Kept',
                  message: 'You can review and re-attempt submission.',
                  type: 'info',
                });
              }}
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
            >
              Keep My Changes
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm"
              onClick={async () => {
                setConflictModalOpen(false);
                await refetchProject();
                toast({
                  title: 'Project Reloaded',
                  message: 'Loaded the latest version from server.',
                  type: 'info',
                });
              }}
            >
              Reload Latest Server Version
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
