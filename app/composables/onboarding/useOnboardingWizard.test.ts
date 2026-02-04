import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, reactive, ref, watch } from 'vue';

// Stub Vue auto-imports
vi.stubGlobal('ref', ref);
vi.stubGlobal('computed', computed);
vi.stubGlobal('reactive', reactive);
vi.stubGlobal('watch', watch);
vi.stubGlobal('onMounted', vi.fn((cb: () => void) => {
  cb();
}));

// Mock dependencies
const mockFetchSession = vi.fn();
vi.stubGlobal('useAuth', vi.fn(() => ({ fetchSession: mockFetchSession })));

const mockToastAdd = vi.fn();
vi.stubGlobal('useToast', vi.fn(() => ({ add: mockToastAdd })));
const mockFetch = vi.fn();
const mockNavigateTo = vi.fn();
vi.stubGlobal('$fetch', mockFetch);
vi.stubGlobal('navigateTo', mockNavigateTo);

// Mock localStorage
const mockStorage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value; }),
  removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
};
vi.stubGlobal('localStorage', mockLocalStorage);

// Import after mocks
const { useOnboardingWizard } = await import('./useOnboardingWizard');

describe('useOnboardingWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
  });

  describe('initial state', () => {
    it('starts at step 1', () => {
      const { state } = useOnboardingWizard();
      expect(state.currentStep).toBe(1);
    });

    it('has empty profile', () => {
      const { state } = useOnboardingWizard();
      expect(state.profile).toEqual({ bio: '', company: '' });
    });

    it('has default preferences', () => {
      const { state } = useOnboardingWizard();
      expect(state.preferences.emailNotifications).toBe(true);
    });

    it('exposes TOTAL_STEPS', () => {
      const { TOTAL_STEPS } = useOnboardingWizard();
      expect(TOTAL_STEPS).toBe(6);
    });
  });

  describe('isFirstStep / isLastStep', () => {
    it('isFirstStep is true at step 1', () => {
      const { isFirstStep } = useOnboardingWizard();
      expect(isFirstStep.value).toBe(true);
    });

    it('isLastStep is false at step 1', () => {
      const { isLastStep } = useOnboardingWizard();
      expect(isLastStep.value).toBe(false);
    });

    it('isLastStep is true at final step', () => {
      const { state, isLastStep, TOTAL_STEPS } = useOnboardingWizard();
      state.currentStep = TOTAL_STEPS;
      expect(isLastStep.value).toBe(true);
    });
  });

  describe('previousStep', () => {
    it('decrements step', () => {
      const { state, previousStep } = useOnboardingWizard();
      state.currentStep = 3;
      previousStep();
      expect(state.currentStep).toBe(2);
    });

    it('does nothing at step 1', () => {
      const { state, previousStep } = useOnboardingWizard();
      state.currentStep = 1;
      previousStep();
      expect(state.currentStep).toBe(1);
    });
  });

  describe('nextStep', () => {
    it('increments step when not last', async () => {
      mockFetch.mockResolvedValue({});
      const { state, nextStep } = useOnboardingWizard();
      state.currentStep = 1;
      await nextStep();
      expect(state.currentStep).toBe(2);
    });

    it('does nothing when loading', async () => {
      const { state, nextStep, isLoading } = useOnboardingWizard();
      state.currentStep = 2;
      // Simulate loading
      (isLoading as { value: boolean }).value = true;
      await nextStep();
      expect(state.currentStep).toBe(2);
    });

    it('saves profile data at step 2', async () => {
      mockFetch.mockResolvedValue({});
      const { state, nextStep } = useOnboardingWizard();
      state.currentStep = 2;
      state.profile = { bio: 'Hello', company: 'Acme' };

      await nextStep();

      expect(mockFetch).toHaveBeenCalledWith('/api/user/onboarding', {
        method: 'PUT',
        body: { step: 'profile', data: { bio: 'Hello', company: 'Acme' } },
      });
    });

    it('creates org at step 5', async () => {
      mockFetch.mockResolvedValue({ organization: { slug: 'my-org' } });
      const { state, nextStep } = useOnboardingWizard();
      state.currentStep = 5;
      state.organization = { name: 'My Org', slug: 'my-org', description: '' };

      await nextStep();

      expect(mockFetch).toHaveBeenCalledWith('/api/organizations', {
        method: 'POST',
        body: { name: 'My Org', slug: 'my-org', description: '' },
      });
    });

    it('shows toast on error', async () => {
      mockFetch.mockRejectedValue({ data: { message: 'Failed' } });
      const { state, nextStep } = useOnboardingWizard();
      state.currentStep = 2;

      await expect(nextStep()).rejects.toThrow();
      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({ color: 'error' }),
      );
    });
  });

  describe('skipStep', () => {
    it('increments step without saving', async () => {
      const { state, skipStep } = useOnboardingWizard();
      state.currentStep = 2;
      await skipStep();
      expect(state.currentStep).toBe(3);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('does nothing when loading', async () => {
      const { state, skipStep, isLoading } = useOnboardingWizard();
      state.currentStep = 2;
      (isLoading as { value: boolean }).value = true;
      await skipStep();
      expect(state.currentStep).toBe(2);
    });
  });

  describe('complete', () => {
    it('calls complete endpoint on last step', async () => {
      mockFetch.mockResolvedValue({});
      mockFetchSession.mockResolvedValue({});
      const { state, nextStep, TOTAL_STEPS } = useOnboardingWizard();
      state.currentStep = TOTAL_STEPS;

      await nextStep();

      expect(mockFetch).toHaveBeenCalledWith('/api/user/onboarding/complete', {
        method: 'POST',
      });
    });

    it('clears localStorage on complete', async () => {
      mockFetch.mockResolvedValue({});
      mockFetchSession.mockResolvedValue({});
      const wizard = useOnboardingWizard();
      wizard.state.currentStep = wizard.TOTAL_STEPS;

      await wizard.nextStep();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('bistro:onboarding');
    });

    it('redirects to org dashboard when org created', async () => {
      mockFetch
        .mockResolvedValueOnce({ organization: { slug: 'test-org' } }) // create org
        .mockResolvedValue({}); // complete
      mockFetchSession.mockResolvedValue({});

      const { state, nextStep, TOTAL_STEPS } = useOnboardingWizard();
      state.currentStep = 5;
      await nextStep(); // creates org, saves slug
      state.currentStep = TOTAL_STEPS;
      await nextStep(); // complete

      expect(mockNavigateTo).toHaveBeenCalledWith({
        name: 'org-slug-dashboard',
        params: { slug: 'test-org' },
      });
    });

    it('redirects to org select when no org', async () => {
      mockFetch.mockResolvedValue({});
      mockFetchSession.mockResolvedValue({});
      const { state, nextStep, TOTAL_STEPS } = useOnboardingWizard();
      state.currentStep = TOTAL_STEPS;

      await nextStep();

      expect(mockNavigateTo).toHaveBeenCalledWith({
        name: 'organizations-select',
      });
    });

    it('shows success toast', async () => {
      mockFetch.mockResolvedValue({});
      mockFetchSession.mockResolvedValue({});
      const { state, nextStep, TOTAL_STEPS } = useOnboardingWizard();
      state.currentStep = TOTAL_STEPS;

      await nextStep();

      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Welcome!',
          color: 'success',
        }),
      );
    });
  });

  describe('localStorage persistence', () => {
    it('loads state from localStorage', () => {
      mockStorage['bistro:onboarding'] = JSON.stringify({ currentStep: 3 });
      const { state } = useOnboardingWizard();
      expect(state.currentStep).toBe(3);
    });

    it('ignores invalid localStorage data', () => {
      mockStorage['bistro:onboarding'] = 'invalid json';
      const { state } = useOnboardingWizard();
      expect(state.currentStep).toBe(1); // default
    });
  });
});
