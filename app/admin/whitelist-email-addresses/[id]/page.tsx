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

export default async function EditWhitelistEmailAddressPage({
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

    const { data: email } = await supabase
        .from("whitelist_email_addresses")
        .select("id, email_address")
        .eq("id", id)
        .single();

    if (!email) {
        notFound();
    }

    async function updateEmail(formData: FormData) {
        "use server";

        const supabase = await createClient();
        const emailAddress = getText(formData, "email_address").toLowerCase();

        if (!emailAddress) {
            redirect(
                `/admin/whitelist-email-addresses/${id}?error=Missing required fields`,
            );
        }

        const { error } = await supabase
            .from("whitelist_email_addresses")
            .update({
                email_address: emailAddress,
                modified_datetime_utc: new Date().toISOString(),
            })
            .eq("id", id);

        if (error) {
            redirect(
                `/admin/whitelist-email-addresses/${id}?error=${encodeURIComponent(error.message)}`,
            );
        }

        revalidatePath("/admin/whitelist-email-addresses");
        revalidatePath(`/admin/whitelist-email-addresses/${id}`);
        redirect("/admin/whitelist-email-addresses");
    }

    async function deleteEmail() {
        "use server";

        const supabase = await createClient();
        const { error } = await supabase
            .from("whitelist_email_addresses")
            .delete()
            .eq("id", id);

        if (error) {
            redirect(
                `/admin/whitelist-email-addresses/${id}?error=${encodeURIComponent(error.message)}`,
            );
        }

        revalidatePath("/admin/whitelist-email-addresses");
        redirect("/admin/whitelist-email-addresses");
    }

    return (
        <AdminLayoutShell>
            <AdminPageHeader title={`Edit Whitelist Email #${email.id}`} />
            {errorMessage ? (
                <p style={{ color: "#ff6b6b", marginBottom: "12px" }}>
                    Error: {errorMessage}
                </p>
            ) : null}
            <form action={updateEmail} className="admin-form">
                <label className="admin-field">
                    <span>Email Address</span>
                    <input
                        type="email"
                        name="email_address"
                        defaultValue={email.email_address}
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
                        formAction={deleteEmail}
                    >
                        Delete Email
                    </button>

                    <Link href="/admin/whitelist-email-addresses">Cancel</Link>
                </div>
            </form>
        </AdminLayoutShell>
    );
}
