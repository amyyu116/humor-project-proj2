import { createClient } from "@/utils/supabase/server";

interface Props {
    searchParams: Promise<{
        search?: string | string[];
        page?: string | string[];
    }>;
}

const PAGE_SIZE = 10;

export default async function UsersAdmin({ searchParams }: Props) {
    const supabase = await createClient();
    const params = await searchParams;

    const search =
        (Array.isArray(params.search) ? params.search[0] : params.search) || "";

    const pageParam =
        (Array.isArray(params.page) ? params.page[0] : params.page) || "1";

    const page = Math.max(parseInt(pageParam) || 1, 1);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase.from("profiles").select("*", { count: "exact" });

    if (search) {
        query = query.or(
            `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`,
        );
    }

    const { data: users, count } = await query
        .order("created_datetime_utc", { ascending: false })
        .range(from, to);

    const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1;

    return (
        <div className="admin-users">
            <h2>User Management</h2>

            <form method="GET" className="admin-search">
                <input
                    type="text"
                    name="search"
                    defaultValue={search}
                    placeholder="Search email or name..."
                />
                <button type="submit">Search</button>
            </form>

            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Name</th>
                        <th>Created</th>
                        <th>Superadmin</th>
                        <th>User ID</th>
                    </tr>
                </thead>
                <tbody>
                    {users?.map((user: any) => (
                        <tr key={user.id}>
                            <td>{user.email}</td>
                            <td>
                                {(user.first_name || "") +
                                    " " +
                                    (user.last_name || "")}
                            </td>
                            <td>
                                {user.created_datetime_utc
                                    ? new Date(
                                          user.created_datetime_utc,
                                      ).toLocaleDateString()
                                    : "—"}
                            </td>
                            <td>{user.is_superadmin ? "✅" : "—"}</td>
                            <td style={{ fontSize: "0.75rem", opacity: 0.6 }}>
                                {user.id}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Pagination */}
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
