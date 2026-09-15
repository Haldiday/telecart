import { getSupabaseAdmin } from '../lib/supabaseAdmin.js';
import type {
  AuditAction,
  AuditHierarchy,
  AuditLogRecord,
  AuditModule,
  CreateAuditLogRequest,
} from '../types/audit.js';

interface ResolveHierarchyOptions {
  section_id?: string | null;
  category_id?: string | null;
  subcategory_id?: string | null;
  brand_id?: string | null;
  entity_type?: string;
  entity_id?: string | null;
  ad_slot_override?: 1 | 2 | 3 | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

function toUuidOrNull(value: unknown): string | null {
  return isValidUuid(value) ? value : null;
}

function toAuditEntityId(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0 || /^legacy-\d+$/i.test(value)) {
    return null;
  }
  return value;
}

const AD_HOME_TABLES = [
  'featured_cards',
  'categories',
  'offers',
  'ads_1col',
  'ads_2col',
  'ads_3col',
] as const;

const AD_TABLE_MAP: Record<string, AuditModule> = {
  page_sections: 'section-headings',
  category_page_sections: 'section-headings',
  subcategory_page_sections: 'section-headings',
  categories: 'categories',
  subcategories: 'subcategories',
  subcategory_brands: 'brands',
  brand_action_links: 'brand-action-links',
  featured_cards: 'featured-cards',
  offers: 'offers',
  ads_1col: 'ads',
  ads_2col: 'ads',
  ads_3col: 'ads',
  subcategory_featured_cards: 'featured-cards',
  subcategory_offers: 'offers',
  subcategory_ads_2col: 'ads',
  subcategory_ads_3col: 'ads',
  category_featured_cards: 'featured-cards',
  category_offers: 'offers',
  category_ads_1col: 'ads',
  category_ads_2col: 'ads',
  category_ads_3col: 'ads',
};

export function getAuditModuleForTable(table: string): AuditModule | null {
  return AD_TABLE_MAP[table] ?? null;
}

export function isAdTable(table: string): boolean {
  return /ads_/.test(table) || /ads_2col|ads_3col/.test(table);
}

async function getAdminUserInfo(actorId: string): Promise<{ name: string; email: string | null; avatar: string | null }> {
  try {
    const supabase = getSupabaseAdmin();
    const actorUuid = toUuidOrNull(actorId);
    if (!actorUuid) {
      return { name: 'Admin', email: null, avatar: null };
    }
    const { data: userData } = await supabase.auth.admin.getUserById(actorUuid);
    const fullName = (userData?.user?.user_metadata as any)?.full_name as string | undefined;
    const avatar = (userData?.user?.user_metadata as any)?.avatar_url as string | undefined;
    const email = userData?.user?.email as string | undefined;

    if (fullName?.trim()) {
      return { name: fullName.trim(), avatar: avatar ?? null, email: email ?? null };
    }
    if (email) {
      const name = email.split('@')[0];
      return { name: name.charAt(0).toUpperCase() + name.slice(1), avatar: avatar ?? null, email: email ?? null };
    }
    return { name: 'Admin', avatar: avatar ?? null, email: null };
  } catch {
    return { name: 'Admin', email: null, avatar: null };
  }
}

