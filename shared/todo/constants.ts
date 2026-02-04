/**
 * Todo constants
 */

export const TITLE_MIN_LENGTH = 1;
export const MAX_TITLE_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 1000;

export const TODO_FILTERS = ['all', 'active', 'completed'] as const;
export const TODO_SORT_OPTIONS = ['date', 'title'] as const;
