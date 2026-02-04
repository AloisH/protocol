import { getFieldErrors, OPTIONAL_VAR_GROUPS, validateEnv } from '#shared/env';

export default defineNitroPlugin((_nitroApp) => {
  // Skip during prerender (build time) - env vars not available
  if (import.meta.prerender) {
    return;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const result = validateEnv(process.env, isProduction);

  // Fail fast on required var errors
  if (!result.success) {
    const errors = getFieldErrors(result.error);
    const errorMessages = Object.entries(errors)
      .map(([field, msgs]) => `  - ${field}: ${msgs?.join(', ')}`)
      .join('\n');

    console.error('\n❌ Environment validation failed:\n');
    console.error(errorMessages);
    console.error('\nServer cannot start. Check .env file.\n');

    throw new Error('Invalid environment configuration');
  }

  // Count optional features
  const enabledGroups: string[] = [];
  const disabledGroups: string[] = [];

  Object.entries(OPTIONAL_VAR_GROUPS).forEach(([group, vars]) => {
    const present = vars.filter(v => process.env[v]);
    if (present.length === vars.length) {
      enabledGroups.push(group);
    }
    else if (present.length === 0) {
      disabledGroups.push(group);
    }
    else {
      enabledGroups.push(`${group} (partial)`);
    }
  });

  const summary = [
    '✅ Environment validated',
    enabledGroups.length > 0 ? `[${enabledGroups.join(', ')}]` : null,
    disabledGroups.length > 0 ? `(disabled: ${disabledGroups.join(', ')})` : null,
  ]
    .filter(Boolean)
    .join(' ');

  // eslint-disable-next-line no-console -- startup info
  console.log(summary);
});
