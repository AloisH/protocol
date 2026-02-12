import 'fake-indexeddb/auto';
import { computed, nextTick, reactive, readonly, ref, watch } from 'vue';

// Provide Vue auto-imports that Nuxt normally handles
globalThis.ref = ref;
globalThis.computed = computed;
globalThis.reactive = reactive;
globalThis.readonly = readonly;
globalThis.watch = watch;
globalThis.nextTick = nextTick;
