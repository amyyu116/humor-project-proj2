import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AdminLayoutShell from "@/components/admin/AdminLayoutShell";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

function getText(formData: FormData, key: string) {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
}

export default async function NewCaptionExamplePage({
    searchParams,
}: {
    searchParams?: Promise<{ error?: string | string[] }>;
}) {
    const params = await searchParams;
    const errorMessage =
        (Array.isArray(params?.error) ? params?.error[0] : params?.error) || "";

    async function createExample(formData: FormData) {
        "use server";

        const supabase = await createClient();
        const imageDescription = getText(formData, "image_description");
        const caption = getText(formData, "caption");
        const explanation = getText(formData, "explanation");
        const priorityRaw = getText(formData, "priority");
        const imageIdRaw = getText(formData, "image_id");

        if (!imageDescription || !caption || !explanation) {
            redirect("/admin/caption-examples/new?error=Missing required fields");
        }

        const priority = Number.parseInt(priorityRaw || "0", 10);

        const { error } = await supabase.from("caption_examples").insert({
            image_description: imageDescription,
            caption,
            explanation,
            priority: Number.isNaN(priority) ? 0 : priority,
            image_id: imageIdRaw || null,
        });

        if (error) {
            redirect(
                `/admin/caption-examples/new?error=${encodeURIComponent(error.message)}`,
            );
        }

        revalidatePath("/admin/caption-examples");
        redirect("/admin/caption-examples");
    }

    return (
        <AdminLayoutShell>
            <AdminPageHeader title="New Caption Example" />
            {errorMessage ? (
                <p style={{ color: "#ff6b6b", marginBottom: "12px" }}>
                    Error: {errorMessage}
                </p>
            ) : null}
            <form action={createExample} className="admin-form">
                <label className="admin-field">
                    <span>Image Description</span>
                    <textarea name="image_description" rows={4} required />
                </label>

                <label className="admin-field">
                    <span>Caption</span>
                    <textarea name="caption" rows={3} required />
                </label>

                <label className="admin-field">
                    <span>Explanation</span>
                    <textarea name="explanation" rows={4} required />
                </label>

                <label className="admin-field">
                    <span>Priority</span>
                    <input type="number" name="priority" defaultValue={0} />
                </label>

                <label className="admin-field">
                    <span>Image ID (optional UUID)</span>
                    <input type="text" name="image_id" />
                </label>

                <button className="admin-button primary" type="submit">
                    Create Example
                </button>
            </form>
        </AdminLayoutShell>
    );
}
