import { describe, expect, it } from 'vitest';
import { buildAuditMessage, calculateChanges } from './auditLog.js';

describe('calculateChanges', () => {
  it('returns only changed fields', () => {
    expect(calculateChanges(
      { id: '1', name: 'Before', visible: true },
      { id: '1', name: 'After', visible: false },
    )).toEqual({
      name: { old: 'Before', new: 'After' },
      visible: { old: true, new: false },
    });
  });

  it('represents added and removed values as null', () => {
    expect(calculateChanges({ name: 'Before' }, { description: 'After' })).toEqual({
      name: { old: 'Before', new: null },
      description: { old: null, new: 'After' },
    });
  });
});

describe('buildAuditMessage', () => {
  it('includes category and subcategory hierarchy for brand changes', () => {
    expect(buildAuditMessage({
      actorName: 'Faiz',
      action: 'created',
      entityTable: 'subcategory_brands',
      context: {
        entityLabel: 'Brand',
        itemName: 'Twilio',
        categoryName: 'Connectivity & CPaaS',
        subcategoryName: 'SMS',
      },
    })).toBe('Created — Connectivity & CPaaS (Twilio)');
  });

  it('preserves create, update, and delete actions for brands and action links', () => {
    const context = {
      entityLabel: 'Brand',
      brandName: 'Jio2',
      categoryName: 'Connectivity & CPaaS',
      subcategoryName: 'Data Connectivity',
      actionLinkName: 'WI',
    };

    expect(buildAuditMessage({ actorName: 'Faiz', action: 'created', entityTable: 'subcategory_brands', context })).toBe('Created — Connectivity & CPaaS (WI)');
    expect(buildAuditMessage({ actorName: 'Faiz', action: 'updated', entityTable: 'subcategory_brands', context })).toBe('Updated — Connectivity & CPaaS (WI)');
    expect(buildAuditMessage({ actorName: 'Faiz', action: 'deleted', entityTable: 'subcategory_brands', context })).toBe('Deleted — Connectivity & CPaaS (WI)');
  });

  it('formats ad slot names without raw database table names', () => {
    expect(buildAuditMessage({
      actorName: 'Faiz',
      action: 'updated',
      entityTable: 'ads_2col',
      context: {
        entityLabel: 'Ad 2',
        categoryName: 'Connectivity & CPaaS',
        subcategoryName: 'SMS',
      },
      itemName: 'Ad 2',
    })).toBe('Updated — Connectivity & CPaaS (Ad 2)');
  });

  it('formats each resolved ad slot with its section label', () => {
    expect(buildAuditMessage({ actorName: 'Faiz', action: 'created', entityTable: 'ads_2col', context: { entityLabel: 'Ad 2', adSlotLabel: 'Ad 1' } })).toBe('Created — Ad 1 (Ad 1)');
    expect(buildAuditMessage({ actorName: 'Faiz', action: 'created', entityTable: 'ads_2col', context: { entityLabel: 'Ad 2', adSlotLabel: 'Ad 2' } })).toBe('Created — Ad 2 (Ad 2)');
    expect(buildAuditMessage({ actorName: 'Faiz', action: 'created', entityTable: 'ads_3col', context: { entityLabel: 'Ad 3', adSlotLabel: 'Ad 3' } })).toBe('Created — Ad 3 (Ad 3)');
  });

  it('keeps resolved ads in the action-heading-item format', () => {
    expect(buildAuditMessage({
      actorName: 'Faiz',
      action: 'updated',
      entityTable: 'ads_2col',
      context: {
        entityLabel: 'Ad 2',
        sectionName: 'Connectivity & CPaaS',
        adSlotLabel: 'Ad 2',
      },
      itemName: 'Jio',
    })).toBe('Updated — Connectivity & CPaaS (Jio)');
  });

  it('keeps storage events excluded from user messages', () => {
    expect(buildAuditMessage({
      actorName: 'Faiz',
      action: 'created',
      entityTable: 'storage.objects',
      context: { entityLabel: 'storage objects' },
      fallbackText: 'storage_object',
    })).toContain('storage_object');
  });
});