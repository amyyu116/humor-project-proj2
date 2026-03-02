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

export default async function EditCaptionExamplePage({
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

    const { data: example } = await supabase
        .from("caption_examples")
        .select(
            "id, image_description, caption, explanation, priority, image_id, modified_datetime_utc",
        )
        .eq("id", id)
        .single();

    if (!example) {
        notFound();
    }

    async function updateExample(formData: FormData) {
        "use server";

        const supabase = await createClient();
        const imageDescription = getText(formData, "image_description");
        const caption = getText(formData, "caption");
        const explanation = getText(formData, "explanation");
        const priorityRaw = getText(formData, "priority");
        const imageIdRaw = getText(formData, "image_id");

        if (!imageDescription || !caption || !explanation) {
            redirect(`/admin/caption-examples/${id}?error=Missing required fields`);
        }

        const priority = Number.parseInt(priorityRaw || "0", 10);

        const { error } = await supabase
            .from("caption_examples")
            .update({
                image_description: imageDescription,
                caption,
                explanation,
                priority: Number.isNaN(priority) ? 0 : priority,
                image_id: imageIdRaw || null,
                modified_datetime_utc: new Date().toISOString(),
            })
            .eq("id", id);

        if (error) {
            redirect(
                `/admin/caption-examples/${id}?error=${encodeURIComponent(error.message)}`,
            );
        }

        revalidatePath("/admin/caption-examples");
        revalidatePath(`/admin/caption-examples/${id}`);
        redirect("/admin/caption-examples");
    }

    async function deleteExample() {
        "use server";

        const supabase = await createClient();
        const { error } = await supabase
            .from("caption_examples")
            .delete()
            .eq("id", id);

        if (error) {
            redirect(
                `/admin/caption-examples/${id}?error=${encodeURIComponent(error.message)}`,
            );
        }

        revalidatePath("/admin/caption-examples");
        redirect("/admin/caption-examples");
    }

    return (
        <AdminLayoutShell>
            <AdminPageHeader title={`Edit Caption Example #${example.id}`} />
            {errorMessage ? (
                <p style={{ color: "#ff6b6b", marginBottom: "12px" }}>
                    Error: {errorMessage}
                </p>
            ) : null}
            <form action={updateExample} className="admin-form">
                <label className="admin-field">
                    <span>Image Description</span>
                    <textarea
                        name="image_description"
                        rows={4}
                        defaultValue={example.image_description}
                        required
                    />
                </label>

                <label className="admin-field">
                    <span>Caption</span>
                    <textarea
                        name="caption"
                        rows={3}
                        defaultValue={example.caption}
                        required
                    />
                </label>

                <label className="admin-field">
                    <span>Explanation</span>
                    <textarea
                        name="explanation"
                        rows={4}
                        defaultValue={example.explanation}
                        required
                    />
                </label>

                <label className="admin-field">
                    <span>Priority</span>
                    <input
                        type="number"
                        name="priority"
                        defaultValue={example.priority}
                    />
                </label>

                <label className="admin-field">
                    <span>Image ID (optional UUID)</span>
                    <input
                        type="text"
                        name="image_id"
                        defaultValue={example.image_id ?? ""}
                    />
                </label>

                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <button className="admin-button primary" type="submit">
                        Save Changes
                    </button>

                    <button
                        className="admin-button danger"
                        type="submit"
                        formAction={deleteExample}
                    >
                        Delete Example
                    </button>

                    <Link href="/admin/caption-examples">Cancel</Link>
                </div>
            </form>
        </AdminLayoutShell>
    );
}
