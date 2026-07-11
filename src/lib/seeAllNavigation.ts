export function getSeeAllBackPath(sectionId?: string | null) {
  if (!sectionId) return '/';

  const normalizedSectionId = sectionId.startsWith('section-') ? sectionId : `section-${sectionId}`;
  return `/#${normalizedSectionId}`;
}
