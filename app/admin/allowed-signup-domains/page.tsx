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

type AllowedSignupDomainRow = {
    id: number;
    apex_domain: string;
    created_datetime_utc: string;
};

const PAGE_SIZE = 20;

export default async function AllowedSignupDomainsPage({ searchParams }: Props) {
    const supabase = await createClient();
    const params = await searchParams;

    const search = getParam(params, "search");
    const page = getPage(params);
    const { from, to } = getRange(page, PAGE_SIZE);

    let query = supabase.from("allowed_signup_domains").select(
        "id, apex_domain, created_datetime_utc",
        { count: "exact" },
    );

    if (search) {
        query = query.ilike("apex_domain", `%${search}%`);
    }

    const { data, count } = await query
        .order("apex_domain", { ascending: true })
        .range(from, to);

    const domains = (data ?? []) as AllowedSignupDomainRow[];
    const totalPages = getTotalPages(count, PAGE_SIZE);
    const buildPageLink = createPageLinkBuilder({ search });

    return (
        <AdminLayoutShell>
            <AdminPageHeader
                title="Allowed Signup Domains"
                actionHref="/admin/allowed-signup-domains/new"
                actionLabel="New Domain"
            />

            <form method="GET" className="admin-search">
                <input
                    type="text"
                    name="search"
                    defaultValue={search}
                    placeholder="Search apex domain..."
                />
                <button type="submit">Search</button>
            </form>

            <AdminTable headers={["ID", "Apex Domain", "Created", "Actions"]}>
                {domains.length > 0 ? (
                    domains.map((domain) => (
                        <tr key={domain.id}>
                            <td>{domain.id}</td>
                            <td>{domain.apex_domain}</td>
                            <td>{new Date(domain.created_datetime_utc).toLocaleString()}</td>
                            <td>
                                <Link href={`/admin/allowed-signup-domains/${domain.id}`}>
                                    Edit / Delete
                                </Link>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={4} style={{ textAlign: "center" }}>
                            No domains found.
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



