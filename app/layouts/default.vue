<script setup lang="ts">
import type { FooterColumn, NavigationMenuItem } from '@nuxt/ui';

const route = useRoute();

const navLinks = computed<NavigationMenuItem[][]>(() => [
  [
    {
      label: 'Features',
      to: '/#features',
      active: route.hash === '#features',
    },
    {
      label: 'Pricing',
      to: '/#pricing',
      active: route.hash === '#pricing',
    },
    {
      label: 'Blog',
      to: '/blog',
      active: route.path.startsWith('/blog'),
    },
    {
      label: 'Docs',
      to: '/docs',
      active: route.path.startsWith('/docs'),
    },
    {
      label: 'Changelog',
      to: '/changelog',
      active: route.path.startsWith('/changelog'),
    },
    {
      label: 'Contact',
      to: '/contact',
      active: route.path === '/contact',
    },
  ],
]);

const footerColumns: FooterColumn[] = [
  {
    label: 'Product',
    children: [
      { label: 'Features', to: '/#features' },
      { label: 'Pricing', to: '/#pricing' },
      { label: 'Changelog', to: '/changelog' },
      { label: 'FAQ', to: '/#faq' },
    ],
  },
  {
    label: 'Resources',
    children: [
      { label: 'Documentation', to: '/docs' },
      { label: 'Blog', to: '/blog' },
      { label: 'GitHub', to: 'https://github.com/AloisH/bistro', target: '_blank' },
    ],
  },
  {
    label: 'Legal',
    children: [
      { label: 'Privacy Policy', to: '/legal/privacy' },
      { label: 'Terms of Service', to: '/legal/terms' },
    ],
  },
  {
    label: 'Company',
    children: [
      { label: 'About', to: '/#features' },
      { label: 'Contact', to: '/contact' },
    ],
  },
];
</script>

<template>
  <div>
    <UBanner
      id="announcement-v1"
      icon="i-lucide-sparkles"
      title="New: Command palette search with Cmd+K"
      to="https://github.com/AloisH/bistro"
      target="_blank"
      :close="true"
    />

    <UHeader :links="navLinks">
      <template #left>
        <NuxtLink
          to="/"
          class="flex items-center gap-2"
        >
          <UIcon
            name="i-lucide-check-square"
            class="text-primary size-6"
          />
          <span class="text-lg font-bold">Bistro</span>
        </NuxtLink>

        <UNavigationMenu
          :items="navLinks"
          class="ml-6 hidden md:flex"
        />
      </template>

      <template #right>
        <UColorModeButton class="hidden md:flex" />
        <UButton
          to="/auth/login"
          variant="ghost"
          class="hidden sm:flex"
        >
          Sign in
        </UButton>
        <UButton to="/auth/register">
          Get Started
        </UButton>
      </template>

      <template #body>
        <UNavigationMenu
          :items="navLinks"
          orientation="vertical"
          class="w-full"
        />
        <USeparator class="my-4" />
        <div class="flex flex-col gap-2">
          <UButton
            to="/auth/login"
            variant="ghost"
            block
          >
            Sign in
          </UButton>
          <UButton
            to="/auth/register"
            block
          >
            Get Started
          </UButton>
        </div>
      </template>
    </UHeader>

    <UMain>
      <slot />
    </UMain>

    <UFooter>
      <template #top>
        <UContainer>
          <UFooterColumns :columns="footerColumns">
            <template #right>
              <div class="flex flex-col gap-4">
                <p class="text-sm font-semibold">
                  Follow us
                </p>
                <div class="flex gap-2">
                  <UButton
                    to="https://github.com/AloisH/bistro"
                    target="_blank"
                    icon="i-simple-icons-github"
                    color="neutral"
                    variant="ghost"
                    aria-label="GitHub"
                  />
                  <UButton
                    to="https://twitter.com"
                    target="_blank"
                    icon="i-simple-icons-x"
                    color="neutral"
                    variant="ghost"
                    aria-label="Twitter/X"
                  />
                </div>
              </div>
            </template>
          </UFooterColumns>
        </UContainer>
      </template>

      <template #left>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-check-square"
            class="text-primary size-5"
          />
          <span class="font-semibold">Bistro</span>
        </div>
        <p class="text-muted mt-1 text-sm">
          Open source todo app built with Nuxt.
        </p>
      </template>

      <template #default>
        <p class="text-muted text-sm">
          &copy; {{ new Date().getFullYear() }} Bistro. All rights reserved.
        </p>
      </template>

      <template #right>
        <UColorModeButton
          color="neutral"
          variant="ghost"
        />
      </template>
    </UFooter>
  </div>
</template>
