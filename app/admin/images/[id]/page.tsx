import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AdminLayoutShell from "@/components/admin/AdminLayoutShell";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

interface Props {
    params: Promise<{ id: string }>;
    searchParams?: Promise<{ error?: string | string[] }>;
}

function readText(formData: FormData, key: string) {
    const value = formData.get(key);
    if (typeof value !== "string") {
        return "";
    }
    return value.trim();
}

export default async function EditImagePage({ params, searchParams }: Props) {
    const { id } = await params;
    const query = await searchParams;
    const supabase = await createClient();
    const imageId = id;
    const errorMessage =
        (Array.isArray(query?.error) ? query?.error[0] : query?.error) || "";

    const { data: image } = await supabase
        .from("images")
        .select("id, url, image_description, additional_context")
        .eq("id", imageId)
        .single();

    if (!image) {
        notFound();
    }

    async function updateImage(formData: FormData) {
        "use server";

        const supabase = await createClient();
        const url = readText(formData, "url");
        const imageDescription = readText(formData, "image_description");
        const additionalContext = readText(formData, "additional_context");

        if (!url) {
            redirect(`/admin/images/${imageId}?error=missing_url`);
        }

        const { error } = await supabase
            .from("images")
            .update({
                url,
                image_description: imageDescription || null,
                additional_context: additionalContext || null,
            })
            .eq("id", imageId);

        if (error) {
            redirect(
                `/admin/images/${imageId}?error=${encodeURIComponent(error.message)}`,
            );
        }

        revalidatePath("/admin/images");
        revalidatePath(`/admin/images/${imageId}`);
        redirect("/admin/images");
    }

    async function deleteImage() {
        "use server";

        const supabase = await createClient();
        const { error: captionsDeleteError } = await supabase
            .from("captions")
            .delete()
            .eq("image_id", imageId);

        if (captionsDeleteError) {
            redirect(
                `/admin/images/${imageId}?error=${encodeURIComponent(captionsDeleteError.message)}`,
            );
        }

        const { data: deletedImages, error } = await supabase
            .from("images")
            .delete()
            .eq("id", imageId)
            .select("id");

        if (error) {
            redirect(
                `/admin/images/${imageId}?error=${encodeURIComponent(error.message)}`,
            );
        }

        if (!deletedImages || deletedImages.length === 0) {
            redirect(
                `/admin/images/${imageId}?error=${encodeURIComponent("Delete was blocked. Check RLS delete policy for images/captions.")}`,
            );
        }

        revalidatePath("/admin/images");
        redirect("/admin/images");
    }

    return (
        <AdminLayoutShell>
            <AdminPageHeader title={`Edit Image #${image.id}`} />
            {errorMessage ? (
                <p style={{ color: "#ff6b6b", marginBottom: "12px" }}>
                    Error: {errorMessage}
                </p>
            ) : null}

            <form action={updateImage} className="admin-form">
                <label className="admin-field">
                    <span>Image URL</span>
                    <input
                        type="url"
                        name="url"
                        defaultValue={image.url ?? ""}
                        required
                    />
                </label>

                <label className="admin-field">
                    <span>Image Description</span>
                    <textarea
                        name="image_description"
                        rows={4}
                        defaultValue={image.image_description ?? ""}
                    />
                </label>

                <label className="admin-field">
                    <span>Additional Context</span>
                    <textarea
                        name="additional_context"
                        rows={4}
                        defaultValue={image.additional_context ?? ""}
                    />
                </label>

                <div
                    style={{
                        display: "flex",
                        gap: "12px",
                        alignItems: "center",
                    }}
                >
                    <button className="admin-button primary" type="submit">
                        Save Changes
                    </button>

                    <button
                        className="admin-button danger"
                        type="submit"
                        formAction={deleteImage}
                    >
                        Delete Image
                    </button>

                    <Link href="/admin/images">Cancel</Link>
                </div>
            </form>
        </AdminLayoutShell>
    );
}
