import { createClient } from "@/utils/supabase/server";

interface Props {
    searchParams: Promise<{
        search?: string | string[];
        page?: string | string[];
    }>;
}

const PAGE_SIZE = 10;

export default async function CaptionsAdmin({ searchParams }: Props) {
    const supabase = await createClient();
    const params = await searchParams;

    const search =
        (Array.isArray(params.search) ? params.search[0] : params.search) || "";

    const pageParam =
        (Array.isArray(params.page) ? params.page[0] : params.page) || "1";

    const page = Math.max(parseInt(pageParam) || 1, 1);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // 1️⃣ Fetch captions
    let captionsQuery = supabase
        .from("captions")
        .select("id, content, like_count, image_id", {
            count: "exact",
        });

    if (search) {
        captionsQuery = captionsQuery.ilike("content", `%${search}%`);
    }

    const {
        data: captions,
        count,
        error,
    } = await captionsQuery
        .order("created_datetime_utc", { ascending: false })
        .range(from, to);

    if (error) {
        console.error("CAPTIONS ERROR:", error);
    }

    const imageIds = captions?.map((c: any) => String(c.image_id)) || [];

    let imageMap: Record<string, string> = {};

    if (imageIds.length > 0) {
        const { data: images } = await supabase
            .from("images")
            .select("id, url")
            .in("id", imageIds);

        imageMap =
            images?.reduce((acc: any, img: any) => {
                acc[img.id] = img.url;
                return acc;
            }, {}) || {};
    }

    const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1;

    return (
        <div className="admin-captions">
            <h2>Caption Management</h2>

            <form method="GET" className="admin-search">
                <input
                    type="text"
                    name="search"
                    defaultValue={search}
                    placeholder="Search caption content..."
                />
                <button type="submit">Search</button>
            </form>

            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Image</th>
                        <th>Content</th>
                        <th>Likes</th>
                    </tr>
                </thead>
                <tbody>
                    {captions?.map((caption: any) => (
                        <tr key={caption.id}>
                            <td>
                                {imageMap[caption.image_id] ? (
                                    <img
                                        src={imageMap[caption.image_id]}
                                        alt=""
                                        style={{ maxWidth: "100px" }}
                                    />
                                ) : (
                                    "Image is not public!"
                                )}
                            </td>
                            <td>{caption.content}</td>
                            <td>{caption.like_count ?? 0}</td>
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
