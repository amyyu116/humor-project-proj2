import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AdminLayoutShell from "@/components/admin/AdminLayoutShell";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

function getText(formData: FormData, key: string) {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
}

export default async function EditAllowedSignupDomainPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams?: Promise<{ error?: string | string[] }>;
}) {
    const routeParams = await params;
    const query = await searchParams;
    const id = Number.parseInt(routeParams.id, 10);

    if (Number.isNaN(id)) {
        notFound();
    }

    const errorMessage =
        (Array.isArray(query?.error) ? query?.error[0] : query?.error) || "";
    const supabase = await createClient();

    const { data: domain } = await supabase
        .from("allowed_signup_domains")
        .select("id, apex_domain")
        .eq("id", id)
        .single();

    if (!domain) {
        notFound();
    }

    async function updateDomain(formData: FormData) {
        "use server";

        const supabase = await createClient();
        const apexDomain = getText(formData, "apex_domain").toLowerCase();

        if (!apexDomain) {
            redirect(
                `/admin/allowed-signup-domains/${id}?error=Missing required fields`,
            );
        }

        const { error } = await supabase
            .from("allowed_signup_domains")
            .update({ apex_domain: apexDomain })
            .eq("id", id);

        if (error) {
            redirect(
                `/admin/allowed-signup-domains/${id}?error=${encodeURIComponent(error.message)}`,
            );
        }

        revalidatePath("/admin/allowed-signup-domains");
        revalidatePath(`/admin/allowed-signup-domains/${id}`);
        redirect("/admin/allowed-signup-domains");
    }

    async function deleteDomain() {
        "use server";

        const supabase = await createClient();
        const { error } = await supabase
            .from("allowed_signup_domains")
            .delete()
            .eq("id", id);

        if (error) {
            redirect(
                `/admin/allowed-signup-domains/${id}?error=${encodeURIComponent(error.message)}`,
            );
        }

        revalidatePath("/admin/allowed-signup-domains");
        redirect("/admin/allowed-signup-domains");
    }

    return (
        <AdminLayoutShell>
            <AdminPageHeader title={`Edit Allowed Signup Domain #${domain.id}`} />
            {errorMessage ? (
                <p style={{ color: "#ff6b6b", marginBottom: "12px" }}>
                    Error: {errorMessage}
                </p>
            ) : null}
            <form action={updateDomain} className="admin-form">
                <label className="admin-field">
                    <span>Apex Domain</span>
                    <input
                        type="text"
                        name="apex_domain"
                        defaultValue={domain.apex_domain}
                        required
                    />
                </label>

                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <button className="admin-button primary" type="submit">
                        Save Changes
                    </button>

                    <button
                        className="admin-button danger"
                        type="submit"
                        formAction={deleteDomain}
                    >
                        Delete Domain
                    </button>

                    <Link href="/admin/allowed-signup-domains">Cancel</Link>
                </div>
            </form>
        </AdminLayoutShell>
    );
}
