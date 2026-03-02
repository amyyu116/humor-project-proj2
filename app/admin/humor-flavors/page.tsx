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
const PAGE_SIZE = 20;

export default async function HumorFlavorsAdminPage({ searchParams }: Props) {
    const supabase = await createClient();
    const params = await searchParams;
    const search = getParam(params, "search");
    const page = getPage(params);
    const { from, to } = getRange(page, PAGE_SIZE);
    let query = supabase
        .from("humor_flavors")
        .select("id, slug, description, created_datetime_utc", {
            count: "exact",
        })
        .order("slug", { ascending: true });

    if (search) {
        query = query.or(
            `slug.ilike.%${search}%,description.ilike.%${search}%`,
        );
    }

    const { data: flavors, count } = await query
        .order("created_datetime_utc", { ascending: false })
        .range(from, to);
    const totalPages = getTotalPages(count, PAGE_SIZE);
    const buildPageLink = createPageLinkBuilder({ search });

    return (
        <AdminLayoutShell>
            <AdminPageHeader title="Humor Flavors" />

            <form method="GET" className="admin-search">
                <input
                    type="text"
                    name="search"
                    defaultValue={search}
                    placeholder="Search slug or description..."
                />
                <button type="submit">Search</button>
            </form>

            <AdminTable headers={["ID", "Slug", "Description", "Created"]}>
                {flavors && flavors.length > 0 ? (
                    flavors.map((flavor) => (
                        <tr key={flavor.id}>
                            <td>{flavor.id}</td>
                            <td>{flavor.slug}</td>
                            <td>{flavor.description || "-"}</td>
                            <td>
                                {flavor.created_datetime_utc
                                    ? new Date(
                                          flavor.created_datetime_utc,
                                      ).toLocaleString()
                                    : "-"}
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={4} style={{ textAlign: "center" }}>
                            No humor flavors found.
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
