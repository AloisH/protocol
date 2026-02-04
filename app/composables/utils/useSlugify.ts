export function useSlugify(source: Ref<string>, target: Ref<string>) {
  function slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  watch(source, (newVal, oldVal) => {
    if (!target.value || target.value === slugify(oldVal || '')) {
      target.value = slugify(newVal);
    }
  });

  return { slugify };
}
