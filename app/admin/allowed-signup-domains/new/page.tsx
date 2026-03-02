import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AdminLayoutShell from "@/components/admin/AdminLayoutShell";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

function getText(formData: FormData, key: string) {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
}

export default async function NewAllowedSignupDomainPage({
    searchParams,
}: {
    searchParams?: Promise<{ error?: string | string[] }>;
}) {
    const params = await searchParams;
    const errorMessage =
        (Array.isArray(params?.error) ? params?.error[0] : params?.error) || "";

    async function createDomain(formData: FormData) {
        "use server";

        const supabase = await createClient();
        const apexDomain = getText(formData, "apex_domain").toLowerCase();

        if (!apexDomain) {
            redirect(
                "/admin/allowed-signup-domains/new?error=Missing required fields",
            );
        }

        const { error } = await supabase
            .from("allowed_signup_domains")
            .insert({ apex_domain: apexDomain });

        if (error) {
            redirect(
                `/admin/allowed-signup-domains/new?error=${encodeURIComponent(error.message)}`,
            );
        }

        revalidatePath("/admin/allowed-signup-domains");
        redirect("/admin/allowed-signup-domains");
    }

    return (
        <AdminLayoutShell>
            <AdminPageHeader title="New Allowed Signup Domain" />
            {errorMessage ? (
                <p style={{ color: "#ff6b6b", marginBottom: "12px" }}>
                    Error: {errorMessage}
                </p>
            ) : null}
            <form action={createDomain} className="admin-form">
                <label className="admin-field">
                    <span>Apex Domain</span>
                    <input type="text" name="apex_domain" required />
                </label>

                <button className="admin-button primary" type="submit">
                    Create Domain
                </button>
            </form>
        </AdminLayoutShell>
    );
}
