/**
 * Get initials from user name or email for avatar display
 */
export function getUserInitials(
  user: { name?: string; email?: string } | null | undefined,
): string {
  if (!user)
    return 'U';

  const name = user.name || user.email || '';
  if (!name)
    return 'U';

  // For emails, use first letter
  if (name.includes('@')) {
    return name.charAt(0).toUpperCase();
  }

  // For multi-word names, use first letter of each word (max 2)
  const words = name.trim().split(/\s+/);
  if (words.length > 1) {
    return words
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  }

  // Single word - use first letter
  return name.charAt(0).toUpperCase();
}
