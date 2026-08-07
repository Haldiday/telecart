import { getSupabaseAdmin } from './supabase.js';

function applyFilters(query, filters) {
    let result = query;
    for (const filter of filters) {
        switch (filter.op) {
            case 'eq':
                result = result.eq(filter.column, filter.value);
                break;
            case 'neq':
                result = result.neq(filter.column, filter.value);
                break;
            case 'in':
                result = result.in(filter.column, filter.value);
                break;
            case 'is':
                result = result.is(filter.column, filter.value);
                break;
            case 'gt':
                result = result.gt(filter.column, filter.value);
                break;
            case 'gte':
                result = result.gte(filter.column, filter.value);
                break;
            case 'lt':
                result = result.lt(filter.column, filter.value);
                break;
            case 'lte':
                result = result.lte(filter.column, filter.value);
                break;
            case 'like':
                result = result.like(filter.column, filter.value);
                break;
            case 'ilike':
                result = result.ilike(filter.column, filter.value);
                break;
            case 'or':
                result = result.or(filter.value);
                break;
            case 'not':
                // Support 'not' filters. `filter.value` can be either a primitive (treated as !=)
                // or an object { op: 'eq'|'in'|..., value: ... } to express the inner comparison.
                try {
                    if (filter && typeof filter.value === 'object' && filter.value !== null && filter.value.op) {
                        result = result.not(filter.column, filter.value.op, filter.value.value);
                    } else {
                        // default: not equal
                        result = result.not(filter.column, 'eq', filter.value);
                    }
                } catch (e) {
                    // If the runtime supabase client doesn't support this signature, log and rethrow
                    console.error('applyFilters: failed to apply not() filter', { filter, err: e });
                    throw e;
                }
                break;
            default:
                throw new Error(`Unsupported filter operation: ${filter.op}`);
        }
    }
    return result;
}

function applyOrders(query, spec) {
    let result = query;
    for (const order of spec.orders || []) {
        result = result.order(order.column, order.options);
    }
    return result;
}

function applyLimitAndSingle(query, spec) {
    let result = query;
    if (spec.limit != null) {
        result = result.limit(spec.limit);
    }
    if (spec.single) {
        result = result.single();
    } else if (spec.maybeSingle) {
        result = result.maybeSingle();
    }
    return result;
}

function formatError(error) {
    if (!error) return null;
    return {
        message: error.message,
        code: error.code,
        details: error.details,
    };
}

export async function executeQuery(spec, env) {
    const supabase = getSupabaseAdmin(env);

    try {
        if (spec.action === 'select') {
            let query = supabase.from(spec.table).select(spec.select ? ? '*', spec.selectOptions);
            query = applyFilters(query, spec.filters || []);
            query = applyOrders(query, spec);
            query = applyLimitAndSingle(query, spec);
            const { data, error, count } = await query;
            return { data, error: formatError(error), count: count ? ? null };
        }

        if (spec.action === 'insert') {
            let query = supabase.from(spec.table).insert(spec.body);
            if (spec.returning) {
                query = query.select(spec.select ? ? '*');
                query = applyLimitAndSingle(query, spec);
            }
            const { data, error } = await query;
            return { data, error: formatError(error) };
        }

        if (spec.action === 'update') {
            let query = supabase.from(spec.table).update(spec.body);
            query = applyFilters(query, spec.filters || []);
            if (spec.returning) {
                query = query.select(spec.select ? ? '*');
                query = applyLimitAndSingle(query, spec);
            }
            const { data, error } = await query;
            return { data, error: formatError(error) };
        }

        if (spec.action === 'delete') {
            let query = supabase.from(spec.table).delete();
            query = applyFilters(query, spec.filters || []);
            if (spec.returning) {
                query = query.select(spec.select ? ? '*');
                query = applyLimitAndSingle(query, spec);
            }
            const { data, error } = await query;
            return { data, error: formatError(error) };
        }

        if (spec.action === 'upsert') {
            let query = supabase.from(spec.table).upsert(spec.body);
            if (spec.returning) {
                query = query.select(spec.select ? ? '*');
                query = applyLimitAndSingle(query, spec);
            }
            const { data, error } = await query;
            return { data, error: formatError(error) };
        }

        return { data: null, error: { message: `Unsupported action: ${spec.action}` } };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Query execution failed';
        console.error('executeQuery caught exception', { spec, message, err });
        return { data: null, error: { message } };
    }
}