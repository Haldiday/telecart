const pageSectionsAll = ['pageSections'] as const;

export const queryKeys = {
  categorySection: {
    all: ['categorySection'] as const,
    bySectionId: (sectionId: string) => [...queryKeys.categorySection.all, sectionId] as const,
  },
  pageSections: {
    all: pageSectionsAll,
    home: [...pageSectionsAll, 'home'] as const,
  },
  heroSettings: {
    all: ['heroSettings'] as const,
  },
  pageSection: {
    byId: (id: string) => ['pageSection', id] as const,
  },
  featuredCards: {
    all: ['featuredCards'] as const,
    bySectionId: (sectionId: string, tableName: string = 'featured_cards') => [...queryKeys.featuredCards.all, sectionId, tableName] as const,
  },
  offers: {
    all: ['offers'] as const,
    bySectionId: (sectionId: string) => [...queryKeys.offers.all, sectionId] as const,
  },
  ads: {
    all: ['ads'] as const,
    bySectionId: (sectionId: string, type: '1col' | '2col' | '3col') => [...queryKeys.ads.all, sectionId, type] as const,
  },
  sectionContent: {
    bySectionId: (tableName: string, sectionId: string) => ['sectionContent', tableName, sectionId] as const,
  },
};
