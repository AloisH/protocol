import 'fake-indexeddb/auto';
import { computed, nextTick, onScopeDispose, reactive, readonly, ref, shallowReadonly, watch } from 'vue';

// Provide Vue auto-imports that Nuxt normally handles
globalThis.ref = ref;
globalThis.computed = computed;
globalThis.reactive = reactive;
globalThis.readonly = readonly;
globalThis.shallowReadonly = shallowReadonly;
globalThis.watch = watch;
globalThis.nextTick = nextTick;
globalThis.onScopeDispose = onScopeDispose;

// Mock Nuxt's useState as a simple ref factory
const stateStore = new Map<string, ReturnType<typeof ref>>();
globalThis.useState = ((key: string, init?: () => unknown) => {
  if (!stateStore.has(key)) {
    stateStore.set(key, ref(init ? init() : undefined));
  }
  return stateStore.get(key)!;
}) as typeof useState;

// Provide auto-imported composables that Nuxt normally handles
globalThis.useNow = (await import('~/composables/useNow')).useNow;

// Clear useState store between tests to avoid leaking state
import { beforeEach } from 'vitest';
beforeEach(() => { stateStore.clear(); });
