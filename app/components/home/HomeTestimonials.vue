<script setup lang="ts">
const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Indie Developer',
    quote:
      'Finally, a todo app that doesn\'t try to do everything. Bistro is simple, fast, and just works. Perfect for my daily workflow.',
  },
  {
    name: 'Marcus Johnson',
    role: 'Startup Founder',
    quote:
      'We switched our team to Bistro and productivity went up. The organization features are exactly what we needed without the bloat.',
  },
  {
    name: 'Emily Rodriguez',
    role: 'Open Source Contributor',
    quote:
      'Love that it\'s open source! I can self-host it, customize it, and trust that my data stays mine. The codebase is clean too.',
  },
];
</script>

<template>
  <UPageSection
    title="Loved by developers"
    description="See what others are saying about Bistro."
    class="scroll-animate"
  >
    <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
      <UCard
        v-for="(testimonial, index) in testimonials"
        :key="testimonial.name"
        class="card-hover flex flex-col"
        :style="{ animationDelay: `${index * 100}ms` }"
      >
        <div class="flex-1">
          <UIcon
            name="i-lucide-quote"
            class="text-primary mb-3 size-6"
          />
          <p class="text-muted">
            {{ testimonial.quote }}
          </p>
        </div>
        <div class="border-default mt-4 flex items-center gap-3 border-t pt-4">
          <UAvatar
            :text="
              testimonial.name
                .split(' ')
                .map((n) => n[0])
                .join('')
            "
            size="md"
          />
          <div>
            <p class="text-sm font-medium">
              {{ testimonial.name }}
            </p>
            <p class="text-muted text-xs">
              {{ testimonial.role }}
            </p>
          </div>
        </div>
      </UCard>
    </div>
  </UPageSection>
</template>
