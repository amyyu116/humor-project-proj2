import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AdminLayoutShell from "@/components/admin/AdminLayoutShell";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

function getText(formData: FormData, key: string) {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
}

export default async function NewTermPage({
    searchParams,
}: {
    searchParams?: Promise<{ error?: string | string[] }>;
}) {
    const params = await searchParams;
    const errorMessage =
        (Array.isArray(params?.error) ? params?.error[0] : params?.error) || "";

    async function createTerm(formData: FormData) {
        "use server";

        const supabase = await createClient();
        const term = getText(formData, "term");
        const definition = getText(formData, "definition");
        const example = getText(formData, "example");
        const priorityRaw = getText(formData, "priority");
        const termTypeIdRaw = getText(formData, "term_type_id");

        if (!term || !definition || !example) {
            redirect("/admin/terms/new?error=Missing required fields");
        }

        const priority = Number.parseInt(priorityRaw || "0", 10);
        const termTypeId = Number.parseInt(termTypeIdRaw, 10);

        const { error } = await supabase.from("terms").insert({
            term,
            definition,
            example,
            priority: Number.isNaN(priority) ? 0 : priority,
            term_type_id: Number.isNaN(termTypeId) ? null : termTypeId,
        });

        if (error) {
            redirect(`/admin/terms/new?error=${encodeURIComponent(error.message)}`);
        }

        revalidatePath("/admin/terms");
        redirect("/admin/terms");
    }

    return (
        <AdminLayoutShell>
            <AdminPageHeader title="New Term" />
            {errorMessage ? (
                <p style={{ color: "#ff6b6b", marginBottom: "12px" }}>
                    Error: {errorMessage}
                </p>
            ) : null}
            <form action={createTerm} className="admin-form">
                <label className="admin-field">
                    <span>Term</span>
                    <input type="text" name="term" required />
                </label>

                <label className="admin-field">
                    <span>Definition</span>
                    <textarea name="definition" rows={4} required />
                </label>

                <label className="admin-field">
                    <span>Example</span>
                    <textarea name="example" rows={3} required />
                </label>

                <label className="admin-field">
                    <span>Priority</span>
                    <input type="number" name="priority" defaultValue={0} />
                </label>

                <label className="admin-field">
                    <span>Term Type ID (optional)</span>
                    <input type="number" name="term_type_id" />
                </label>

                <button className="admin-button primary" type="submit">
                    Create Term
                </button>
            </form>
        </AdminLayoutShell>
    );
}
