<script setup lang="ts">
const faqItems = [
  {
    label: 'Is Bistro really free?',
    content:
      'Yes! Bistro is 100% free and open source. There are no premium tiers, no hidden fees, and no credit card required. You can use all features without any limitations.',
  },
  {
    label: 'Can I self-host Bistro?',
    content:
      'Absolutely. Bistro is open source and designed to be self-hosted. Check out our GitHub repository for deployment instructions using Docker or your preferred hosting platform.',
  },
  {
    label: 'How do organizations work?',
    content:
      'Organizations allow you to collaborate with others. Create an organization, invite team members via email, and assign roles (Owner, Admin, Member, Guest) to control access levels.',
  },
  {
    label: 'Is my data secure?',
    content:
      'Security is a priority. We use industry-standard encryption, secure authentication, and never share your data with third parties. For maximum control, you can always self-host.',
  },
  {
    label: 'What tech stack does Bistro use?',
    content:
      'Bistro is built with Nuxt 4, Vue 3, Tailwind CSS, Prisma, and PostgreSQL. It uses Better Auth for authentication and Nuxt UI for the component library.',
  },
];
</script>

<template>
  <UPageSection
    id="faq"
    title="Frequently asked questions"
    description="Got questions? We've got answers."
    class="scroll-animate"
  >
    <UAccordion
      :items="faqItems"
      class="mx-auto max-w-2xl"
    />
  </UPageSection>
</template>
