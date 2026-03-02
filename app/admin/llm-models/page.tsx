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

type LlmModelRow = {
    id: number;
    name: string;
    llm_provider_id: number;
    provider_model_id: string;
    is_temperature_supported: boolean;
    created_datetime_utc: string;
    llm_providers: { name: string } | null;
};

const PAGE_SIZE = 20;

export default async function LlmModelsPage({ searchParams }: Props) {
    const supabase = await createClient();
    const params = await searchParams;

    const search = getParam(params, "search");
    const page = getPage(params);
    const { from, to } = getRange(page, PAGE_SIZE);

    let query = supabase.from("llm_models").select(
        "id, name, llm_provider_id, provider_model_id, is_temperature_supported, created_datetime_utc, llm_providers(name)",
        { count: "exact" },
    );

    if (search) {
        query = query.or(`name.ilike.%${search}%,provider_model_id.ilike.%${search}%`);
    }

    const { data, count } = await query
        .order("name", { ascending: true })
        .range(from, to);

    const models = (data ?? []) as unknown as LlmModelRow[];
    const totalPages = getTotalPages(count, PAGE_SIZE);
    const buildPageLink = createPageLinkBuilder({ search });

    return (
        <AdminLayoutShell>
            <AdminPageHeader
                title="LLM Models"
                actionHref="/admin/llm-models/new"
                actionLabel="New Model"
            />

            <form method="GET" className="admin-search">
                <input
                    type="text"
                    name="search"
                    defaultValue={search}
                    placeholder="Search model name or provider model id..."
                />
                <button type="submit">Search</button>
            </form>

            <AdminTable
                headers={[
                    "ID",
                    "Name",
                    "Provider",
                    "Provider Model ID",
                    "Temperature",
                    "Actions",
                ]}
            >
                {models.length > 0 ? (
                    models.map((model) => (
                        <tr key={model.id}>
                            <td>{model.id}</td>
                            <td>{model.name}</td>
                            <td>
                                {model.llm_providers?.name || "-"} (#{model.llm_provider_id}
                                )
                            </td>
                            <td>{model.provider_model_id}</td>
                            <td>{model.is_temperature_supported ? "Yes" : "No"}</td>
                            <td>
                                <Link href={`/admin/llm-models/${model.id}`}>
                                    Edit / Delete
                                </Link>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={6} style={{ textAlign: "center" }}>
                            No models found.
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



