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

type StepRow = {
    id: number;
    humor_flavor_id: number;
    order_by: number;
    llm_temperature: number | null;
    llm_input_type_id: number;
    llm_output_type_id: number;
    llm_model_id: number;
    humor_flavor_step_type_id: number;
    description: string | null;
    created_datetime_utc: string;
    humor_flavors: { slug: string } | null;
};
const PAGE_SIZE = 20;

export default async function HumorFlavorStepsAdminPage({
    searchParams,
}: Props) {
    const supabase = await createClient();
    const params = await searchParams;
    const search = getParam(params, "search");
    const page = getPage(params);
    const { from, to } = getRange(page, PAGE_SIZE);
    let query = supabase
        .from("humor_flavor_steps")
        .select(
            "id, humor_flavor_id, order_by, llm_temperature, llm_input_type_id, llm_output_type_id, llm_model_id, humor_flavor_step_type_id, description, created_datetime_utc, humor_flavors(slug)",
            { count: "exact" },
        )
        .order("humor_flavor_id", { ascending: true })
        .order("order_by", { ascending: true });

    if (search) {
        query = query.ilike("description", `%${search}%`);
    }

    const { data, count } = await query
        .order("created_datetime_utc", {
            ascending: false,
        })
        .range(from, to);
    const steps = (data ?? []) as unknown as StepRow[];
    const totalPages = getTotalPages(count, PAGE_SIZE);
    const buildPageLink = createPageLinkBuilder({ search });
    return (
        <AdminLayoutShell>
            <AdminPageHeader title="Humor Flavor Steps (Read)" />

            <form method="GET" className="admin-search">
                <input
                    type="text"
                    name="search"
                    defaultValue={search}
                    placeholder="Search step description..."
                />
                <button type="submit">Search</button>
            </form>

            <AdminTable
                headers={[
                    "ID",
                    "Flavor",
                    "Order",
                    "Step Type",
                    "Model",
                    "Input Type",
                    "Output Type",
                    "Temp",
                    "Description",
                ]}
            >
                {steps.length > 0 ? (
                    steps.map((step) => (
                        <tr key={step.id}>
                            <td>{step.id}</td>
                            <td>
                                {step.humor_flavors?.slug || "-"} (#
                                {step.humor_flavor_id})
                            </td>
                            <td>{step.order_by}</td>
                            <td>{step.humor_flavor_step_type_id}</td>
                            <td>{step.llm_model_id}</td>
                            <td>{step.llm_input_type_id}</td>
                            <td>{step.llm_output_type_id}</td>
                            <td>
                                {step.llm_temperature !== null
                                    ? step.llm_temperature
                                    : "-"}
                            </td>
                            <td>{step.description || "-"}</td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={9} style={{ textAlign: "center" }}>
                            No humor flavor steps found.
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
