export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',
      neutral: 'slate',
    },
    navigationMenu: {
      slots: {
        link: 'hover:bg-neutral-100 dark:hover:bg-neutral-800',
      },
    },
  },
});
