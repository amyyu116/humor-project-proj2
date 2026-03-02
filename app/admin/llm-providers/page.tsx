import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import AdminLayoutShell from "@/components/admin/AdminLayoutShell";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminTable from "@/components/admin/AdminTable";
import AdminPagination from "@/components/admin/AdminPagination";
import {
    createPageLinkBuilder,
    getPage,
    getParam,
    getRange,
    getTotalPages,
} from "@/utils/admin/tableParams";

interface Props {
    searchParams: Promise<{
        search?: string | string[];
        page?: string | string[];
    }>;
}

type LlmProviderRow = {
    id: number;
    name: string;
    created_datetime_utc: string;
};

const PAGE_SIZE = 20;

export default async function LlmProvidersPage({ searchParams }: Props) {
    const supabase = await createClient();
    const params = await searchParams;

    const search = getParam(params, "search");
    const page = getPage(params);
    const { from, to } = getRange(page, PAGE_SIZE);

    let query = supabase
        .from("llm_providers")
        .select("id, name, created_datetime_utc", { count: "exact" });

    if (search) {
        query = query.ilike("name", `%${search}%`);
    }

    const { data, count } = await query
        .order("name", { ascending: true })
        .range(from, to);

    const providers = (data ?? []) as LlmProviderRow[];
    const totalPages = getTotalPages(count, PAGE_SIZE);
    const buildPageLink = createPageLinkBuilder({ search });

    return (
        <AdminLayoutShell>
            <AdminPageHeader
                title="LLM Providers"
                actionHref="/admin/llm-providers/new"
                actionLabel="New Provider"
            />

            <form method="GET" className="admin-search">
                <input
                    type="text"
                    name="search"
                    defaultValue={search}
                    placeholder="Search provider name..."
                />
                <button type="submit">Search</button>
            </form>

            <AdminTable headers={["ID", "Name", "Created", "Actions"]}>
                {providers.length > 0 ? (
                    providers.map((provider) => (
                        <tr key={provider.id}>
                            <td>{provider.id}</td>
                            <td>{provider.name}</td>
                            <td>
                                {new Date(
                                    provider.created_datetime_utc,
                                ).toLocaleString()}
                            </td>
                            <td>
                                <Link href={`/admin/llm-providers/${provider.id}`}>
                                    Edit / Delete
                                </Link>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={4} style={{ textAlign: "center" }}>
                            No providers found.
                        </td>
                    </tr>
                )}
            </AdminTable>
            <AdminPagination
                page={page}
                totalPages={totalPages}
                buildPageLink={buildPageLink}
            />
        </AdminLayoutShell>
    );
}



