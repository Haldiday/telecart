export type AuditModule =
  | 'section-headings'
  | 'categories'
  | 'subcategories'
  | 'brands'
  | 'brand-action-links'
  | 'ads'
  | 'offers'
  | 'featured-cards';

export type AuditAction = 'create' | 'update' | 'delete';

export interface AuditHierarchy {
  section_heading?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
}

export interface CreateAuditLogRequest {
  module: AuditModule;
  action: AuditAction;
  entity_type: string;
  entity_id?: string;
  entity_name: string;
  ad_slot?: 1 | 2 | 3 | null;
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
  hierarchy_override?: AuditHierarchy | null;
}

export interface AuditLogRecord {
  id: string;
  actor_id: string | null;
  actor_user_id: string | null;
  actor_email: string | null;
  actor_name: string;
  actor_avatar: string | null;
  module: AuditModule;
  action: AuditAction;
  entity_table: string;
  entity_type: string;
  record_id: string | null;
  entity_id: string | null;
  entity_name: string;
  description: string | null;
  request_id: string | null;
  correlation_id: string | null;
  ad_slot: number | null;
  hierarchy: AuditHierarchy;
  old_data: Record<string, any> | null;
  new_data: Record<string, any> | null;
  changes: Record<string, any> | null;
  created_at: string;
}
