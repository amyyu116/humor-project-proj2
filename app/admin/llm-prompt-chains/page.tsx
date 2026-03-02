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
        caption_request_id?: string | string[];
        page?: string | string[];
    }>;
}

type PromptChainRow = {
    id: number;
    caption_request_id: number;
    created_datetime_utc: string;
};

const PAGE_SIZE = 20;

export default async function LlmPromptChainsPage({ searchParams }: Props) {
    const supabase = await createClient();
    const params = await searchParams;

    const captionRequestIdParam = getParam(params, "caption_request_id");
    const page = getPage(params);
    const { from, to } = getRange(page, PAGE_SIZE);
    const captionRequestId = Number.parseInt(captionRequestIdParam, 10);

    let query = supabase
        .from("llm_prompt_chains")
        .select("id, caption_request_id, created_datetime_utc", {
            count: "exact",
        });

    if (!Number.isNaN(captionRequestId)) {
        query = query.eq("caption_request_id", captionRequestId);
    }

    const { data, count } = await query
        .order("id", { ascending: false })
        .range(from, to);

    const promptChains = (data ?? []) as PromptChainRow[];
    const totalPages = getTotalPages(count, PAGE_SIZE);
    const buildPageLink = createPageLinkBuilder({
        caption_request_id: captionRequestIdParam,
    });

    return (
        <AdminLayoutShell>
            <AdminPageHeader title="LLM Prompt Chains (Read)" />

            <form method="GET" className="admin-search">
                <input
                    type="number"
                    name="caption_request_id"
                    defaultValue={captionRequestIdParam}
                    placeholder="Filter by caption request id..."
                />
                <button type="submit">Filter</button>
            </form>

            <AdminTable headers={["ID", "Caption Request ID", "Created", "Open"]}>
                {promptChains.length > 0 ? (
                    promptChains.map((promptChain) => (
                        <tr key={promptChain.id}>
                            <td>{promptChain.id}</td>
                            <td>{promptChain.caption_request_id}</td>
                            <td>
                                {new Date(
                                    promptChain.created_datetime_utc,
                                ).toLocaleString()}
                            </td>
                            <td>
                                <Link
                                    href={`/admin/llm-model-responses?llm_prompt_chain_id=${promptChain.id}`}
                                >
                                    View Responses
                                </Link>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={4} style={{ textAlign: "center" }}>
                            No prompt chains found.
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



