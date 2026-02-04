import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import OnboardingProgress from './OnboardingProgress.vue';

// Mock UProgress and UIcon
const stubs = {
  UProgress: { template: '<div class="u-progress" :value="value"><slot /></div>', props: ['value', 'size'] },
  UIcon: { template: '<span class="u-icon" :name="name" />', props: ['name'] },
};

describe('onboardingProgress', () => {
  it('renders progress bar with correct percentage', () => {
    const wrapper = mount(OnboardingProgress, {
      props: { currentStep: 2, totalSteps: 6 },
      global: { stubs },
    });

    const progress = wrapper.find('.u-progress');
    expect(progress.attributes('value')).toBe('33.33333333333333');
  });

  it('renders all step indicators', () => {
    const wrapper = mount(OnboardingProgress, {
      props: { currentStep: 1, totalSteps: 6 },
      global: { stubs },
    });

    const steps = wrapper.findAll('.flex.flex-1.flex-col');
    expect(steps).toHaveLength(6);
  });

  it('highlights completed steps', () => {
    const wrapper = mount(OnboardingProgress, {
      props: { currentStep: 3, totalSteps: 6 },
      global: { stubs },
    });

    const stepCircles = wrapper.findAll('.rounded-full');
    // Steps 1-3 should have primary background
    expect(stepCircles[0]?.classes()).toContain('bg-primary');
    expect(stepCircles[1]?.classes()).toContain('bg-primary');
    expect(stepCircles[2]?.classes()).toContain('bg-primary');
    // Steps 4-6 should have neutral background
    expect(stepCircles[3]?.classes()).toContain('bg-neutral-200');
  });

  it('shows check icon for completed steps', () => {
    const wrapper = mount(OnboardingProgress, {
      props: { currentStep: 3, totalSteps: 6 },
      global: { stubs },
    });

    const icons = wrapper.findAll('.u-icon');
    // Steps 1 and 2 (before current) should have check icons
    expect(icons).toHaveLength(2);
  });

  it('shows step number for current and future steps', () => {
    const wrapper = mount(OnboardingProgress, {
      props: { currentStep: 2, totalSteps: 6 },
      global: { stubs },
    });

    const stepCircles = wrapper.findAll('.rounded-full');
    // Step 1 has check icon (no number)
    // Step 2 (current) shows "2"
    expect(stepCircles[1]?.text()).toBe('2');
    // Step 3 shows "3"
    expect(stepCircles[2]?.text()).toBe('3');
  });

  it('displays step labels', () => {
    const wrapper = mount(OnboardingProgress, {
      props: { currentStep: 1, totalSteps: 6 },
      global: { stubs },
    });

    expect(wrapper.text()).toContain('Welcome');
    expect(wrapper.text()).toContain('Profile');
    expect(wrapper.text()).toContain('Preferences');
    expect(wrapper.text()).toContain('Use Case');
    expect(wrapper.text()).toContain('Organization');
    expect(wrapper.text()).toContain('Complete');
  });

  it('calculates 100% progress on last step', () => {
    const wrapper = mount(OnboardingProgress, {
      props: { currentStep: 6, totalSteps: 6 },
      global: { stubs },
    });

    const progress = wrapper.find('.u-progress');
    expect(progress.attributes('value')).toBe('100');
  });
});
