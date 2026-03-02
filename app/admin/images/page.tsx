import Link from "next/link";
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

const PAGE_SIZE = 10;

export default async function ImagesAdmin({ searchParams }: Props) {
    const supabase = await createClient();
    const params = await searchParams;

    const search =
        (Array.isArray(params.search) ? params.search[0] : params.search) || "";
    const pageParam =
        (Array.isArray(params.page) ? params.page[0] : params.page) || "1";

    const page = Math.max(parseInt(pageParam, 10) || 1, 1);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
        .from("images")
        .select(
            "id, url, image_description, additional_context, created_datetime_utc",
            { count: "exact" },
        );

    if (search) {
        query = query.or(
            `image_description.ilike.%${search}%,additional_context.ilike.%${search}%`,
        );
    }

    const { data: images, count } = await query
        .order("created_datetime_utc", { ascending: false })
        .range(from, to);

    const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1;

    const buildPageLink = (newPage: number) => {
        const params = new URLSearchParams();
        if (search) {
            params.set("search", search);
        }
        params.set("page", String(newPage));
        return `?${params.toString()}`;
    };

    return (
        <AdminLayoutShell>
            <AdminPageHeader
                title="Image Management"
                actionHref="/admin/images/new"
                actionLabel="New Image"
            />

            <form method="GET" className="admin-search">
                <input
                    type="text"
                    name="search"
                    defaultValue={search}
                    placeholder="Search description or context..."
                />
                <button type="submit">Search</button>
            </form>

            <AdminTable
                headers={[
                    "Image",
                    "Description",
                    "Additional Context",
                    "Created",
                    "Actions",
                ]}
            >
                {images && images.length > 0 ? (
                    images.map((image) => (
                        <tr key={image.id}>
                            <td>
                                {image.url ? (
                                    <img
                                        src={image.url}
                                        alt=""
                                        style={{ maxWidth: "100px" }}
                                    />
                                ) : (
                                    "-"
                                )}
                            </td>
                            <td>{image.image_description || "-"}</td>
                            <td>{image.additional_context || "-"}</td>
                            <td>
                                {image.created_datetime_utc
                                    ? new Date(
                                          image.created_datetime_utc,
                                      ).toLocaleDateString()
                                    : "-"}
                            </td>
                            <td>
                                <Link href={`/admin/images/${image.id}`}>
                                    Edit / Delete
                                </Link>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={5} style={{ textAlign: "center" }}>
                            No images found.
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
