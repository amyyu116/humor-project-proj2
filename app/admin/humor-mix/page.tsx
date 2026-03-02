import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

type MixRow = {
    id: number;
    humor_flavor_id: number;
    caption_count: number;
    created_datetime_utc: string;
    humor_flavors: { slug: string } | null;
};

interface Props {
    searchParams: Promise<{
        search?: string | string[];
        page?: string | string[];
    }>;
}

const PAGE_SIZE = 20;

export default async function HumorMixAdminPage({ searchParams }: Props) {
    const supabase = await createClient();
    const params = await searchParams;
    const search = getParam(params, "search");
    const page = getPage(params);
    const { from, to } = getRange(page, PAGE_SIZE);

    let query = supabase
        .from("humor_flavor_mix")
        .select(
            "id, humor_flavor_id, caption_count, created_datetime_utc, humor_flavors!inner(slug)",
            { count: "exact" },
        )
        .order("created_datetime_utc", { ascending: false });

    if (search) {
        query = query.ilike("humor_flavors.slug", `%${search}%`);
    }

    const { data, count } = await query.range(from, to);
    const mixRows = (data ?? []) as unknown as MixRow[];
    const totalPages = getTotalPages(count, PAGE_SIZE);
    const buildPageLink = createPageLinkBuilder({ search });

    async function updateCaptionCount(formData: FormData) {
        "use server";

        const supabase = await createClient();
        const idRaw = formData.get("id");
        const captionCountRaw = formData.get("caption_count");

        const id = Number(idRaw);
        const captionCount = Number(captionCountRaw);

        if (
            !Number.isInteger(id) ||
            id < 1 ||
            !Number.isInteger(captionCount) ||
            captionCount < 0
        ) {
            redirect("/admin/humor-mix?error=invalid_input");
        }

        const { error } = await supabase
            .from("humor_flavor_mix")
            .update({ caption_count: captionCount })
            .eq("id", id);

        if (error) {
            redirect(
                `/admin/humor-mix?error=${encodeURIComponent(error.message)}`,
            );
        }

        revalidatePath("/admin/humor-mix");
        redirect("/admin/humor-mix");
    }

    return (
        <AdminLayoutShell>
            <AdminPageHeader title="Humor Mix (Read / Update)" />

            <form method="GET" className="admin-search">
                <input
                    type="text"
                    name="search"
                    defaultValue={search}
                    placeholder="Search flavor slug..."
                />
                <button type="submit">Search</button>
            </form>

            <AdminTable
                headers={["ID", "Flavor", "Caption Count", "Created", "Action"]}
            >
                {mixRows.length > 0 ? (
                    mixRows.map((row) => (
                        <tr key={row.id}>
                            <td>{row.id}</td>
                            <td>
                                {row.humor_flavors?.slug || "-"} (#
                                {row.humor_flavor_id})
                            </td>
                            <td>
                                <form
                                    action={updateCaptionCount}
                                    style={{
                                        display: "inline-flex",
                                        gap: "8px",
                                    }}
                                >
                                    <input
                                        type="hidden"
                                        name="id"
                                        value={row.id}
                                    />
                                    <input
                                        type="number"
                                        name="caption_count"
                                        min={0}
                                        defaultValue={row.caption_count}
                                        style={{ width: "80px" }}
                                    />
                                    <button
                                        className="admin-button primary"
                                        type="submit"
                                    >
                                        Save
                                    </button>
                                </form>
                            </td>
                            <td>
                                {row.created_datetime_utc
                                    ? new Date(
                                          row.created_datetime_utc,
                                      ).toLocaleString()
                                    : "-"}
                            </td>
                            <td>Update caption count above</td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={5} style={{ textAlign: "center" }}>
                            No humor mix rows found.
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