async function resolveSectionName(sectionId: string): Promise<string | null> {
  try {
    const supabase = getSupabaseAdmin();
    const sources = ['page_sections', 'subcategory_page_sections', 'category_page_sections'] as const;
    for (const table of sources) {
      const { data } = await supabase.from(table).select('heading,name').eq('id', sectionId).maybeSingle();
      if (data) {
        const h = (data as any)?.heading as string | null | undefined;
        const n = (data as any)?.name as string | null | undefined;
        if (h?.trim()) return h.trim();
        if (n?.trim()) return n.trim();
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function resolveSectionTypeBySectionId(sectionId: string): Promise<string | null> {
  try {
    const supabase = getSupabaseAdmin();
    const sources = ['page_sections', 'subcategory_page_sections', 'category_page_sections'] as const;
    for (const table of sources) {
      const { data } = await supabase.from(table).select('section_type').eq('id', sectionId).maybeSingle();
      if (data) return (data as any)?.section_type ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

export async function resolveAdSlotFromEntity(
  entityType: string,
  entityId: string,
): Promise<1 | 2 | 3 | null> {
  try {
    const supabase = getSupabaseAdmin();
    if (entityType === 'ads_2col' || entityType === 'category_ads_1col' || entityType === 'category_ads_2col' || entityType === 'subcategory_ads_2col') {
      const { data } = await supabase.from(entityType as any).select('section_id').eq('id', entityId).maybeSingle();
      const sectionId = (data as any)?.section_id as string | undefined;
      if (sectionId) {
        const sectionType = await resolveSectionTypeBySectionId(sectionId);
        if (sectionType === 'ads_1col') return 1;
        if (sectionType === 'ads_2col') return 2;
      }
      if (entityType === 'ads_2col') return 2;
      if (entityType === 'category_ads_1col') return 1;
      if (entityType === 'category_ads_2col') return 2;
      if (entityType === 'subcategory_ads_2col') return 2;
    }
    if (entityType === 'ads_3col' || entityType === 'category_ads_3col' || entityType === 'subcategory_ads_3col') {
      return 3;
    }
    if (entityType === 'ads_1col') return 1;
    return null;
  } catch {
    return null;
  }
}

async function resolveCategoryInfo(categoryId: string): Promise<{ name: string; section_id: string | null } | null> {
  try {
    const supabase = getSupabaseAdmin();
    const categoryUuid = toUuidOrNull(categoryId);
    if (!categoryUuid) return null;
    const { data } = await supabase
      .from('categories')
      .select('name, section_id')
      .eq('id', categoryUuid)
      .maybeSingle();
    if (!data) return null;
    return { name: (data as any).name as string, section_id: (data as any).section_id ?? null };
  } catch {
    return null;
  }
}

async function resolveSubcategoryInfo(subcategoryId: string): Promise<{ name: string; category_id: string } | null> {
  try {
    const supabase = getSupabaseAdmin();
    const subcategoryUuid = toUuidOrNull(subcategoryId);
    if (!subcategoryUuid) return null;
    const { data } = await supabase
      .from('subcategories')
      .select('name, category_id')
      .eq('id', subcategoryUuid)
      .maybeSingle();
    if (!data) return null;
    return { name: (data as any).name as string, category_id: (data as any).category_id as string };
  } catch {
    return null;
  }
}

async function resolveBrandInfo(brandId: string): Promise<{ name: string; subcategory_id: string } | null> {
  try {
    const supabase = getSupabaseAdmin();
    const brandUuid = toUuidOrNull(brandId);
    if (!brandUuid) return null;
    const { data } = await supabase
      .from('subcategory_brands')
      .select('name, subcategory_id')
      .eq('id', brandUuid)
      .maybeSingle();
    if (!data) return null;
    return { name: (data as any).name as string, subcategory_id: (data as any).subcategory_id as string };
  } catch {
    return null;
  }
}

async function resolveSectionIdFromContentEntity(
  entityType: string,
  entityId: string,
): Promise<string | null> {
  try {
    const entityUuid = toUuidOrNull(entityId);
    if (!entityUuid) return null;
    const supabase = getSupabaseAdmin();
    const tablesWithSectionId = new Set([
      'featured_cards',
      'categories',
      'offers',
      'ads_2col',
      'ads_3col',
      'subcategory_featured_cards',
      'subcategory_offers',
      'subcategory_ads_2col',
      'subcategory_ads_3col',
      'category_featured_cards',
      'category_offers',
      'category_ads_1col',
      'category_ads_2col',
      'category_ads_3col',
    ]);
    if (!tablesWithSectionId.has(entityType)) return null;
    const { data } = await supabase.from(entityType as any).select('section_id').eq('id', entityUuid).maybeSingle();
    return (data as any)?.section_id ?? null;
  } catch {
    return null;
  }
}

export async function resolveAuditHierarchyAndSlot(options: ResolveHierarchyOptions): Promise<{
  hierarchy: AuditHierarchy;
  resolvedAdSlot: 1 | 2 | 3 | null;
}> {
  const hierarchy: AuditHierarchy = {};
  let resolvedAdSlot: 1 | 2 | 3 | null = options.ad_slot_override ?? null;

  let sectionId: string | null | undefined = options.section_id;
  let categoryId: string | null | undefined = options.category_id;
  let subcategoryId: string | null | undefined = options.subcategory_id;
  let brandId: string | null | undefined = options.brand_id;

  if (options.entity_id && !brandId && (options.entity_type === 'subcategory_brands')) {
    brandId = options.entity_id;
  }

  if (brandId) {
    const brandInfo = await resolveBrandInfo(brandId);
    if (brandInfo) {
      hierarchy.brand = brandInfo.name;
      subcategoryId = subcategoryId ?? brandInfo.subcategory_id;
    }
  }

  if (subcategoryId) {
    const subInfo = await resolveSubcategoryInfo(subcategoryId);
    if (subInfo) {
      hierarchy.subcategory = subInfo.name;
      categoryId = categoryId ?? subInfo.category_id;
    }
  }

  if (categoryId) {
    const catInfo = await resolveCategoryInfo(categoryId);
    if (catInfo) {
      hierarchy.category = catInfo.name;
      sectionId = sectionId ?? catInfo.section_id;
    }
  }

  if (options.entity_id && !sectionId && options.entity_type) {
    sectionId = sectionId ?? (await resolveSectionIdFromContentEntity(options.entity_type, options.entity_id));
  }

  if (sectionId) {
    const sectionName = await resolveSectionName(sectionId);
    if (sectionName) hierarchy.section_heading = sectionName;

    if (!resolvedAdSlot) {
      const sectionType = await resolveSectionTypeBySectionId(sectionId);
      if (sectionType === 'ads_1col') resolvedAdSlot = 1;
      else if (sectionType === 'ads_2col') resolvedAdSlot = 2;
      else if (sectionType === 'ads_3col') resolvedAdSlot = 3;
    }
  }

  if (!resolvedAdSlot && options.entity_id && options.entity_type) {
    resolvedAdSlot = await resolveAdSlotFromEntity(options.entity_type, options.entity_id);
  }

  return { hierarchy, resolvedAdSlot };
}

function normalizeAction(action: unknown): AuditAction {
  if (action === 'create' || action === 'update' || action === 'delete') {
    return action;
  }
  if (action === 'insert' || action === 'upsert') return 'create';
  return 'update';
}

export function buildDisplayDescription(module: AuditModule, action: AuditAction, entityName: string, entityTable: string, adSlot: number | null, hierarchy: AuditHierarchy): string {
  const actionWord =
    action === 'create' ? 'Created' : action === 'delete' ? 'Deleted' : 'Updated';
  let subject: string;

  if (entityTable === 'page_sections') {
    subject = `Section Heading "${entityName}"`;
  } else if (module === 'ads' && adSlot != null) {
    subject = `Ad ${adSlot}`;
  } else if (module === 'brands') {
    subject = `Brand "${entityName}"`;
  } else if (module === 'brand-action-links') {
    subject = `Brand Action Link "${entityName}"`;
  } else {
    const human = entityTable
      .replace(/^subcategory_/, '')
      .replace(/^category_/, '')
      .replace(/_/g, ' ');
    const capitalized = human.charAt(0).toUpperCase() + human.slice(1);
    subject = `${capitalized} "${entityName}"`;
  }

  if (module === 'brand-action-links' && hierarchy.brand) {
    return `${actionWord} ${subject} in Brand "${hierarchy.brand}"`;
  }

  return `${actionWord} ${subject}`;
}

export function buildHierarchyDisplay(hierarchy: AuditHierarchy): string | null {
  const parts: string[] = [];
  if (hierarchy.section_heading) parts.push(`"${hierarchy.section_heading}"`);
  if (hierarchy.category) parts.push(`"${hierarchy.category}"`);
  if (hierarchy.subcategory) parts.push(`"${hierarchy.subcategory}"`);
  if (parts.length === 0) return null;
  return parts.join(' → ');
}

function cloneJson(value: unknown): any {
  if (value == null) return null;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}

interface NormalizedAuditRow {
  actor_user_id: string | null;
  actor_id: string | null;
  actor_email: string | null;
  actor_name: string;
  actor_avatar: string | null;
  action: AuditAction;
  entity_table: string;
  entity_type: string;
  module: AuditModule | null;
  record_id: string | null;
  entity_id: string | null;
  entity_name: string;
  description: string;
  ad_slot: number | null;
  hierarchy: AuditHierarchy;
  old_data: Record<string, any> | null;
  new_data: Record<string, any> | null;
  changes: Record<string, any> | null;
  request_id: string | null;
  correlation_id: string | null;
  created_at?: string;
}

export interface AuditMutationContext {
  actor_user_id: string;
  module: AuditModule;
  action: AuditAction;
  entity_table: string;
  entity_id?: string | null;
  entity_name: string;
  ad_slot_override?: 1 | 2 | 3 | null;
  hierarchy_hints?: {
    section_id?: string | null;
    category_id?: string | null;
    subcategory_id?: string | null;
    brand_id?: string | null;
  };
  old_data?: Record<string, any> | null;
  new_data?: Record<string, any> | null;
  changes?: Record<string, any> | null;
  correlation_id?: string | null;
}

export async function normalizeAuditRow(ctx: AuditMutationContext): Promise<NormalizedAuditRow> {
  const actorUserUuid = toUuidOrNull(ctx.actor_user_id);
  const entityTable = (typeof ctx.entity_table === 'string' && ctx.entity_table.trim())
    ? ctx.entity_table.trim()
    : 'unknown';
  const module: AuditModule = ctx.module ?? getAuditModuleForTable(entityTable) ?? 'categories';
  const { name: actorName, email: actorEmail, avatar: actorAvatar } = await getAdminUserInfo(actorUserUuid ?? ctx.actor_user_id);

  const { hierarchy, resolvedAdSlot } = await resolveAuditHierarchyAndSlot({
    section_id: ctx.hierarchy_hints?.section_id ?? null,
    category_id: ctx.hierarchy_hints?.category_id ?? null,
    subcategory_id: ctx.hierarchy_hints?.subcategory_id ?? null,
    brand_id: ctx.hierarchy_hints?.brand_id ?? null,
    entity_type: entityTable,
    entity_id: ctx.entity_id ?? null,
    ad_slot_override: ctx.ad_slot_override ?? null,
  });

  const action = normalizeAction(ctx.action);
  const entityName = (typeof ctx.entity_name === 'string' && ctx.entity_name.trim())
    ? ctx.entity_name.trim()
    : `(${entityTable})`;

  const description = buildDisplayDescription(
    module,
    action,
    entityName,
    entityTable,
    resolvedAdSlot,
    hierarchy,
  );

  const recordId = toUuidOrNull(ctx.entity_id);
  const entityIdRaw = toAuditEntityId(ctx.entity_id);

  return {
    actor_user_id: actorUserUuid,
    actor_id: actorUserUuid,
    actor_email: actorEmail,
    actor_name: actorName,
    actor_avatar: actorAvatar,
    action,
    entity_table: entityTable,
    entity_type: entityTable,
    module,
    record_id: recordId,
    entity_id: entityIdRaw,
    entity_name: entityName,
    description,
    ad_slot: resolvedAdSlot,
    hierarchy,
    old_data: cloneJson(ctx.old_data ?? null),
    new_data: cloneJson(ctx.new_data ?? null),
    changes: cloneJson(ctx.changes ?? null),
    request_id: (typeof ctx.correlation_id === 'string' && ctx.correlation_id.trim()) ? ctx.correlation_id.trim() : null,
    correlation_id: (typeof ctx.correlation_id === 'string' && ctx.correlation_id.trim()) ? ctx.correlation_id.trim() : null,
  };
}

export async function createAuditLog(
  actorId: string,
  req: CreateAuditLogRequest,
): Promise<AuditLogRecord | null> {
  try {
    const supabase = getSupabaseAdmin();
    const entityTable = (typeof req.entity_type === 'string' && req.entity_type.trim()) ? req.entity_type.trim() : '';
    const module = req.module ?? getAuditModuleForTable(entityTable) ?? 'categories';

    const normalized = await normalizeAuditRow({
      actor_user_id: actorId,
      module,
      action: req.action,
      entity_table: entityTable,
      entity_id: req.entity_id ?? null,
      entity_name: req.entity_name,
      ad_slot_override: req.ad_slot ?? null,
      hierarchy_hints: {
        section_id: req.hierarchy_hints?.section_id ?? null,
        category_id: req.hierarchy_hints?.category_id ?? null,
        subcategory_id: req.hierarchy_hints?.subcategory_id ?? null,
        brand_id: req.hierarchy_hints?.brand_id ?? null,
      },
      old_data: req.old_data ?? null,
      new_data: req.new_data ?? null,
      changes: req.changes ?? null,
      correlation_id: req.correlation_id ?? null,
    });

    const row = {
      actor_user_id: normalized.actor_user_id,
      actor_id: normalized.actor_id,
      actor_email: normalized.actor_email,
      actor_name: normalized.actor_name,
      actor_avatar: normalized.actor_avatar,
      action: normalized.action,
      entity_table: normalized.entity_table,
      entity_type: normalized.entity_type,
      module: normalized.module,
      record_id: normalized.record_id,
      entity_id: normalized.entity_id,
      entity_name: normalized.entity_name,
      description: normalized.description,
      ad_slot: normalized.ad_slot,
      hierarchy: normalized.hierarchy,
      old_data: normalized.old_data,
      new_data: normalized.new_data,
      changes: normalized.changes,
      request_id: normalized.request_id,
      correlation_id: normalized.correlation_id,
    };

    const { data, error } = await supabase
      .from('admin_audit_logs')
      .insert([row as any])
      .select('*')
      .single();

    if (error) {
      console.error('[AUDIT] Error inserting audit log:', error);
      return null;
    }

    return data as unknown as AuditLogRecord;
  } catch (err) {
    console.error('[AUDIT] Unexpected error creating audit log:', err);
    return null;
  }
}

export async function getAuditLogsByModule(
  module: AuditModule,
  limit = 200,
): Promise<AuditLogRecord[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('admin_audit_logs')
      .select('*')
      .eq('module', module)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[AUDIT] Error fetching audit logs:', error);
      return [];
    }

    return (data ?? []) as unknown as AuditLogRecord[];
  } catch (err) {
    console.error('[AUDIT] Unexpected error fetching audit logs:', err);
    return [];
  }
}

export function buildDisplayDescriptionFromRecord(record: AuditLogRecord): string {
  return buildDisplayDescription(
    record.module,
    record.action,
    record.entity_name,
    record.entity_type,
    record.ad_slot,
    record.hierarchy ?? {},
  );
}
