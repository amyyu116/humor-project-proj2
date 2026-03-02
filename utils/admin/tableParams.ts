export type TableSearchParams = Record<string, string | string[] | undefined>;

export function getParam(
    params: TableSearchParams,
    key: string,
    fallback = "",
) {
    const value = params[key];
    return (Array.isArray(value) ? value[0] : value) || fallback;
}

export function getPage(params: TableSearchParams, key = "page") {
    const raw = getParam(params, key, "1");
    return Math.max(Number.parseInt(raw, 10) || 1, 1);
}

export function getRange(page: number, pageSize: number) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    return { from, to };
}

export function getTotalPages(count: number | null, pageSize: number) {
    return count ? Math.ceil(count / pageSize) : 1;
}

export function createPageLinkBuilder(params: Record<string, string>) {
    return (newPage: number) => {
        const nextParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value) {
                nextParams.set(key, value);
            }
        });
        nextParams.set("page", String(newPage));
        return `?${nextParams.toString()}`;
    };
}
