export function useScrollAnimation() {
  const animatedElements = shallowRef<Set<Element>>(new Set());

  function observe(el: Ref<HTMLElement | ComponentPublicInstance | null> | HTMLElement | null) {
    const raw = isRef(el) ? el.value : el;
    if (!raw)
      return;

    // Handle Vue component instances (get $el) or raw DOM elements
    const target = '$el' in raw ? (raw.$el as HTMLElement | null) : raw;
    if (!target || !(target instanceof Element))
      return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !animatedElements.value.has(entry.target)) {
            entry.target.classList.add('animate-in');
            animatedElements.value.add(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );

    observer.observe(target);

    onUnmounted(() => {
      observer.disconnect();
    });
  }

  return { observe };
}
