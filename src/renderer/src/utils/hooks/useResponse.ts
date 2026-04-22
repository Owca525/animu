import { createSignal, onCleanup, Accessor, onMount } from "solid-js";
import { sha256 } from "js-sha256";

type UseResponseOptions<T, TData> = {
    queryKey: T[];
    queryFn: (Key: T[]) => Promise<TData>;
    cacheTime?: number
    removeOnClenup?: boolean
    disable?: boolean
};

let cache: Map<string, any> = new Map();

async function generateSha256(text: any) {
    const str = JSON.stringify(text);
    return sha256(str)
}

export function useResponse<T, TData>(options: UseResponseOptions<T, TData>) {
    const [loading, setLoading] = createSignal<boolean>(false);
    const [error, setError] = createSignal<boolean>(false);
    const [data, setData] = createSignal<TData>()
    const [forceRefetch, setForceRefetch] = createSignal<boolean>(false);
    const { queryKey: rawKey, queryFn, cacheTime, removeOnClenup, disable } = options;

    const [dissable, setDissable] = createSignal<boolean>(disable ? true : false);
    const [queryData, setQueryData] = createSignal<T[]>(rawKey);
    function getQueryKey() {
        return queryData().map((value) => typeof value === "function" ? (value as Accessor<T>)() : value)
    };

    let cacheTimeOut: NodeJS.Timeout | undefined

    // Changing to fetch because i can't manage when useResource start request
    async function fetchData() {
        setLoading(true)
        setError(false)

        try {
            if (dissable()) return undefined
            const queryKey = getQueryKey()
            const sha256 = await generateSha256(queryKey)
            if (!forceRefetch() && cache.has(sha256)) {
                setLoading(false)
                setError(false)
                return setData(cache.get(sha256))
            }
            setForceRefetch(false)

            let data = await queryFn(queryKey)
            if (cacheTime) makeCache(data, sha256)
            
            setData(data as any)
            setLoading(false)
            setError(false)
        } catch (error) {
            console.error("useResponse Error", error)
            setError(true)
            setLoading(false)
            setData(undefined)
        }
    }

    async function makeCache(data: any, sha256: string) {
        if (!cacheTime) return
        cache.set(sha256, data)
        cacheTimeOut = setTimeout(() => {
            cache.delete(sha256)
        }, cacheTime);
    }

    function Refetch(queryKey?: T[], force?: boolean) {
        setDissable(false)
        if (queryKey) setQueryData(queryKey)
        if (force) setForceRefetch(force)
        fetchData()
    }

    onMount(async () => {
        if (dissable()) return
        await fetchData()
    })

    onCleanup(() => {
        if (removeOnClenup && cacheTimeOut) clearInterval(cacheTimeOut)
    })

    return { data, loading, error, Refetch };
}
