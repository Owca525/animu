import { createSignal, createResource, createEffect, onCleanup, Accessor } from "solid-js";

type UseQueryOptions<T, TData> = {
    queryKey: T[];
    queryFn: (Key: T[]) => Promise<TData>;
    cacheTime?: number
    removeOnClenup?: boolean
};

let cache: Map<string, any> = new Map();

async function generateSha256(text: any) {
    const str = JSON.stringify(text);
    const encoded = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function useResponse<T, TData>(options: UseQueryOptions<T, TData>) {
    const [loading, setLoading] = createSignal<boolean>(true);
    const [error, setError] = createSignal<boolean>(false);
    const { queryKey: rawKey, queryFn, cacheTime, removeOnClenup } = options;

    const [queryData, setQueryData] = createSignal<T[]>(rawKey);
    function getQueryKey() {
        return queryData().map((value) => typeof value === "function" ? (value as Accessor<T>)() : value)
    };

    let cacheTimeOut: NodeJS.Timeout | undefined

    const [data, { refetch }] = createResource(
        async () => {
            const queryKey = getQueryKey()
            const sha256 = await generateSha256(queryKey)
            console.log(sha256, queryKey)
            if (cacheTime && cache.has(sha256)) return cache.get(sha256)
            
            let data = await queryFn(queryKey)
            if (cacheTime) makeCache(data, sha256)
            return data
        }
    );

    async function makeCache(data: any, sha256: string) {
        if (!cacheTime) return
        cache.set(sha256, data)
        cacheTimeOut = setTimeout(() => {
            cache.delete(sha256)
        }, cacheTime);
    }

    function Refetch(queryKey?: T[]) {
        if (queryKey) setQueryData(queryKey)
        refetch()
    }

    createEffect(() => {
        setLoading(data.loading);
        setError(data.error);
    });

    onCleanup(() => {
        if (removeOnClenup && cacheTimeOut) clearInterval(cacheTimeOut)
    })

    return { data, loading, error, Refetch };
}
