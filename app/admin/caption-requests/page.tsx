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

type CaptionRequestRow = {
    id: number;
    created_datetime_utc: string;
    profile_id: string;
    image_id: string;
};
const PAGE_SIZE = 20;

export default async function CaptionRequestsPage({ searchParams }: Props) {
    const supabase = await createClient();
    const params = await searchParams;
    const search = getParam(params, "search");
    const page = getPage(params);
    const { from, to } = getRange(page, PAGE_SIZE);
    let query = supabase
        .from("caption_requests")
        .select("id, created_datetime_utc, profile_id, image_id", {
            count: "exact",
        })
        .order("created_datetime_utc", { ascending: false });

    if (search) {
        query = query.or(
            `profile_id.ilike.%${search}%,image_id.ilike.%${search}%`,
        );
    }

    const { data, count } = await query.range(from, to);

    const captionRequests = (data ?? []) as CaptionRequestRow[];
    const totalPages = getTotalPages(count, PAGE_SIZE);
    const buildPageLink = createPageLinkBuilder({ search });
    return (
        <AdminLayoutShell>
            <AdminPageHeader title="Caption Requests (Read)" />

            <form method="GET" className="admin-search">
                <input
                    type="text"
                    name="search"
                    defaultValue={search}
                    placeholder="Search profile id or image id..."
                />
                <button type="submit">Search</button>
            </form>

            <AdminTable headers={["ID", "Profile ID", "Image ID", "Created"]}>
                {captionRequests.length > 0 ? (
                    captionRequests.map((request) => (
                        <tr key={request.id}>
                            <td>{request.id}</td>
                            <td style={{ fontSize: "12px" }}>
                                {request.profile_id}
                            </td>
                            <td style={{ fontSize: "12px" }}>
                                {request.image_id}
                            </td>
                            <td>
                                {request.created_datetime_utc
                                    ? new Date(
                                          request.created_datetime_utc,
                                      ).toLocaleString()
                                    : "-"}
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={4} style={{ textAlign: "center" }}>
                            No caption requests found.
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
