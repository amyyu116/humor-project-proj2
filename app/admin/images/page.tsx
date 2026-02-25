import { createClient } from "@/utils/supabase/server";

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

    const page = Math.max(parseInt(pageParam) || 1, 1);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
        .from("images")
        .select("id, url, image_description, additional_context", {
            count: "exact",
        });

    if (search) {
        query = query.or(
            `image_description.ilike.%${search}%,additional_context.ilike.%${search}%`,
        );
    }

    const { data: images, count } = await query
        .order("created_datetime_utc", { ascending: false })
        .range(from, to);

    const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1;

    return (
        <div className="admin-images">
            <h2>Image Management</h2>

            <form method="GET" className="admin-search">
                <input
                    type="text"
                    name="search"
                    defaultValue={search}
                    placeholder="Search description..."
                />
                <button type="submit">Search</button>
            </form>

            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Image</th>
                        <th>Description</th>
                        <th>Additional Context</th>
                    </tr>
                </thead>
                <tbody>
                    {images?.map((image: any) => (
                        <tr key={image.id}>
                            <td>
                                <img
                                    src={image.url}
                                    alt=""
                                    style={{ maxWidth: "100px" }}
                                />
                            </td>
                            <td>{image.image_description || "—"}</td>
                            <td>{image.additional_context || "—"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ marginTop: "20px" }}>
                {page > 1 && (
                    <a
                        href={`?search=${search}&page=${page - 1}`}
                        style={{ marginRight: "10px" }}
                    >
                        ← Previous
                    </a>
                )}

                <span>
                    Page {page} of {totalPages}
                </span>

                {page < totalPages && (
                    <a
                        href={`?search=${search}&page=${page + 1}`}
                        style={{ marginLeft: "10px" }}
                    >
                        Next →
                    </a>
                )}
            </div>
        </div>
    );
}
