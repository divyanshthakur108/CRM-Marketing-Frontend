import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '../lib/zodResolver';
import * as z from 'zod';
import {
  Building2,
  CheckCircle2,
  Building,
  Palette,
  Target,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  LogOut,
  Edit2,
  AlertTriangle,
} from 'lucide-react';
import axios from 'axios';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { formatCurrency } from '../lib/formatters';

// ----------------------------------------------------------------------
// Step Validation Schemas (Exact match with backend config/onboardingSteps)
// ----------------------------------------------------------------------

const step1Schema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  legalEntityName: z.string().optional(),
  registrationNumber: z.string().optional(),
  contactPhone: z.string().min(7, 'Contact phone number is required (min 7 digits)'),
  contactEmail: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  officeAddress: z.string().min(5, 'Office address is required (min 5 characters)'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().optional(),
});

const step2Schema = z.object({
  developerCategory: z.string().min(2, 'Developer category is required'),
  firstProjectName: z.string().min(2, 'First project name is required'),
  projectType: z.string().min(2, 'Project type is required'),
  reraRegistrationNumber: z.string().min(4, 'Valid RERA registration number is required'),
  city: z.string().min(2, 'Project city is required'),
  expectedLaunchDate: z.string().optional(),
});

const step3Schema = z.object({
  brandName: z.string().min(2, 'Brand display name is required'),
  tagline: z.string().optional(),
  primaryColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Must be a valid hex color (e.g. #000000)')
    .default('#000000'),
  secondaryColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Must be a valid hex color (e.g. #ffffff)')
    .default('#ffffff'),
  logoUrl: z.string().optional(),
  disclaimerFormat: z.string().optional(),
});

const step4Schema = z.object({
  primaryGoal: z.string().min(2, 'Primary marketing goal is required'),
  targetAudienceType: z.string().min(2, 'Target audience segment is required'),
  targetCpl: z.coerce.number().min(0, 'Target CPL must be a positive number'),
  monthlyBudget: z.coerce.number().min(1000, 'Monthly budget must be at least ₹1,000'),
  preferredChannels: z.array(z.string()).default(['Meta Instagram', 'Meta Facebook']),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;
type Step4Data = z.infer<typeof step4Schema>;

interface OnboardingDraftData {
  step1: Partial<Step1Data>;
  step2: Partial<Step2Data>;
  step3: Partial<Step3Data>;
  step4: Partial<Step4Data>;
}

export function OnboardingPage() {
  const { user, logout, updateUserOnboardingStatus } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeStep, setActiveStep] = useState<number>(1);
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Full onboarding collected state
  const [draftData, setDraftData] = useState<OnboardingDraftData>({
    step1: {},
    step2: {},
    step3: {},
    step4: {},
  });

  // Step 1 Form
  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      companyName: '',
      legalEntityName: '',
      registrationNumber: '',
      contactPhone: '',
      contactEmail: '',
      officeAddress: '',
      city: '',
      state: '',
      pincode: '',
    },
  });

  // Step 2 Form
  const form2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      developerCategory: 'Luxury Residential',
      firstProjectName: '',
      projectType: 'High-Rise Luxury Apartments',
      reraRegistrationNumber: '',
      city: '',
      expectedLaunchDate: '',
    },
  });

  // Step 3 Form
  const form3 = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      brandName: '',
      tagline: '',
      primaryColor: '#000000',
      secondaryColor: '#ffffff',
      logoUrl: '',
      disclaimerFormat: 'All layouts, plans and specifications are tentative and subject to statutory approvals.',
    },
  });

  // Step 4 Form
  const form4 = useForm<Step4Data>({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      primaryGoal: 'High-Intent Buyer Leads',
      targetAudienceType: 'HNIs & Ultra-HNIs (Net worth ₹10Cr+)',
      targetCpl: 1500,
      monthlyBudget: 250000,
      preferredChannels: ['Meta Instagram', 'Meta Facebook', 'WhatsApp Business'],
    },
  });

  // Load existing onboarding progress from backend on mount
  useEffect(() => {
    async function fetchOnboarding() {
      setIsLoadingDraft(true);
      try {
        const response = await api.get('/onboarding');
        const ob = response.data?.data;

        if (ob?.status === 'completed') {
          updateUserOnboardingStatus('completed');
          navigate('/dashboard', { replace: true });
          return;
        }

        const savedData: OnboardingDraftData = {
          step1: ob?.data?.step1 || {},
          step2: ob?.data?.step2 || {},
          step3: ob?.data?.step3 || {},
          step4: ob?.data?.step4 || {},
        };

        setDraftData(savedData);

        // Prepopulate forms
        if (savedData.step1.companyName) {
          form1.reset(savedData.step1 as Step1Data);
        } else if (user?.organizationName) {
          form1.setValue('companyName', user.organizationName);
        }

        if (savedData.step2.firstProjectName) {
          form2.reset(savedData.step2 as Step2Data);
        }

        if (savedData.step3.brandName) {
          form3.reset(savedData.step3 as Step3Data);
        } else if (user?.organizationName) {
          form3.setValue('brandName', user.organizationName);
        }

        if (savedData.step4.primaryGoal) {
          form4.reset(savedData.step4 as Step4Data);
        }

        const step = ob?.currentStep || 1;
        setActiveStep(Math.min(Math.max(step, 1), 5));
      } catch (err) {
        console.warn('Could not load existing onboarding draft', err);
        if (user?.organizationName) {
          form1.setValue('companyName', user.organizationName);
          form3.setValue('brandName', user.organizationName);
        }
      } finally {
        setIsLoadingDraft(false);
      }
    }

    fetchOnboarding();
  }, [user, navigate, updateUserOnboardingStatus, form1, form2, form3, form4]);

  // Handle Step 1 Next
  const onStep1Submit = async (data: Step1Data) => {
    setIsSaving(true);
    try {
      await api.put('/onboarding/steps/1', data);
      setDraftData((prev) => ({ ...prev, step1: data }));
      toast({
        title: 'Step 1 saved',
        message: 'Company profile details persisted.',
        type: 'success',
      });
      setActiveStep(2);
    } catch (err: unknown) {
      let msg = 'Failed to save company details.';
      if (axios.isAxiosError(err) && err.response?.data?.error?.message) {
        msg = err.response.data.error.message;
      }
      toast({ title: 'Error saving step', message: msg, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Step 2 Next
  const onStep2Submit = async (data: Step2Data) => {
    setIsSaving(true);
    try {
      await api.put('/onboarding/steps/2', data);
      setDraftData((prev) => ({ ...prev, step2: data }));
      toast({
        title: 'Step 2 saved',
        message: 'First project & RERA specifications persisted.',
        type: 'success',
      });
      setActiveStep(3);
    } catch (err: unknown) {
      let msg = 'Failed to save project details.';
      if (axios.isAxiosError(err) && err.response?.data?.error?.message) {
        msg = err.response.data.error.message;
      }
      toast({ title: 'Error saving step', message: msg, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Step 3 Next
  const onStep3Submit = async (data: Step3Data) => {
    setIsSaving(true);
    try {
      await api.put('/onboarding/steps/3', data);
      setDraftData((prev) => ({ ...prev, step3: data }));
      toast({
        title: 'Step 3 saved',
        message: 'Brand guidelines & visual identity persisted.',
        type: 'success',
      });
      setActiveStep(4);
    } catch (err: unknown) {
      let msg = 'Failed to save brand guidelines.';
      if (axios.isAxiosError(err) && err.response?.data?.error?.message) {
        msg = err.response.data.error.message;
      }
      toast({ title: 'Error saving step', message: msg, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Step 4 Next
  const onStep4Submit = async (data: Step4Data) => {
    setIsSaving(true);
    try {
      await api.put('/onboarding/steps/4', data);
      setDraftData((prev) => ({ ...prev, step4: data }));
      toast({
        title: 'Step 4 saved',
        message: 'Marketing goals & budget parameters persisted.',
        type: 'success',
      });
      setActiveStep(5);
    } catch (err: unknown) {
      let msg = 'Failed to save marketing goals.';
      if (axios.isAxiosError(err) && err.response?.data?.error?.message) {
        msg = err.response.data.error.message;
      }
      toast({ title: 'Error saving step', message: msg, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Final Submission
  const handleFinalSubmit = async () => {
    setIsSubmittingFinal(true);
    setSubmitError(null);
    try {
      await api.post('/onboarding/submit');
      updateUserOnboardingStatus('completed');
      toast({
        title: 'Onboarding complete',
        message: 'Your agency workspace is now fully configured. Welcome to RealCRM!',
        type: 'success',
      });
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      let msg = 'All 4 onboarding steps must be completed before final submission.';
      if (axios.isAxiosError(err) && err.response?.data?.error?.message) {
        msg = err.response.data.error.message;
      }
      setSubmitError(msg);
      toast({ title: 'Submission incomplete', message: msg, type: 'error' });
    } finally {
      setIsSubmittingFinal(false);
    }
  };

  const stepsList = [
    { number: 1, title: 'Company details', icon: Building2 },
    { number: 2, title: 'Project & RERA', icon: Building },
    { number: 3, title: 'Brand identity', icon: Palette },
    { number: 4, title: 'Budget & goals', icon: Target },
    { number: 5, title: 'Final review', icon: Sparkles },
  ];

  if (isLoadingDraft) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] text-[13px] text-[#525252]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-6 h-6 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
          <span>Restoring workspace onboarding state...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col text-[#0A0A0A] font-sans antialiased">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-[#E5E5E5] py-3.5 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#0A0A0A] text-white rounded-[8px] flex items-center justify-center font-semibold text-[13px]">
            RC
          </div>
          <div>
            <h1 className="text-[14px] font-semibold text-[#0A0A0A]">
              {user?.organizationName || 'Agency workspace'}
            </h1>
            <span className="text-[12px] text-[#737373]">
              Onboarding wizard &bull; Signed in as {user?.email}
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="text-[12px] text-[#525252] hover:text-[#0A0A0A] flex items-center space-x-1.5 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-start">
        {/* Stepper Progress Bar */}
        <div className="bg-white border border-[#E5E5E5] rounded-[10px] p-5 mb-6 shadow-card">
          <div className="grid grid-cols-5 gap-2 sm:gap-4 text-center">
            {stepsList.map((step) => {
              const Icon = step.icon;
              const isCurrent = activeStep === step.number;
              const isPast = activeStep > step.number;

              return (
                <div
                  key={step.number}
                  className={`flex flex-col items-center cursor-pointer transition-colors ${
                    isCurrent
                      ? 'text-[#0A0A0A] font-semibold'
                      : isPast
                      ? 'text-[#525252]'
                      : 'text-[#737373]'
                  }`}
                  onClick={() => {
                    if (step.number < activeStep) {
                      setActiveStep(step.number);
                    }
                  }}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 text-[12px] font-semibold border transition-colors ${
                      isCurrent
                        ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                        : isPast
                        ? 'bg-[#F5F5F5] text-[#0A0A0A] border-[#E5E5E5]'
                        : 'bg-white text-[#737373] border-[#E5E5E5]'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-4 h-4 text-[#15803D]" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className="text-[12px] hidden sm:block">
                    {step.title}
                  </span>
                  <span className="text-[11px] sm:hidden">
                    {step.number}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress Line */}
          <div className="w-full bg-[#F5F5F5] h-1 mt-4 relative rounded-full overflow-hidden">
            <div
              className="bg-[#0A0A0A] h-1 transition-all duration-300 rounded-full"
              style={{ width: `${((activeStep - 1) / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Card Container */}
        <div className="bg-white border border-[#E5E5E5] rounded-[10px] p-6 sm:p-8 shadow-card">
          {/* STEP 1: Company Details */}
          {activeStep === 1 && (
            <div className="space-y-6">
              <div className="border-b border-[#E5E5E5] pb-3">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-[#0A0A0A]" />
                  <h2 className="text-[18px] font-semibold text-[#0A0A0A]">
                    Step 1: Agency &amp; company details
                  </h2>
                </div>
                <p className="text-[14px] text-[#525252] mt-1">
                  Enter your official business registration and primary contact details.
                </p>
              </div>

              <form onSubmit={form1.handleSubmit(onStep1Submit)} className="space-y-4 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Input
                      label="Company or agency name *"
                      placeholder="e.g. Skyline Real Estate Partners"
                      error={form1.formState.errors.companyName?.message}
                      {...form1.register('companyName')}
                    />
                  </div>

                  <div>
                    <Input
                      label="Legal entity name (optional)"
                      placeholder="e.g. Skyline Realty Ventures LLP"
                      error={form1.formState.errors.legalEntityName?.message}
                      {...form1.register('legalEntityName')}
                    />
                  </div>

                  <div>
                    <Input
                      label="CIN / Business registration (optional)"
                      placeholder="e.g. U70109DL2026PTC123456"
                      error={form1.formState.errors.registrationNumber?.message}
                      {...form1.register('registrationNumber')}
                    />
                  </div>

                  <div>
                    <Input
                      label="Official contact phone *"
                      placeholder="e.g. +91 98111 22334"
                      error={form1.formState.errors.contactPhone?.message}
                      {...form1.register('contactPhone')}
                    />
                  </div>

                  <div>
                    <Input
                      label="Official contact email (optional)"
                      placeholder="director@agency.in"
                      type="email"
                      error={form1.formState.errors.contactEmail?.message}
                      {...form1.register('contactEmail')}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Input
                      label="Registered office address *"
                      placeholder="e.g. 14th Floor, Skyline Horizon Towers, Golf Course Road"
                      error={form1.formState.errors.officeAddress?.message}
                      {...form1.register('officeAddress')}
                    />
                  </div>

                  <div>
                    <Input
                      label="City *"
                      placeholder="e.g. Gurugram"
                      error={form1.formState.errors.city?.message}
                      {...form1.register('city')}
                    />
                  </div>

                  <div>
                    <Input
                      label="State *"
                      placeholder="e.g. Haryana"
                      error={form1.formState.errors.state?.message}
                      {...form1.register('state')}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Input
                      label="PIN / Postal code (optional)"
                      placeholder="e.g. 122002"
                      error={form1.formState.errors.pincode?.message}
                      {...form1.register('pincode')}
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end border-t border-[#E5E5E5]">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isSaving}
                    disabled={isSaving}
                  >
                    Next: Project &amp; RERA <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 2: Project & RERA */}
          {activeStep === 2 && (
            <div className="space-y-6">
              <div className="border-b border-[#E5E5E5] pb-3">
                <div className="flex items-center space-x-2">
                  <Building className="w-5 h-5 text-[#0A0A0A]" />
                  <h2 className="text-[18px] font-semibold text-[#0A0A0A]">
                    Step 2: Category &amp; first project
                  </h2>
                </div>
                <p className="text-[14px] text-[#525252] mt-1">
                  Specify your primary real estate portfolio category and your flagship project.
                </p>
              </div>

              <form onSubmit={form2.handleSubmit(onStep2Submit)} className="space-y-4 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-medium text-[#525252] mb-1">
                      Developer category *
                    </label>
                    <select
                      {...form2.register('developerCategory')}
                      className="w-full text-[14px] border border-[#E5E5E5] rounded-[8px] bg-white p-2.5 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-2"
                    >
                      <option value="Luxury Residential">Luxury Residential</option>
                      <option value="Ultra-Luxury High-Rise">Ultra-Luxury High-Rise</option>
                      <option value="Commercial & Office Parks">Commercial &amp; Office Parks</option>
                      <option value="Boutique Villas & Estates">Boutique Villas &amp; Estates</option>
                      <option value="Plotted Townships">Plotted Townships</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-[#525252] mb-1">
                      Project type *
                    </label>
                    <select
                      {...form2.register('projectType')}
                      className="w-full text-[14px] border border-[#E5E5E5] rounded-[8px] bg-white p-2.5 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-2"
                    >
                      <option value="High-Rise Luxury Apartments">High-Rise Luxury Apartments</option>
                      <option value="Penthouses & Sky Mansions">Penthouses &amp; Sky Mansions</option>
                      <option value="Gated Waterfront Villas">Gated Waterfront Villas</option>
                      <option value="Grade-A Commercial Offices">Grade-A Commercial Offices</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <Input
                      label="Flagship project name *"
                      placeholder="e.g. Emerald Bay Signature Towers"
                      error={form2.formState.errors.firstProjectName?.message}
                      {...form2.register('firstProjectName')}
                    />
                  </div>

                  <div>
                    <Input
                      label="RERA registration number *"
                      placeholder="e.g. RC/REP/HARERA/GGM/2026/108"
                      error={form2.formState.errors.reraRegistrationNumber?.message}
                      {...form2.register('reraRegistrationNumber')}
                    />
                    <span className="text-[12px] text-[#737373] mt-1 block">
                      Required for statutory advertising compliance.
                    </span>
                  </div>

                  <div>
                    <Input
                      label="Project city *"
                      placeholder="e.g. Gurugram"
                      error={form2.formState.errors.city?.message}
                      {...form2.register('city')}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Input
                      label="Expected launch or handover date (optional)"
                      type="date"
                      error={form2.formState.errors.expectedLaunchDate?.message}
                      {...form2.register('expectedLaunchDate')}
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-[#E5E5E5]">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => setActiveStep(1)}
                    disabled={isSaving}
                  >
                    <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isSaving}
                    disabled={isSaving}
                  >
                    Next: Brand identity <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: Brand Guidelines */}
          {activeStep === 3 && (
            <div className="space-y-6">
              <div className="border-b border-[#E5E5E5] pb-3">
                <div className="flex items-center space-x-2">
                  <Palette className="w-5 h-5 text-[#0A0A0A]" />
                  <h2 className="text-[18px] font-semibold text-[#0A0A0A]">
                    Step 3: Brand guidelines &amp; visual identity
                  </h2>
                </div>
                <p className="text-[14px] text-[#525252] mt-1">
                  Configure brand aesthetics used by AI generators and marketing templates.
                </p>
              </div>

              <form onSubmit={form3.handleSubmit(onStep3Submit)} className="space-y-4 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Input
                      label="Brand display name *"
                      placeholder="e.g. Skyline Signature"
                      error={form3.formState.errors.brandName?.message}
                      {...form3.register('brandName')}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Input
                      label="Brand tagline (optional)"
                      placeholder="e.g. Architecture of Pure Distinction"
                      error={form3.formState.errors.tagline?.message}
                      {...form3.register('tagline')}
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-[#525252] mb-1">
                      Primary brand color (hex) *
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={form3.watch('primaryColor') || '#000000'}
                        onChange={(e) => form3.setValue('primaryColor', e.target.value)}
                        className="w-10 h-10 border border-[#E5E5E5] rounded-[8px] cursor-pointer p-0.5 bg-white"
                      />
                      <Input
                        placeholder="#000000"
                        error={form3.formState.errors.primaryColor?.message}
                        {...form3.register('primaryColor')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-[#525252] mb-1">
                      Secondary accent color (hex) *
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={form3.watch('secondaryColor') || '#ffffff'}
                        onChange={(e) => form3.setValue('secondaryColor', e.target.value)}
                        className="w-10 h-10 border border-[#E5E5E5] rounded-[8px] cursor-pointer p-0.5 bg-white"
                      />
                      <Input
                        placeholder="#ffffff"
                        error={form3.formState.errors.secondaryColor?.message}
                        {...form3.register('secondaryColor')}
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <Input
                      label="Logo asset URL (optional)"
                      placeholder="https://assets.youragency.in/logo.png"
                      error={form3.formState.errors.logoUrl?.message}
                      {...form3.register('logoUrl')}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[12px] font-medium text-[#525252] mb-1">
                      Statutory compliance disclaimer (optional)
                    </label>
                    <textarea
                      rows={3}
                      className="w-full text-[14px] border border-[#E5E5E5] rounded-[8px] p-2.5 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-2"
                      placeholder="All layouts, plans and specifications are tentative and subject to change."
                      {...form3.register('disclaimerFormat')}
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-[#E5E5E5]">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => setActiveStep(2)}
                    disabled={isSaving}
                  >
                    <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isSaving}
                    disabled={isSaving}
                  >
                    Next: Budget &amp; goals <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 4: Marketing Goals & Budget */}
          {activeStep === 4 && (
            <div className="space-y-6">
              <div className="border-b border-[#E5E5E5] pb-3">
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-[#0A0A0A]" />
                  <h2 className="text-[18px] font-semibold text-[#0A0A0A]">
                    Step 4: Marketing goals &amp; monthly budget
                  </h2>
                </div>
                <p className="text-[14px] text-[#525252] mt-1">
                  Define your lead generation focus, ideal buyer profile, and initial advertising allocation.
                </p>
              </div>

              <form onSubmit={form4.handleSubmit(onStep4Submit)} className="space-y-4 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-medium text-[#525252] mb-1">
                      Primary marketing objective *
                    </label>
                    <select
                      {...form4.register('primaryGoal')}
                      className="w-full text-[14px] border border-[#E5E5E5] rounded-[8px] bg-white p-2.5 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-2"
                    >
                      <option value="High-Intent Buyer Leads">High-Intent Buyer Leads</option>
                      <option value="Private Site Visit Bookings">Private Site Visit Bookings</option>
                      <option value="Project Launch Buzz & Brand Awareness">Project Launch Buzz &amp; Brand Awareness</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-[#525252] mb-1">
                      Target audience segment *
                    </label>
                    <select
                      {...form4.register('targetAudienceType')}
                      className="w-full text-[14px] border border-[#E5E5E5] rounded-[8px] bg-white p-2.5 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-2"
                    >
                      <option value="HNIs & Ultra-HNIs (Net worth ₹10Cr+)">HNIs &amp; Ultra-HNIs (Net worth ₹10Cr+)</option>
                      <option value="CXOs, Tech Founders & Corporate Leaders">CXOs, Tech Founders &amp; Corporate Leaders</option>
                      <option value="Non-Resident Indians (NRIs & Global Expats)">Non-Resident Indians (NRIs &amp; Global Expats)</option>
                      <option value="Affluent Luxury Upgrade Buyers">Affluent Luxury Upgrade Buyers</option>
                    </select>
                  </div>

                  <div>
                    <Input
                      label="Monthly digital ad budget (₹ INR) *"
                      type="number"
                      placeholder="e.g. 250000"
                      error={form4.formState.errors.monthlyBudget?.message}
                      {...form4.register('monthlyBudget')}
                    />
                    <span className="text-[12px] text-[#737373] mt-1 block">
                      Minimum ₹1,000 required for rule-based campaign allocation.
                    </span>
                  </div>

                  <div>
                    <Input
                      label="Target cost per lead (CPL in ₹) *"
                      type="number"
                      placeholder="e.g. 1500"
                      error={form4.formState.errors.targetCpl?.message}
                      {...form4.register('targetCpl')}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[12px] font-medium text-[#525252] mb-2">
                      Preferred distribution channels
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {['Meta Instagram', 'Meta Facebook', 'WhatsApp Business', 'Google Ads'].map((ch) => (
                        <label
                          key={ch}
                          className="flex items-center space-x-2 text-[13px] p-2.5 border border-[#E5E5E5] rounded-[8px] bg-white hover:bg-[#F5F5F5] cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            value={ch}
                            defaultChecked
                            className="rounded-[4px] border-[#E5E5E5] text-[#0A0A0A] focus:ring-[#0A0A0A]"
                          />
                          <span>{ch}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-[#E5E5E5]">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => setActiveStep(3)}
                    disabled={isSaving}
                  >
                    <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isSaving}
                    disabled={isSaving}
                  >
                    Next: Review summary <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 5: Final Review & Submission */}
          {activeStep === 5 && (
            <div className="space-y-6">
              <div className="border-b border-[#E5E5E5] pb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-[#0A0A0A]" />
                  <h2 className="text-[18px] font-semibold text-[#0A0A0A]">
                    Final step: Review &amp; launch workspace
                  </h2>
                </div>
                <p className="text-[14px] text-[#525252] mt-1">
                  Verify your onboarding parameters. Upon submission, your agency workspace will unlock with all features active.
                </p>
              </div>

              {submitError && (
                <div className="border border-[#FEE2E2] bg-[#FEF2F2] rounded-[8px] p-4 text-[13px] text-[#B91C1C] flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-[#B91C1C] shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Review Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                {/* 1. Company Profile Review */}
                <div className="border border-[#E5E5E5] rounded-[8px] p-4 bg-[#FAFAFA] relative">
                  <button
                    onClick={() => setActiveStep(1)}
                    className="absolute top-3.5 right-3.5 text-[#525252] hover:text-[#0A0A0A] flex items-center text-[12px] transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                  </button>
                  <h3 className="text-[13px] font-semibold text-[#0A0A0A] mb-2 flex items-center">
                    <Building2 className="w-4 h-4 mr-1.5" /> 1. Company profile
                  </h3>
                  <div className="space-y-1.5 text-[13px] text-[#525252]">
                    <div>
                      <span className="text-[#737373]">Agency: </span>
                      <strong className="text-[#0A0A0A]">{draftData.step1.companyName || form1.getValues('companyName') || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-[#737373]">Phone: </span>
                      {draftData.step1.contactPhone || form1.getValues('contactPhone') || 'N/A'}
                    </div>
                    <div>
                      <span className="text-[#737373]">Address: </span>
                      {draftData.step1.officeAddress || form1.getValues('officeAddress') || 'N/A'}
                    </div>
                    <div>
                      <span className="text-[#737373]">Location: </span>
                      {(draftData.step1.city || form1.getValues('city')) || 'N/A'},{' '}
                      {(draftData.step1.state || form1.getValues('state')) || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* 2. Project Review */}
                <div className="border border-[#E5E5E5] rounded-[8px] p-4 bg-[#FAFAFA] relative">
                  <button
                    onClick={() => setActiveStep(2)}
                    className="absolute top-3.5 right-3.5 text-[#525252] hover:text-[#0A0A0A] flex items-center text-[12px] transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                  </button>
                  <h3 className="text-[13px] font-semibold text-[#0A0A0A] mb-2 flex items-center">
                    <Building className="w-4 h-4 mr-1.5" /> 2. Flagship project
                  </h3>
                  <div className="space-y-1.5 text-[13px] text-[#525252]">
                    <div>
                      <span className="text-[#737373]">Project: </span>
                      <strong className="text-[#0A0A0A]">{draftData.step2.firstProjectName || form2.getValues('firstProjectName') || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-[#737373]">Category: </span>
                      {draftData.step2.developerCategory || form2.getValues('developerCategory') || 'N/A'}
                    </div>
                    <div>
                      <span className="text-[#737373]">RERA ID: </span>
                      <strong className="text-[#0A0A0A]">
                        {draftData.step2.reraRegistrationNumber || form2.getValues('reraRegistrationNumber') || 'N/A'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#737373]">City: </span>
                      {draftData.step2.city || form2.getValues('city') || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* 3. Brand Identity Review */}
                <div className="border border-[#E5E5E5] rounded-[8px] p-4 bg-[#FAFAFA] relative">
                  <button
                    onClick={() => setActiveStep(3)}
                    className="absolute top-3.5 right-3.5 text-[#525252] hover:text-[#0A0A0A] flex items-center text-[12px] transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                  </button>
                  <h3 className="text-[13px] font-semibold text-[#0A0A0A] mb-2 flex items-center">
                    <Palette className="w-4 h-4 mr-1.5" /> 3. Brand identity
                  </h3>
                  <div className="space-y-1.5 text-[13px] text-[#525252]">
                    <div>
                      <span className="text-[#737373]">Brand name: </span>
                      <strong className="text-[#0A0A0A]">{draftData.step3.brandName || form3.getValues('brandName') || 'N/A'}</strong>
                    </div>
                    <div className="flex items-center space-x-2 pt-1">
                      <span className="text-[#737373]">Palette: </span>
                      <div
                        className="w-4 h-4 rounded-[4px] border border-[#E5E5E5]"
                        style={{ backgroundColor: draftData.step3.primaryColor || form3.getValues('primaryColor') || '#000000' }}
                        title="Primary Color"
                      />
                      <span className="text-[12px]">
                        {draftData.step3.primaryColor || form3.getValues('primaryColor') || '#000000'}
                      </span>
                      <div
                        className="w-4 h-4 rounded-[4px] border border-[#E5E5E5] ml-2"
                        style={{ backgroundColor: draftData.step3.secondaryColor || form3.getValues('secondaryColor') || '#ffffff' }}
                        title="Secondary Color"
                      />
                      <span className="text-[12px]">
                        {draftData.step3.secondaryColor || form3.getValues('secondaryColor') || '#ffffff'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Budget & Goals Review */}
                <div className="border border-[#E5E5E5] rounded-[8px] p-4 bg-[#FAFAFA] relative">
                  <button
                    onClick={() => setActiveStep(4)}
                    className="absolute top-3.5 right-3.5 text-[#525252] hover:text-[#0A0A0A] flex items-center text-[12px] transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                  </button>
                  <h3 className="text-[13px] font-semibold text-[#0A0A0A] mb-2 flex items-center">
                    <Target className="w-4 h-4 mr-1.5" /> 4. Budget &amp; goals
                  </h3>
                  <div className="space-y-1.5 text-[13px] text-[#525252]">
                    <div>
                      <span className="text-[#737373]">Monthly budget: </span>
                      <strong className="text-[#0A0A0A] tabular-nums">
                        {formatCurrency(Number(draftData.step4.monthlyBudget || form4.getValues('monthlyBudget') || 250000))}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#737373]">Target CPL: </span>
                      <span className="tabular-nums">
                        {formatCurrency(Number(draftData.step4.targetCpl || form4.getValues('targetCpl') || 1500))}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#737373]">Audience: </span>
                      {draftData.step4.targetAudienceType || form4.getValues('targetAudienceType') || 'HNIs & Ultra-HNIs'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-between border-t border-[#E5E5E5]">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setActiveStep(4)}
                  disabled={isSubmittingFinal}
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to budget
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleFinalSubmit}
                  isLoading={isSubmittingFinal}
                  disabled={isSubmittingFinal}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Final submit &amp; launch dashboard
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
