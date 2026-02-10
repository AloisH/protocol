<script setup lang="ts">
import type { Activity } from '#shared/db/schema';

definePageMeta({ layout: false });

const route = useRoute();
const toast = useToast();
const protocolId = route.params.protocolId as string;

// Composables
const { loadGroups, groups } = useActivityGroups();
const { loadActivities, activitiesForGroup, ungroupedActivities } = useActivities();
const { initSession, updateActivityLog, activityLogs, sessionNotes, sessionRating, saveSession } = useSession();
const { playBeep } = useBeep();

// State machine: loading → active → rest → summary
const phase = ref<'loading' | 'active' | 'rest' | 'summary'>('loading');
const paused = ref(false);
const startTime = ref(0);
const finalElapsed = ref(0);
const skippedCount = ref(0);

// Flattened activity list
const flatActivities = ref<Activity[]>([]);
const currentIndex = ref(0);
const currentSet = ref(1);

// Derived
const currentActivity = computed(() => flatActivities.value[currentIndex.value]);
const totalActivities = computed(() => flatActivities.value.length);

// Timer
const timer = useTimer(() => {
  playBeep();
  if (phase.value === 'rest') {
    advanceAfterRest();
  }
  else if (phase.value === 'active') {
    completeCurrentActivity();
    const a = currentActivity.value;
    if (a?.restTime && a.restTime > 0)
      startRestThenNext(a.restTime);
    else
      goNext();
  }
});
const activityTypeIcons: Record<string, string> = {
  exercise: 'i-lucide-dumbbell',
  warmup: 'i-lucide-zap',
  supplement: 'i-lucide-pill',
  habit: 'i-lucide-check-circle',
};

const activityTypeColors: Record<string, string> = {
  exercise: 'text-red-400',
  warmup: 'text-yellow-400',
  supplement: 'text-blue-400',
  habit: 'text-green-400',
};

// Group name lookup
const groupMap = computed(() => {
  const map = new Map<string, string>();
  for (const g of groups.value) {
    map.set(g.id, g.name);
  }
  return map;
});

function groupName(activity: Activity) {
  return activity.groupId ? groupMap.value.get(activity.groupId) : undefined;
}

// Format seconds as M:SS
function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Exercise target display
function exerciseTarget(a: Activity) {
  const parts: string[] = [];
  if (a.sets)
    parts.push(`${a.sets}x${a.reps ?? '?'}`);
  else if (a.reps)
    parts.push(`${a.reps} reps`);
  if (a.weight)
    parts.push(`@ ${a.weight}kg`);
  return parts.join(' ');
}

// Timer progress (0-1)
const timerTotal = ref(0);
const timerProgress = computed(() => {
  if (timerTotal.value <= 0)
    return 0;
  return 1 - timer.remaining.value / timerTotal.value;
});

// SVG circle constants
const RADIUS = 90;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const strokeDashoffset = computed(() => CIRCUMFERENCE * (1 - timerProgress.value));

// Completed activity count
const completedCount = computed(() => {
  let count = 0;
  for (const log of activityLogs.value.values()) {
    if (log.completed)
      count++;
  }
  return count;
});

