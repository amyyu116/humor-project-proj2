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

type WhitelistEmailRow = {
    id: number;
    email_address: string;
    created_datetime_utc: string;
    modified_datetime_utc: string | null;
};

const PAGE_SIZE = 20;

export default async function WhitelistEmailAddressesPage({ searchParams }: Props) {
    const supabase = await createClient();
    const params = await searchParams;

    const search = getParam(params, "search");
    const page = getPage(params);
    const { from, to } = getRange(page, PAGE_SIZE);

    let query = supabase.from("whitelist_email_addresses").select(
        "id, email_address, created_datetime_utc, modified_datetime_utc",
        { count: "exact" },
    );

    if (search) {
        query = query.ilike("email_address", `%${search}%`);
    }

    const { data, count } = await query
        .order("email_address", { ascending: true })
        .range(from, to);

    const emails = (data ?? []) as WhitelistEmailRow[];
    const totalPages = getTotalPages(count, PAGE_SIZE);
    const buildPageLink = createPageLinkBuilder({ search });

    return (
        <AdminLayoutShell>
            <AdminPageHeader
                title="Whitelist Email Addresses"
                actionHref="/admin/whitelist-email-addresses/new"
                actionLabel="New Email"
            />

            <form method="GET" className="admin-search">
                <input
                    type="text"
                    name="search"
                    defaultValue={search}
                    placeholder="Search email address..."
                />
                <button type="submit">Search</button>
            </form>

            <AdminTable headers={["ID", "Email", "Created", "Modified", "Actions"]}>
                {emails.length > 0 ? (
                    emails.map((email) => (
                        <tr key={email.id}>
                            <td>{email.id}</td>
                            <td>{email.email_address}</td>
                            <td>{new Date(email.created_datetime_utc).toLocaleString()}</td>
                            <td>
                                {email.modified_datetime_utc
                                    ? new Date(
                                          email.modified_datetime_utc,
                                      ).toLocaleString()
                                    : "-"}
                            </td>
                            <td>
                                <Link href={`/admin/whitelist-email-addresses/${email.id}`}>
                                    Edit / Delete
                                </Link>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={5} style={{ textAlign: "center" }}>
                            No whitelisted email addresses found.
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



