export function updateBadge(count: number) {
  if (!('setAppBadge' in navigator))
    return;

  if (count > 0)
    void navigator.setAppBadge(count);
  else
    void navigator.clearAppBadge();
}
