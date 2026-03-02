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

type CaptionExampleRow = {
    id: number;
    image_description: string;
    caption: string;
    explanation: string;
    priority: number;
    image_id: string | null;
    modified_datetime_utc: string | null;
    created_datetime_utc: string;
};

const PAGE_SIZE = 20;

export default async function CaptionExamplesPage({ searchParams }: Props) {
    const supabase = await createClient();
    const params = await searchParams;

    const search = getParam(params, "search");
    const page = getPage(params);
    const { from, to } = getRange(page, PAGE_SIZE);

    let query = supabase
        .from("caption_examples")
        .select(
            "id, image_description, caption, explanation, priority, image_id, modified_datetime_utc, created_datetime_utc",
            { count: "exact" },
        );

    if (search) {
        query = query.or(
            `caption.ilike.%${search}%,image_description.ilike.%${search}%,explanation.ilike.%${search}%`,
        );
    }

    const { data, count } = await query
        .order("priority", { ascending: false })
        .order("created_datetime_utc", { ascending: false })
        .range(from, to);

    const examples = (data ?? []) as CaptionExampleRow[];
    const totalPages = getTotalPages(count, PAGE_SIZE);
    const buildPageLink = createPageLinkBuilder({ search });

    return (
        <AdminLayoutShell>
            <AdminPageHeader
                title="Caption Examples"
                actionHref="/admin/caption-examples/new"
                actionLabel="New Example"
            />

            <form method="GET" className="admin-search">
                <input
                    type="text"
                    name="search"
                    defaultValue={search}
                    placeholder="Search caption examples..."
                />
                <button type="submit">Search</button>
            </form>

            <AdminTable
                headers={[
                    "Image Description",
                    "Caption",
                    "Explanation",
                    "Priority",
                    "Image ID",
                    "Actions",
                ]}
            >
                {examples.length > 0 ? (
                    examples.map((example) => (
                        <tr key={example.id}>
                            <td>{example.image_description}</td>
                            <td>{example.caption}</td>
                            <td>{example.explanation}</td>
                            <td>{example.priority}</td>
                            <td style={{ fontSize: "12px" }}>
                                {example.image_id || "-"}
                            </td>
                            <td>
                                <Link
                                    href={`/admin/caption-examples/${example.id}`}
                                >
                                    Edit / Delete
                                </Link>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={6} style={{ textAlign: "center" }}>
                            No caption examples found.
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
