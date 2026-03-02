import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AdminLayoutShell from "@/components/admin/AdminLayoutShell";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

function getText(formData: FormData, key: string) {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
}

export default async function NewWhitelistEmailAddressPage({
    searchParams,
}: {
    searchParams?: Promise<{ error?: string | string[] }>;
}) {
    const params = await searchParams;
    const errorMessage =
        (Array.isArray(params?.error) ? params?.error[0] : params?.error) || "";

    async function createEmail(formData: FormData) {
        "use server";

        const supabase = await createClient();
        const emailAddress = getText(formData, "email_address").toLowerCase();

        if (!emailAddress) {
            redirect(
                "/admin/whitelist-email-addresses/new?error=Missing required fields",
            );
        }

        const { error } = await supabase
            .from("whitelist_email_addresses")
            .insert({ email_address: emailAddress });

        if (error) {
            redirect(
                `/admin/whitelist-email-addresses/new?error=${encodeURIComponent(error.message)}`,
            );
        }

        revalidatePath("/admin/whitelist-email-addresses");
        redirect("/admin/whitelist-email-addresses");
    }

    return (
        <AdminLayoutShell>
            <AdminPageHeader title="New Whitelist Email Address" />
            {errorMessage ? (
                <p style={{ color: "#ff6b6b", marginBottom: "12px" }}>
                    Error: {errorMessage}
                </p>
            ) : null}
            <form action={createEmail} className="admin-form">
                <label className="admin-field">
                    <span>Email Address</span>
                    <input type="email" name="email_address" required />
                </label>

                <button className="admin-button primary" type="submit">
                    Create Email
                </button>
            </form>
        </AdminLayoutShell>
    );
}
