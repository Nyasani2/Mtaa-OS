/**
 * Education Hook Bridge
 * Re-exports the canonical domain education hook so that
 * legacy imports from @/lib/hooks/useEducation continue to work.
 */
export { useEducation } from '@/domains/education/hooks/useEducation';
export { useEducation as default } from '@/domains/education/hooks/useEducation';
