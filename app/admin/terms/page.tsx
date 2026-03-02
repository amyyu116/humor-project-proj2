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

type TermRow = {
    id: number;
    term: string;
    definition: string;
    example: string;
    priority: number;
    term_type_id: number | null;
    modified_datetime_utc: string | null;
    created_datetime_utc: string;
};

const PAGE_SIZE = 20;

export default async function TermsPage({ searchParams }: Props) {
    const supabase = await createClient();
    const params = await searchParams;

    const search = getParam(params, "search");
    const page = getPage(params);
    const { from, to } = getRange(page, PAGE_SIZE);

    let query = supabase.from("terms").select(
        "id, term, definition, example, priority, term_type_id, modified_datetime_utc, created_datetime_utc",
        { count: "exact" },
    );

    if (search) {
        query = query.or(
            `term.ilike.%${search}%,definition.ilike.%${search}%,example.ilike.%${search}%`,
        );
    }

    const { data, count } = await query
        .order("priority", { ascending: false })
        .order("created_datetime_utc", { ascending: false })
        .range(from, to);

    const terms = (data ?? []) as TermRow[];
    const totalPages = getTotalPages(count, PAGE_SIZE);
    const buildPageLink = createPageLinkBuilder({ search });

    return (
        <AdminLayoutShell>
            <AdminPageHeader
                title="Terms"
                actionHref="/admin/terms/new"
                actionLabel="New Term"
            />

            <form method="GET" className="admin-search">
                <input
                    type="text"
                    name="search"
                    defaultValue={search}
                    placeholder="Search terms..."
                />
                <button type="submit">Search</button>
            </form>

            <AdminTable
                headers={[
                    "Term",
                    "Definition",
                    "Example",
                    "Priority",
                    "Term Type ID",
                    "Actions",
                ]}
            >
                {terms.length > 0 ? (
                    terms.map((term) => (
                        <tr key={term.id}>
                            <td>{term.term}</td>
                            <td>{term.definition}</td>
                            <td>{term.example}</td>
                            <td>{term.priority}</td>
                            <td>{term.term_type_id ?? "-"}</td>
                            <td>
                                <Link href={`/admin/terms/${term.id}`}>
                                    Edit / Delete
                                </Link>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={6} style={{ textAlign: "center" }}>
                            No terms found.
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



