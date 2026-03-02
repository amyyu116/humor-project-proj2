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

type CaptionRow = {
    id: string;
    content: string | null;
    like_count: number;
    is_public: boolean;
    is_featured: boolean;
    created_datetime_utc: string;
    image_id: string;
    profile_id: string;
    images: { url: string | null }[] | { url: string | null } | null;
};
function getImageUrl(images: CaptionRow["images"]): string | null | undefined {
    if (Array.isArray(images)) {
        return images[0]?.url;
    }
    return images?.url;
}
const PAGE_SIZE = 20;

export default async function CaptionsAdmin({ searchParams }: Props) {
    const supabase = await createClient();
    const params = await searchParams;

    const search = getParam(params, "search");
    const page = getPage(params);
    const { from, to } = getRange(page, PAGE_SIZE);

    let query = supabase
        .from("captions")
        .select(
            "id, content, like_count, is_public, is_featured, created_datetime_utc, image_id, profile_id, images(url)",
            { count: "exact" },
        );

    if (search) {
        query = query.ilike("content", `%${search}%`);
    }

    const { data, count } = await query
        .order("created_datetime_utc", { ascending: false })
        .range(from, to);

    const captions = (data ?? []) as CaptionRow[];
    const totalPages = getTotalPages(count, PAGE_SIZE);
    const buildPageLink = createPageLinkBuilder({ search });

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
                    "Image",
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
                            <td style={{ fontSize: "12px" }}>
                                {caption.image_id}
                            </td>
                            <td style={{ fontSize: "12px" }}>
                                {caption.profile_id}
                            </td>
                            <td>
                                {getImageUrl(caption.images) ? (
                                    <img
                                        src={getImageUrl(caption.images) || ""}
                                        alt=""
                                        style={{ maxWidth: "80px" }}
                                    />
                                ) : (
                                    "-"
                                )}
                            </td>
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
                        <td colSpan={8} style={{ textAlign: "center" }}>
                            No captions found.
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
