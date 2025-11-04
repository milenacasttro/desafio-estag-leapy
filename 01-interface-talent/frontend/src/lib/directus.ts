// Variáveis usadas no cliente precisam ter prefixo NEXT_PUBLIC_
const getDirectusConfig = () => {
    const baseUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055';

    return {
        baseUrl,
        token: process.env.NEXT_PUBLIC_DIRECTUS_TOKEN || '',
    };
};

export async function directusFetch(endpoint: string, params: Record<string, string> = {}) {
    const config = getDirectusConfig();
    const baseUrl = config.baseUrl;

    const fullUrl = endpoint.startsWith('http')
        ? endpoint
        : `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

    const url = new URL(fullUrl);
    const search = new URLSearchParams(params);
    url.search = search.toString();

    const headers: HeadersInit = {};
    const token = config.token?.trim();
    if (token && token.length > 0) {
        headers.Authorization = `Bearer ${token}`;
    }

    try {
        const res = await fetch(url.toString(), {
            method: 'GET',
            headers,
            cache: 'no-store',
            mode: 'cors',
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Directus request failed (${res.status}): ${text}`);
        }

        return res.json();
    } catch (err) {
        if (err instanceof Error && (err.message.includes('Failed to fetch') || err.message.includes('fetch'))) {
            throw new Error(
                `Não foi possível conectar ao Directus em ${baseUrl}. Verifique se o servidor está rodando e se CORS está configurado. Erro: ${err.message}`
            );
        }
        throw err;
    }
}

export type Talent = {
    id: string;
    department: string | null;
    current_status: string | null;
    orchestrator_state: string | null;
    date_updated: string | null;
    start_date: string | null;
    end_date: string | null;
    pdi_plan_ready: boolean | null;
    leader_id?: {
        id: number;
        department: string | null;
        position: string | null;
    } | number | null;
    target_role_id?: {
        id: number;
        name: string;
    } | number | null;
    user_id?: {
        email?: string;
    } | null;
};

export type Leader = {
    id: number;
    position: string | null;
    department: string | null;
};

export type TargetRole = {
    id: number;
    name: string;
    description: string | null;
};

export type DirectusListResponse<T> = {
    data: T[];
    meta?: {
        total?: number;
        total_count?: number;  // Directus retorna total_count
        filter_count?: number;
        page?: number;
        page_count?: number;
    };
};

// Usa API route do Next.js como proxy (evita CORS e SSR)
export async function fetchTalents(
    params: Record<string, string> = {}
): Promise<DirectusListResponse<Talent>> {
    const searchParams = new URLSearchParams({
        limit: '10',
        page: '1',
        'sort[]': '-date_updated',
        meta: '*',
        ...params,
    });

    const url = `/api/talents?${searchParams.toString()}`;

    const res = await fetch(url, {
        cache: 'no-store',
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || `Request failed (${res.status})`);
    }

    return res.json();
}

export async function fetchLeaders(): Promise<DirectusListResponse<Leader>> {
    const searchParams = new URLSearchParams({
        limit: '100',
        fields: 'id,position,department',
        sort: 'department,position',
    });

    const url = `/api/talents/leaders?${searchParams.toString()}`;
    const res = await fetch(url, { cache: 'no-store' });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || `Request failed (${res.status})`);
    }

    return res.json();
}

export async function fetchTargetRoles(): Promise<DirectusListResponse<TargetRole>> {
    const searchParams = new URLSearchParams({
        limit: '100',
        fields: 'id,name,description',
        sort: 'name',
    });

    const url = `/api/talents/roles?${searchParams.toString()}`;
    const res = await fetch(url, { cache: 'no-store' });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || `Request failed (${res.status})`);
    }

    return res.json();
}


