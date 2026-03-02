import { createClient } from "@/utils/supabase/server";
import AdminLayoutShell from "@/components/admin/AdminLayoutShell";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminTable from "@/components/admin/AdminTable";

interface Props {
    searchParams: Promise<{
        search?: string | string[];
        page?: string | string[];
    }>;
}

type CaptionRow = {
    id: string;
    content: string | null;
    like_count: number;
    is_public: boolean;
    is_featured: boolean;
    created_datetime_utc: string;
    image_id: string;
    profile_id: string;
};

const PAGE_SIZE = 20;

export default async function CaptionsAdmin({ searchParams }: Props) {
    const supabase = await createClient();
    const params = await searchParams;

    const search =
        (Array.isArray(params.search) ? params.search[0] : params.search) || "";
    const pageParam =
        (Array.isArray(params.page) ? params.page[0] : params.page) || "1";

    const page = Math.max(parseInt(pageParam, 10) || 1, 1);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase.from("captions").select(
        "id, content, like_count, is_public, is_featured, created_datetime_utc, image_id, profile_id",
        { count: "exact" },
    );

    if (search) {
        query = query.ilike("content", `%${search}%`);
    }

    const { data, count } = await query
        .order("created_datetime_utc", { ascending: false })
        .range(from, to);

    const captions = (data ?? []) as CaptionRow[];
    const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1;

    const buildPageLink = (newPage: number) => {
        const nextParams = new URLSearchParams();
        if (search) {
            nextParams.set("search", search);
        }
        nextParams.set("page", String(newPage));
        return `?${nextParams.toString()}`;
    };

    return (
        <AdminLayoutShell>
            <AdminPageHeader title="Captions (Read)" />

            <form method="GET" className="admin-search">
                <input
                    type="text"
                    name="search"
                    defaultValue={search}
                    placeholder="Search caption content..."
                />
                <button type="submit">Search</button>
            </form>

            <AdminTable
                headers={[
                    "Content",
                    "Likes",
                    "Public",
                    "Featured",
                    "Image ID",
                    "Profile ID",
                    "Created",
                ]}
            >
                {captions.length > 0 ? (
                    captions.map((caption) => (
                        <tr key={caption.id}>
                            <td>{caption.content || "-"}</td>
                            <td>{caption.like_count}</td>
                            <td>{caption.is_public ? "Yes" : "No"}</td>
                            <td>{caption.is_featured ? "Yes" : "No"}</td>
                            <td style={{ fontSize: "12px" }}>{caption.image_id}</td>
                            <td style={{ fontSize: "12px" }}>{caption.profile_id}</td>
                            <td>
                                {caption.created_datetime_utc
                                    ? new Date(
                                          caption.created_datetime_utc,
                                      ).toLocaleString()
                                    : "-"}
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={7} style={{ textAlign: "center" }}>
                            No captions found.
                        </td>
                    </tr>
                )}
            </AdminTable>

            <div className="admin-pagination">
                {page > 1 ? (
                    <a href={buildPageLink(page - 1)} className="admin-page-link">
                        Previous
                    </a>
                ) : null}

                <span className="admin-page-label">
                    Page {page} of {totalPages}
                </span>

                {page < totalPages ? (
                    <a href={buildPageLink(page + 1)} className="admin-page-link">
                        Next
                    </a>
                ) : null}
            </div>
        </AdminLayoutShell>
    );
}
