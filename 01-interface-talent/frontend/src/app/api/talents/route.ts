import { NextRequest, NextResponse } from 'next/server';

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;

        const emailFilter = searchParams.get('filter[user_id][email][_icontains]');

        let userIds: string[] = [];

        if (emailFilter) {
            const usersParams = new URLSearchParams({
                'filter[email][_icontains]': emailFilter,
                fields: 'id',
                limit: '1000',
            });

            const usersUrl = new URL('/users', DIRECTUS_URL);
            usersUrl.search = usersParams.toString();

            try {
                const usersRes = await fetch(usersUrl.toString(), {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    cache: 'no-store',
                });

                if (usersRes.ok) {
                    const usersData = await usersRes.json();
                    userIds = usersData.data?.map((user: any) => user.id) || [];
                }
            } catch (err) {
                console.error('Error fetching users:', err);
            }

            if (userIds.length === 0) {
                return NextResponse.json({
                    data: [],
                    meta: {
                        total_count: 0,
                        filter_count: 0,
                    },
                });
            }
        }

        const params = new URLSearchParams();
        searchParams.forEach((value, key) => {
            if (!key.startsWith('filter[user_id][email]')) {
                params.append(key, value);
            }
        });

        if (userIds.length > 0) {
            userIds.forEach((userId) => {
                params.append('filter[user_id][_in][]', userId);
            });
        }

        if (!searchParams.has('meta')) {
            params.append('meta', '*');
        }

        if (!searchParams.has('fields')) {
            params.append('fields', '*,user_id.email');
        }

        const url = new URL('/items/talents', DIRECTUS_URL);
        url.search = params.toString();

        const res = await fetch(url.toString(), {
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!res.ok) {
            const text = await res.text();
            return NextResponse.json(
                { error: `Directus request failed (${res.status}): ${text}` },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching talents:', error);
        return NextResponse.json(
            { error: 'Failed to fetch talents' },
            { status: 500 }
        );
    }
}

