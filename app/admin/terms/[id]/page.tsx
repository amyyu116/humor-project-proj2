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

export default async function EditTermPage({
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

    const { data: term } = await supabase
        .from("terms")
        .select("id, term, definition, example, priority, term_type_id")
        .eq("id", id)
        .single();

    if (!term) {
        notFound();
    }

    async function updateTerm(formData: FormData) {
        "use server";

        const supabase = await createClient();
        const nextTerm = getText(formData, "term");
        const definition = getText(formData, "definition");
        const example = getText(formData, "example");
        const priorityRaw = getText(formData, "priority");
        const termTypeIdRaw = getText(formData, "term_type_id");

        if (!nextTerm || !definition || !example) {
            redirect(`/admin/terms/${id}?error=Missing required fields`);
        }

        const priority = Number.parseInt(priorityRaw || "0", 10);
        const termTypeId = Number.parseInt(termTypeIdRaw, 10);

        const { error } = await supabase
            .from("terms")
            .update({
                term: nextTerm,
                definition,
                example,
                priority: Number.isNaN(priority) ? 0 : priority,
                term_type_id: Number.isNaN(termTypeId) ? null : termTypeId,
                modified_datetime_utc: new Date().toISOString(),
            })
            .eq("id", id);

        if (error) {
            redirect(`/admin/terms/${id}?error=${encodeURIComponent(error.message)}`);
        }

        revalidatePath("/admin/terms");
        revalidatePath(`/admin/terms/${id}`);
        redirect("/admin/terms");
    }

    async function deleteTerm() {
        "use server";

        const supabase = await createClient();
        const { error } = await supabase.from("terms").delete().eq("id", id);

        if (error) {
            redirect(`/admin/terms/${id}?error=${encodeURIComponent(error.message)}`);
        }

        revalidatePath("/admin/terms");
        redirect("/admin/terms");
    }

    return (
        <AdminLayoutShell>
            <AdminPageHeader title={`Edit Term #${term.id}`} />
            {errorMessage ? (
                <p style={{ color: "#ff6b6b", marginBottom: "12px" }}>
                    Error: {errorMessage}
                </p>
            ) : null}
            <form action={updateTerm} className="admin-form">
                <label className="admin-field">
                    <span>Term</span>
                    <input type="text" name="term" defaultValue={term.term} required />
                </label>

                <label className="admin-field">
                    <span>Definition</span>
                    <textarea
                        name="definition"
                        rows={4}
                        defaultValue={term.definition}
                        required
                    />
                </label>

                <label className="admin-field">
                    <span>Example</span>
                    <textarea
                        name="example"
                        rows={3}
                        defaultValue={term.example}
                        required
                    />
                </label>

                <label className="admin-field">
                    <span>Priority</span>
                    <input type="number" name="priority" defaultValue={term.priority} />
                </label>

                <label className="admin-field">
                    <span>Term Type ID (optional)</span>
                    <input
                        type="number"
                        name="term_type_id"
                        defaultValue={term.term_type_id ?? ""}
                    />
                </label>

                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <button className="admin-button primary" type="submit">
                        Save Changes
                    </button>

                    <button
                        className="admin-button danger"
                        type="submit"
                        formAction={deleteTerm}
                    >
                        Delete Term
                    </button>

                    <Link href="/admin/terms">Cancel</Link>
                </div>
            </form>
        </AdminLayoutShell>
    );
}
