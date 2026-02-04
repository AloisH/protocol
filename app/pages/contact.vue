<script setup lang="ts">
import { z } from 'zod';

const toast = useToast();

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  subject: z.enum(['general', 'support', 'feedback', 'other']),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
});

type ContactForm = z.infer<typeof contactSchema>;

const state = reactive<ContactForm>({
  name: '',
  email: '',
  subject: '' as ContactForm['subject'],
  message: '',
});

const subjectOptions = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'support', label: 'Support' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'other', label: 'Other' },
];

const loading = ref(false);

async function onSubmit() {
  loading.value = true;
  try {
    await $fetch('/api/contact', {
      method: 'POST',
      body: state,
    });

    toast.add({
      title: 'Message sent',
      description: 'Thanks for reaching out. We\'ll get back to you soon.',
      color: 'success',
      icon: 'i-lucide-check',
    });

    // Reset form
    state.name = '';
    state.email = '';
    state.subject = '' as ContactForm['subject'];
    state.message = '';
  }
  catch {
    toast.add({
      title: 'Error',
      description: 'Failed to send message. Please try again.',
      color: 'error',
      icon: 'i-lucide-alert-triangle',
    });
  }
  finally {
    loading.value = false;
  }
}

useSeo({
  title: 'Contact',
  description: 'Get in touch with the Bistro team for support, feedback, or general inquiries.',
});
</script>

<template>
  <div class="container mx-auto px-4 py-12">
    <div class="mx-auto max-w-2xl">
      <!-- Header -->
      <div class="mb-12 text-center">
        <h1 class="mb-4 text-4xl font-bold text-neutral-900 dark:text-white">
          Contact Us
        </h1>
        <p class="text-lg text-neutral-600 dark:text-neutral-400">
          Have a question or feedback? We'd love to hear from you.
        </p>
      </div>

      <!-- Contact Form -->
      <UCard>
        <UForm
          :state="state"
          :schema="contactSchema"
          @submit="onSubmit"
        >
          <div class="space-y-6">
            <UFormField
              name="name"
              label="Name"
              class="w-full"
            >
              <UInput
                v-model="state.name"
                placeholder="Your name"
                icon="i-lucide-user"
                class="w-full"
              />
            </UFormField>

            <UFormField
              name="email"
              label="Email"
              class="w-full"
            >
              <UInput
                v-model="state.email"
                type="email"
                placeholder="you@example.com"
                icon="i-lucide-mail"
                class="w-full"
              />
            </UFormField>

            <UFormField
              name="subject"
              label="Subject"
              class="w-full"
            >
              <USelect
                v-model="state.subject"
                :items="subjectOptions"
                placeholder="Select a subject"
                icon="i-lucide-message-square"
                class="w-full"
              />
            </UFormField>

            <UFormField
              name="message"
              label="Message"
              class="w-full"
            >
              <UTextarea
                v-model="state.message"
                placeholder="How can we help?"
                :rows="5"
                class="w-full"
              />
            </UFormField>

            <UButton
              type="submit"
              block
              size="lg"
              :loading="loading"
            >
              Send Message
            </UButton>
          </div>
        </UForm>
      </UCard>

      <!-- Alternative contact -->
      <div class="mt-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
        <p>
          Prefer GitHub?
          <NuxtLink
            to="https://github.com/AloisH/bistro/issues"
            target="_blank"
            class="text-primary hover:underline"
          >
            Open an issue
          </NuxtLink>
          or
          <NuxtLink
            to="https://github.com/AloisH/bistro/discussions"
            target="_blank"
            class="text-primary hover:underline"
          >
            start a discussion
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>