function formatElapsed(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

// ---- Load & flatten ----
async function load() {
  await Promise.all([
    loadGroups(protocolId),
    loadActivities(protocolId),
  ]);
  await initSession(protocolId);

  // Flatten: grouped activities (by group order), then ungrouped
  const flat: Activity[] = [];
  for (const group of groups.value) {
    const groupActs = activitiesForGroup(group.id);
    for (const a of groupActs) {
      flat.push(a);
    }
  }
  for (const a of ungroupedActivities.value) {
    flat.push(a);
  }
  flatActivities.value = flat;

  if (flat.length === 0) {
    toast.add({ title: 'No activities', description: 'Protocol has no activities', color: 'warning' });
    await navigateTo('/');
    return;
  }

  startTime.value = Date.now();
  phase.value = 'active';
  startActivityPhase();
}

// ---- Activity phase logic ----
function startActivityPhase() {
  timer.reset();
  currentSet.value = 1;
  const a = currentActivity.value;
  if (!a)
    return;

  if (a.activityType === 'warmup' && a.duration) {
    timerTotal.value = a.duration;
    timer.start(a.duration);
  }
}

function handlePrimaryAction() {
  const a = currentActivity.value;
  if (!a)
    return;

  if (phase.value === 'rest') {
    // During rest, primary skips rest
    timer.reset();
    advanceAfterRest();
    return;
  }

  // Active phase
  if (a.activityType === 'warmup') {
    if (timer.isRunning.value)
      timer.reset();
    completeCurrentActivity();
    if (a.restTime && a.restTime > 0)
      startRestThenNext(a.restTime);
    else
      goNext();
  }
  else if (a.activityType === 'exercise') {
    const totalSets = a.sets || 1;
    if (currentSet.value < totalSets) {
      currentSet.value++;
      if (a.restTime && a.restTime > 0)
        startRest(a.restTime);
    }
    else {
      completeCurrentActivity();
      goNext();
    }
  }
  else {
    completeCurrentActivity();
    goNext();
  }
}

// Rest between sets (stay on same activity)
const goNextAfterRest = ref(false);

function startRest(seconds: number) {
  goNextAfterRest.value = false;
  phase.value = 'rest';
  timerTotal.value = seconds;
  timer.start(seconds);
}

// Rest then move to next activity (e.g. after warmup)
function startRestThenNext(seconds: number) {
  goNextAfterRest.value = true;
  phase.value = 'rest';
  timerTotal.value = seconds;
  timer.start(seconds);
}

function advanceAfterRest() {
  phase.value = 'active';
  if (goNextAfterRest.value) {
    goNextAfterRest.value = false;
    goNext();
  }
}

function completeCurrentActivity() {
  const a = currentActivity.value;
  if (!a)
    return;
  updateActivityLog(a.id, { completed: true });
}

function goNext() {
  timer.reset();
  phase.value = 'active';
  if (currentIndex.value < totalActivities.value - 1) {
    currentIndex.value++;
    startActivityPhase();
  }
  else {
    finalElapsed.value = startTime.value ? Math.round((Date.now() - startTime.value) / 1000) : 0;
    phase.value = 'summary';
    playBeep(600, 150);
    setTimeout(() => playBeep(800, 200), 200);
  }
}

function skip() {
  skippedCount.value++;
  timer.reset();
  phase.value = 'active';
  goNext();
}

function togglePause() {
  paused.value = !paused.value;
  if (paused.value) {
    timer.pause();
  }
  else {
    timer.resume();
  }
}

async function handleSave() {
  const ok = await saveSession();
  if (ok) {
    toast.add({ title: 'Session saved', color: 'success', icon: 'i-lucide-check' });
    await navigateTo('/');
  }
}

function exit() {
  navigateTo('/');
}

// Primary button label
const primaryLabel = computed(() => {
  const a = currentActivity.value;
  if (!a)
    return 'Done';
  if (phase.value === 'rest')
    return 'Skip Rest';
  if (a.activityType === 'exercise') {
    const totalSets = a.sets || 1;
    if (currentSet.value < totalSets)
      return 'Next Set';
    return 'Done';
  }
  if (a.activityType === 'warmup' && timer.isRunning.value)
    return 'Done';
  return 'Done';
});

onMounted(load);
</script>

<template>
  <ClientOnly>
    <div class="min-h-screen bg-neutral-950 text-white flex flex-col">
      <!-- Loading -->
      <div v-if="phase === 'loading'" class="flex-1 flex items-center justify-center">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-neutral-500" />
      </div>

      <!-- Summary -->
      <div v-else-if="phase === 'summary'" class="flex-1 flex flex-col px-6 pt-12 pb-8">
        <!-- Completion ring -->
        <div class="flex flex-col items-center gap-3 mb-8">
          <div class="relative w-28 h-28">
            <svg class="w-28 h-28 transform -rotate-90" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="85" stroke-width="10" fill="none" class="stroke-neutral-800" />
              <circle
                cx="100" cy="100" r="85" stroke-width="10" fill="none"
                stroke-linecap="round"
                class="stroke-green-400 transition-all duration-1000"
                :stroke-dasharray="2 * Math.PI * 85"
                :stroke-dashoffset="2 * Math.PI * 85 * (1 - (totalActivities > 0 ? completedCount / totalActivities : 0))"
              />
            </svg>
            <span class="absolute inset-0 flex items-center justify-center text-2xl font-bold">
              {{ totalActivities > 0 ? Math.round(completedCount / totalActivities * 100) : 0 }}%
            </span>
          </div>
          <h2 class="text-xl font-bold">
            {{ completedCount === totalActivities ? 'All Done!' : 'Session Complete' }}
          </h2>
        </div>

        <!-- Stats row -->
        <div class="flex justify-center gap-8 mb-8">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-green-400" />
            <span class="text-sm text-neutral-300">
              {{ completedCount }}<span class="text-neutral-500">/{{ totalActivities }}</span>
            </span>
          </div>
          <div v-if="skippedCount > 0" class="flex items-center gap-2">
            <UIcon name="i-lucide-skip-forward" class="w-5 h-5 text-yellow-400" />
            <span class="text-sm text-neutral-300">{{ skippedCount }} skipped</span>
          </div>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-clock" class="w-5 h-5 text-blue-400" />
            <span class="text-sm text-neutral-300">{{ formatElapsed(finalElapsed) }}</span>
          </div>
        </div>

        <!-- Rating + notes -->
        <div class="w-full max-w-sm mx-auto flex-1 flex flex-col gap-5">
          <div class="flex flex-col items-center gap-2">
            <p class="text-xs font-medium uppercase tracking-wider text-neutral-500">
              How was it?
            </p>
            <SessionRating v-model="sessionRating" />
          </div>

          <UTextarea
            v-model="sessionNotes"
            placeholder="Any notes..."
            :rows="2"
            class="w-full"
          />

          <div class="mt-auto space-y-2">
            <UButton size="xl" block icon="i-lucide-save" @click="handleSave">
              Save
            </UButton>
            <UButton size="xl" variant="ghost" color="neutral" block @click="exit">
              Discard
            </UButton>
          </div>
        </div>
      </div>

      <!-- Active / Rest -->
      <template v-else>
        <!-- Top bar -->
        <div class="flex items-center justify-between px-4 pt-4 pb-2">
          <UButton
            icon="i-lucide-x"
            variant="ghost"
            color="neutral"
            size="lg"
            @click="exit"
          />
          <span class="text-sm text-neutral-400">
            {{ currentIndex + 1 }} of {{ totalActivities }}
          </span>
          <UButton
            :icon="paused ? 'i-lucide-play' : 'i-lucide-pause'"
            variant="ghost"
            color="neutral"
            size="lg"
            @click="togglePause"
          />
        </div>

        <!-- Progress bar -->
        <UProgress
          :model-value="currentIndex"
          :max="totalActivities"
          size="xs"
          class="px-4"
        />

        <!-- Main content -->
        <div class="flex-1 flex flex-col items-center justify-center px-6 gap-6">
          <!-- Rest indicator -->
          <UBadge v-if="phase === 'rest'" color="warning" variant="subtle" size="lg">
            Rest
          </UBadge>

          <!-- Activity info -->
          <div v-if="currentActivity" class="text-center space-y-2">
            <div class="flex items-center justify-center gap-2">
              <UIcon
                :name="activityTypeIcons[currentActivity.activityType] ?? 'i-lucide-circle'"
                class="w-5 h-5"
                :class="activityTypeColors[currentActivity.activityType]"
              />
              <h1 class="text-2xl font-bold">
                {{ currentActivity.name }}
              </h1>
            </div>
            <UBadge v-if="groupName(currentActivity)" color="neutral" variant="subtle" size="sm">
              {{ groupName(currentActivity) }}
            </UBadge>
          </div>

          <!-- Timer ring -->
          <div
            v-if="(currentActivity?.activityType === 'warmup' && currentActivity.duration) || phase === 'rest'"
            class="relative w-56 h-56 flex items-center justify-center"
          >
            <svg class="w-56 h-56 transform -rotate-90" viewBox="0 0 200 200">
              <circle
                cx="100" cy="100" :r="RADIUS"
                stroke="currentColor" stroke-width="6" fill="none"
                class="text-neutral-800"
              />
              <circle
                cx="100" cy="100" :r="RADIUS"
                stroke="currentColor" stroke-width="6" fill="none"
                class="text-primary transition-all duration-1000"
                stroke-linecap="round"
                :stroke-dasharray="CIRCUMFERENCE"
                :stroke-dashoffset="strokeDashoffset"
              />
            </svg>
            <span class="absolute text-6xl font-mono font-bold tabular-nums">
              {{ formatTime(timer.remaining.value) }}
            </span>
          </div>

          <!-- Exercise details -->
          <div v-if="currentActivity?.activityType === 'exercise' && phase === 'active'" class="text-center space-y-2">
            <p class="text-4xl font-mono font-bold">
              {{ exerciseTarget(currentActivity) }}
            </p>
            <p v-if="(currentActivity.sets ?? 0) > 1" class="text-lg text-neutral-400">
              Set {{ currentSet }} of {{ currentActivity.sets }}
            </p>
          </div>

          <!-- Supplement details -->
          <div v-if="currentActivity?.activityType === 'supplement' && currentActivity.doses?.length" class="text-center space-y-1">
            <p v-for="(dose, i) in currentActivity.doses" :key="i" class="text-lg text-neutral-300">
              {{ dose.dosage }}{{ dose.dosageUnit || '' }}
              <template v-if="dose.timeOfDay">
                — {{ dose.timeOfDay }}
              </template>
            </p>
          </div>
        </div>

        <!-- Bottom actions -->
        <div class="px-6 pb-8 space-y-3">
          <UButton size="xl" block @click="handlePrimaryAction">
            {{ primaryLabel }}
          </UButton>
          <UButton size="xl" variant="outline" block @click="skip">
            Skip
          </UButton>
        </div>
      </template>
    </div>

    <template #fallback>
      <div class="min-h-screen bg-neutral-950 flex items-center justify-center">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-neutral-500" />
      </div>
    </template>
  </ClientOnly>
</template>
