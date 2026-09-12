import { getSupabaseAdmin } from './supabaseAdmin.js';

export type AuditAction = 'created' | 'updated' | 'deleted';

export interface AuditActor {
  id: string;
  email: string | null;
  name: string | null;
}

export interface AuditContext {
  entityLabel: string;
  itemName?: string | null;
  categoryName?: string | null;
  subcategoryName?: string | null;
  brandName?: string | null;
  sectionName?: string | null;
  adSlotLabel?: string | null;
  actionLinkName?: string | null;
}

function valuesEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function toSentenceCase(value: string): string {
  return value.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function escapeForDescription(value: string): string {
  return value.replace(/['\\]/g, '\\$&');
}

function getDefaultEntityLabel(entityTable: string, entityType?: string): string {
  const table = entityTable || entityType || '';
  const labels: Record<string, string> = {
    categories: 'Category',
    subcategories: 'Subcategory',
    subcategory_brands: 'Brand',
    featured_cards: 'Featured Card',
    subcategory_featured_cards: 'Featured Card',
    offers: 'Offer',
    subcategory_offers: 'Offer',
    ads_1col: 'Ad 1',
    ads_2col: 'Ad 2',
    ads_3col: 'Ad 3',
    subcategory_ads_2col: 'Ad 2',
    subcategory_ads_3col: 'Ad 3',
    page_sections: 'Section',
    subcategory_page_sections: 'Section',
    faqs: 'FAQ',
    header_settings: 'Header Settings',
    footer_settings: 'Footer Settings',
    contact_settings: 'Contact Settings',
    legal_pages: 'Legal Page',
    advertise_page_settings: 'Advertise Settings',
    write_for_us_settings: 'Write for Us Settings',
    vendor_guidelines_settings: 'Vendor Guidelines Settings',
    browse_all_directories_settings: 'Browse All Directories Settings',
  };

  if (labels[table]) return labels[table];
  if (entityType && labels[entityType]) return labels[entityType];
  return toSentenceCase(table || entityType || 'item');
}

function toActionPhrase(action: AuditAction): string {
  return action === 'created' ? 'created' : action === 'updated' ? 'updated' : 'deleted';
}

function getAdSlotLabel(sectionType: string | null): string | null {
  if (sectionType === 'ads_1col') return 'Ad 1';
  if (sectionType === 'ads_2col') return 'Ad 2';
  if (sectionType === 'ads_3col') return 'Ad 3';
  return null;
}

const INTERNAL_AUDIT_TABLES = new Set([
  'category_buttons',
  'subcategory_about_sections',
  'subcategory_key_features_sections',
  'subcategory_overview_points',
]);

async function fetchRelatedCategory(categoryId: string | null | undefined): Promise<{ name: string | null; section_id: string | null } | null> {
  if (!categoryId) return null;
  const { data, error } = await getSupabaseAdmin().from('categories').select('name, section_id').eq('id', categoryId).maybeSingle();
  if (error || !data) return null;
  return { name: normalizeText(data.name), section_id: normalizeText(data.section_id) };
}

async function fetchRelatedCategoryName(categoryId: string | null | undefined): Promise<string | null> {
  const category = await fetchRelatedCategory(categoryId);
  return category?.name ?? null;
}

async function fetchRelatedSubcategory(subcategoryId: string | null | undefined): Promise<{ name: string | null; category_id: string | null } | null> {
  if (!subcategoryId) return null;
  const { data, error } = await getSupabaseAdmin().from('subcategories').select('name, category_id').eq('id', subcategoryId).maybeSingle();
  if (error || !data) return null;
  return { name: normalizeText(data.name), category_id: normalizeText(data.category_id) };
}

async function fetchRelatedSectionContext(sectionId: string | null | undefined): Promise<{ name: string | null; section_type: string | null; subcategory_id: string | null }> {
  if (!sectionId) {
    return { name: null, section_type: null, subcategory_id: null };
  }

  const { data, error } = await getSupabaseAdmin().from('subcategory_page_sections').select('name, heading, section_type, subcategory_id').eq('id', sectionId).maybeSingle();
  if (!error && data) {
    return {
      name: normalizeText(data.name) ?? normalizeText(data.heading),
      section_type: normalizeText(data.section_type),
      subcategory_id: normalizeText(data.subcategory_id),
    };
  }

  const { data: pageSection, error: pageError } = await getSupabaseAdmin().from('page_sections').select('name, heading, section_type').eq('id', sectionId).maybeSingle();
  if (pageError || !pageSection) {
    return { name: null, section_type: null, subcategory_id: null };
  }

  return {
    name: normalizeText(pageSection.name) ?? normalizeText(pageSection.heading),
    section_type: normalizeText(pageSection.section_type),
    subcategory_id: null,
  };
}

async function resolveAuditContext(input: {
  entityTable: string;
  entityType?: string;
  action?: AuditAction;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
}): Promise<AuditContext> {
  const row = input.newData && Object.keys(input.newData).length > 0 ? input.newData : input.oldData ?? {};
  const entityLabel = getDefaultEntityLabel(input.entityTable, input.entityType);
  const context: AuditContext = { entityLabel };

  const recordName = normalizeText((row as Record<string, unknown>).name) ??
    normalizeText((row as Record<string, unknown>).title) ??
    normalizeText((row as Record<string, unknown>).heading) ??
    normalizeText((row as Record<string, unknown>).label) ??
    normalizeText((row as Record<string, unknown>).title_name);

  const brandName = normalizeText((row as Record<string, unknown>).name) ??
    normalizeText((row as Record<string, unknown>).brand_name);

  if (recordName) context.itemName = recordName;
  if (brandName) context.brandName = brandName;

  const categoryId = normalizeText((row as Record<string, unknown>).category_id as string | null | undefined) ??
    normalizeText((row as Record<string, unknown>).categoryId as string | null | undefined);

  const subcategoryId = normalizeText((row as Record<string, unknown>).subcategory_id as string | null | undefined) ??
    normalizeText((row as Record<string, unknown>).subcategoryId as string | null | undefined);

  if (categoryId) {
    const category = await fetchRelatedCategory(categoryId);
    context.categoryName = category?.name ?? null;
    if (!context.sectionName && category?.section_id) {
      const sectionContext = await fetchRelatedSectionContext(category.section_id);
      context.sectionName = sectionContext.name;
    }
  }

  const maybeSectionId = normalizeText((row as Record<string, unknown>).section_id as string | null | undefined) ??
    normalizeText((row as Record<string, unknown>).sectionId as string | null | undefined);

  if (maybeSectionId) {
    const sectionContext = await fetchRelatedSectionContext(maybeSectionId);
    if (sectionContext.name) {
      context.sectionName = sectionContext.name;
    }
    context.adSlotLabel = getAdSlotLabel(sectionContext.section_type);

    if (sectionContext.subcategory_id) {
      const foundSubcategory = await fetchRelatedSubcategory(sectionContext.subcategory_id);
      if (foundSubcategory?.name) {
        context.subcategoryName = foundSubcategory.name;
        if (!context.categoryName && foundSubcategory.category_id) {
          context.categoryName = await fetchRelatedCategoryName(foundSubcategory.category_id);
        }
      }
    }
  }

  if (subcategoryId) {
    const foundSubcategory = await fetchRelatedSubcategory(subcategoryId);
    if (foundSubcategory?.name) {
      context.subcategoryName = foundSubcategory.name;
      if (!context.categoryName && foundSubcategory.category_id) {
        const category = await fetchRelatedCategory(foundSubcategory.category_id);
        context.categoryName = category?.name ?? null;
        if (!context.sectionName && category?.section_id) {
          const sectionContext = await fetchRelatedSectionContext(category.section_id);
          context.sectionName = sectionContext.name;
        }
      }
    }
  }

  if (input.entityTable === 'subcategory_brands' && !(context.itemName || context.brandName)) {
    context.itemName = normalizeText((row as Record<string, unknown>).name);
  }

  if (input.entityTable === 'subcategory_brands') {
    const oldLinks = Array.isArray(input.oldData?.action_links)
      ? input.oldData.action_links as Array<Record<string, unknown>>
      : [];
    const newLinks = Array.isArray(input.newData?.action_links)
      ? input.newData.action_links as Array<Record<string, unknown>>
      : [];
    const linksChanged = !input.oldData || !valuesEqual(input.oldData.action_links, input.newData?.action_links);
    const oldLinkIds = new Set(oldLinks.map((link, index) => String(link.id ?? `link-${index}`)));
    const newLinkIds = new Set(newLinks.map((link, index) => String(link.id ?? `link-${index}`)));
    const actionLinks = linksChanged
      ? input.action === 'deleted'
        ? oldLinks.filter((link, index) => !newLinkIds.has(String(link.id ?? `link-${index}`)))
        : input.action === 'created'
          ? newLinks.filter((link, index) => !oldLinkIds.has(String(link.id ?? `link-${index}`)))
          : newLinks.length > 0 ? newLinks : oldLinks
      : [];

    if (actionLinks.length > 0) {
      const firstLink = actionLinks.find((link) => normalizeText(link.text) || normalizeText(link.url));
      if (firstLink) {
        const firstText = normalizeText(firstLink.text) ?? normalizeText(firstLink.url) ?? 'Action Link';
        context.actionLinkName = firstText;
      }
    }
  }

  return context;
}

export function buildAuditMessage(input: {
  actorName: string | null;
  action: AuditAction;
  entityTable: string;
  entityType?: string;
  context?: AuditContext;
  itemName?: string | null;
  fallbackText?: string | null;
}): string {
  const actor = input.actorName?.trim() || 'Admin';
  const verb = toActionPhrase(input.action);
  const contextValue = input.context ?? { entityLabel: getDefaultEntityLabel(input.entityTable, input.entityType) };
  const itemLabel = input.itemName ?? contextValue.itemName ?? null;
  const label = contextValue.adSlotLabel || contextValue.entityLabel || getDefaultEntityLabel(input.entityTable, input.entityType);

  const heading = contextValue.sectionName ?? contextValue.categoryName ?? label;
  const activityItem = contextValue.actionLinkName ?? itemLabel;
  if (activityItem && !contextValue.adSlotLabel) {
    const actionLabel = `${verb.charAt(0).toUpperCase()}${verb.slice(1)}`;
    return `${actionLabel} — ${escapeForDescription(heading)} (${escapeForDescription(activityItem)})`;
  }

  if (contextValue.actionLinkName && contextValue.brandName) {
    const location = contextValue.categoryName && contextValue.subcategoryName
      ? `'${escapeForDescription(contextValue.categoryName)}' → '${escapeForDescription(contextValue.subcategoryName)}'`
      : contextValue.categoryName
        ? `'${escapeForDescription(contextValue.categoryName)}'`
        : 'this location';

    return `${actor} ${verb === 'deleted' ? 'deleted' : 'added'} Action Link '${escapeForDescription(contextValue.actionLinkName)}' to Brand '${escapeForDescription(contextValue.brandName)}' in ${location}`;
  }

  if (contextValue.brandName && contextValue.categoryName) {
    const location = contextValue.subcategoryName
      ? `'${escapeForDescription(contextValue.categoryName)}' → '${escapeForDescription(contextValue.subcategoryName)}'`
      : `'${escapeForDescription(contextValue.categoryName)}'`;
    const displayName = itemLabel ? `'${escapeForDescription(itemLabel)}'` : `'${escapeForDescription(contextValue.brandName)}'`;
    const actionText = verb === 'deleted' ? 'deleted Brand' : `${verb} Brand`;
    return `${actor} ${actionText} ${displayName} in ${location}`;
  }

  if (contextValue.sectionName && contextValue.categoryName && !contextValue.subcategoryName) {
    const sectionDisplay = `'${escapeForDescription(contextValue.sectionName)}'`;
    return `${actor} ${verb} section ${sectionDisplay} in Category '${escapeForDescription(contextValue.categoryName)}'`;
  }

  if (contextValue.sectionName && contextValue.categoryName && contextValue.subcategoryName) {
    const sectionDisplay = `'${escapeForDescription(contextValue.sectionName)}'`;
    const location = `'${escapeForDescription(contextValue.categoryName)}' → '${escapeForDescription(contextValue.subcategoryName)}'`;
    return `${actor} ${verb} section ${sectionDisplay} in ${location}`;
  }

  if (contextValue.adSlotLabel) {
    const actionLabel = `${verb.charAt(0).toUpperCase()}${verb.slice(1)}`;
    const heading = contextValue.sectionName ?? contextValue.categoryName ?? contextValue.adSlotLabel;
    return `${actionLabel} — ${escapeForDescription(heading)} (${escapeForDescription(activityItem ?? contextValue.adSlotLabel)})`;
  }

  if (itemLabel) {
    const displayItem = `'${escapeForDescription(itemLabel)}'`;
    if (contextValue.categoryName && contextValue.subcategoryName) {
      const location = `'${escapeForDescription(contextValue.categoryName)}' → '${escapeForDescription(contextValue.subcategoryName)}'`;
      return `${actor} ${verb} ${label} ${displayItem} in ${location}`;
    }
    if (contextValue.categoryName) {
      return `${actor} ${verb} ${label} ${displayItem} in '${escapeForDescription(contextValue.categoryName)}'`;
    }
    if (contextValue.subcategoryName) {
      return `${actor} ${verb} ${label} ${displayItem} in '${escapeForDescription(contextValue.subcategoryName)}'`;
    }
    return `${actor} ${verb} ${label} ${displayItem}`;
  }

  const fallback = input.fallbackText ?? label;
  if (contextValue.categoryName && contextValue.subcategoryName) {
    return `${actor} ${verb} ${fallback} in '${escapeForDescription(contextValue.categoryName)}' → '${escapeForDescription(contextValue.subcategoryName)}'`;
  }
  if (contextValue.categoryName) {
    return `${actor} ${verb} ${fallback} in '${escapeForDescription(contextValue.categoryName)}'`;
  }
  return `${actor} ${verb} ${fallback}`;
}

export function calculateChanges(
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown> | null,
) {
  if (!oldData || !newData) return null;

  const changes: Record<string, { old: unknown; new: unknown }> = {};
  const keys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
  for (const key of keys) {
    if (!valuesEqual(oldData[key], newData[key])) {
      changes[key] = {
        old: oldData[key] ?? null,
        new: newData[key] ?? null,
      };
    }
  }
  return changes;
}

export async function writeAuditLog(input: {
  actor: AuditActor;
  action: AuditAction;
  entityTable: string;
  entityType?: string;
  recordId?: string | null;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  requestId: string;
}) {
  if (
    input.entityTable === 'storage.objects' ||
    input.entityType === 'storage_object' ||
    INTERNAL_AUDIT_TABLES.has(input.entityTable)
  ) {
    return;
  }

  const context = await resolveAuditContext(input);
  const row = input.newData && Object.keys(input.newData).length > 0 ? input.newData : input.oldData ?? {};
  const itemName = normalizeText((row as Record<string, unknown>).name) ??
    normalizeText((row as Record<string, unknown>).title) ??
    normalizeText((row as Record<string, unknown>).heading) ??
    normalizeText((row as Record<string, unknown>).label) ??
    normalizeText((row as Record<string, unknown>).brand_name) ??
    null;

  const description = buildAuditMessage({
    actorName: input.actor.name,
    action: input.action,
    entityTable: input.entityTable,
    entityType: input.entityType,
    context,
    itemName,
    fallbackText: getDefaultEntityLabel(input.entityTable, input.entityType),
  });

  const { error } = await getSupabaseAdmin().from('admin_audit_logs').insert({
    actor_user_id: input.actor.id,
    actor_email: input.actor.email,
    actor_name: input.actor.name,
    action: input.action,
    entity_type: input.entityType ?? input.entityTable,
    entity_table: input.entityTable,
    record_id: input.recordId ?? null,
    old_data: input.oldData ?? null,
    new_data: input.newData ?? null,
    changes: calculateChanges(input.oldData ?? null, input.newData ?? null),
    request_id: input.requestId,
    description,
  });

  if (error) throw error;
}

export async function writeAuditLogsBestEffort(
  entries: Array<Parameters<typeof writeAuditLog>[0]>,
) {
  for (const entry of entries) {
    try {
      await writeAuditLog(entry);
    } catch (error) {
      console.error('[audit] Failed to write audit record', {
        error: error instanceof Error ? error.message : error,
        table: entry.entityTable,
        recordId: entry.recordId,
        requestId: entry.requestId,
      });
    }
  }
}
