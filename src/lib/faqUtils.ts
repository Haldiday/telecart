export interface FAQRecord {
  id: string;
  parent_id: string | null;
  question: string;
  answer: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface FAQNode extends FAQRecord {
  children: FAQNode[];
}

export function buildFaqTree(records: FAQRecord[], options?: { includeHidden?: boolean }): FAQNode[] {
  const relevantRecords = options?.includeHidden
    ? records
    : records.filter((record) => record.is_visible !== false);
  const byId = new Map(relevantRecords.map((record) => [record.id, { ...record, children: [] as FAQNode[] }]));
  const roots: FAQNode[] = [];

  relevantRecords
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .forEach((record) => {
      const node = byId.get(record.id);
      if (!node) return;

      const parentId = record.parent_id ?? null;
      if (!parentId) {
        roots.push(node);
        return;
      }

      const parent = byId.get(parentId);
      if (parent) {
        parent.children.push(node);
      }
    });

  roots.sort((a, b) => a.sort_order - b.sort_order);
  roots.forEach((root) => {
    root.children.sort((a, b) => a.sort_order - b.sort_order);
  });

  return roots;
}
