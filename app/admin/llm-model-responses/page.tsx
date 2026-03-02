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
        llm_prompt_chain_id?: string | string[];
        caption_request_id?: string | string[];
        search?: string | string[];
        page?: string | string[];
    }>;
}

type ModelResponseRow = {
    id: string;
    created_datetime_utc: string;
    llm_model_response: string | null;
    processing_time_seconds: number;
    llm_model_id: number;
    profile_id: string;
    caption_request_id: number;
    llm_temperature: number | null;
    humor_flavor_id: number;
    llm_prompt_chain_id: number | null;
    humor_flavor_step_id: number | null;
    llm_models: { name: string } | null;
};

const PAGE_SIZE = 20;

function truncate(text: string | null, maxLength: number) {
    if (!text) {
        return "-";
    }
    return text.length <= maxLength ? text : `${text.slice(0, maxLength)}...`;
}

export default async function LlmModelResponsesPage({ searchParams }: Props) {
    const supabase = await createClient();
    const params = await searchParams;

    const llmPromptChainIdParam = getParam(params, "llm_prompt_chain_id");
    const captionRequestIdParam = getParam(params, "caption_request_id");
    const search = getParam(params, "search");

    const llmPromptChainId = Number.parseInt(llmPromptChainIdParam, 10);
    const captionRequestId = Number.parseInt(captionRequestIdParam, 10);
    const page = getPage(params);
    const { from, to } = getRange(page, PAGE_SIZE);

    let query = supabase.from("llm_model_responses").select(
        "id, created_datetime_utc, llm_model_response, processing_time_seconds, llm_model_id, profile_id, caption_request_id, llm_temperature, humor_flavor_id, llm_prompt_chain_id, humor_flavor_step_id, llm_models(name)",
        { count: "exact" },
    );

    if (!Number.isNaN(llmPromptChainId)) {
        query = query.eq("llm_prompt_chain_id", llmPromptChainId);
    }
    if (!Number.isNaN(captionRequestId)) {
        query = query.eq("caption_request_id", captionRequestId);
    }
    if (search) {
        query = query.or(`llm_model_response.ilike.%${search}%,profile_id.ilike.%${search}%`);
    }

    const { data, count } = await query
        .order("created_datetime_utc", { ascending: false })
        .range(from, to);

    const responses = (data ?? []) as unknown as ModelResponseRow[];
    const totalPages = getTotalPages(count, PAGE_SIZE);
    const buildPageLink = createPageLinkBuilder({
        llm_prompt_chain_id: llmPromptChainIdParam,
        caption_request_id: captionRequestIdParam,
        search,
    });

    return (
        <AdminLayoutShell>
            <AdminPageHeader title="LLM Model Responses (Read)" />

            <form method="GET" className="admin-search">
                <input
                    type="number"
                    name="llm_prompt_chain_id"
                    defaultValue={llmPromptChainIdParam}
                    placeholder="Prompt chain id..."
                />
                <input
                    type="number"
                    name="caption_request_id"
                    defaultValue={captionRequestIdParam}
                    placeholder="Caption request id..."
                />
                <input
                    type="text"
                    name="search"
                    defaultValue={search}
                    placeholder="Search response or profile id..."
                />
                <button type="submit">Filter</button>
            </form>

            <AdminTable
                headers={[
                    "Created",
                    "Model",
                    "Caption Request",
                    "Prompt Chain",
                    "Flavor Step",
                    "Temp",
                    "Latency (s)",
                    "Response",
                    "Profile",
                ]}
            >
                {responses.length > 0 ? (
                    responses.map((response) => (
                        <tr key={response.id}>
                            <td>
                                {new Date(
                                    response.created_datetime_utc,
                                ).toLocaleString()}
                            </td>
                            <td>
                                {response.llm_models?.name || "-"} (#
                                {response.llm_model_id})
                            </td>
                            <td>{response.caption_request_id}</td>
                            <td>{response.llm_prompt_chain_id ?? "-"}</td>
                            <td>{response.humor_flavor_step_id ?? "-"}</td>
                            <td>
                                {response.llm_temperature !== null
                                    ? response.llm_temperature
                                    : "-"}
                            </td>
                            <td>{response.processing_time_seconds}</td>
                            <td>{truncate(response.llm_model_response, 120)}</td>
                            <td style={{ fontSize: "12px" }}>
                                {truncate(response.profile_id, 16)}
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={9} style={{ textAlign: "center" }}>
                            No model responses found.
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



