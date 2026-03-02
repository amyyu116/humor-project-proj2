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

export default async function EditLlmProviderPage({
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

    const { data: provider } = await supabase
        .from("llm_providers")
        .select("id, name")
        .eq("id", id)
        .single();

    if (!provider) {
        notFound();
    }

    async function updateProvider(formData: FormData) {
        "use server";

        const supabase = await createClient();
        const name = getText(formData, "name");

        if (!name) {
            redirect(`/admin/llm-providers/${id}?error=Missing required fields`);
        }

        const { error } = await supabase
            .from("llm_providers")
            .update({ name })
            .eq("id", id);

        if (error) {
            redirect(
                `/admin/llm-providers/${id}?error=${encodeURIComponent(error.message)}`,
            );
        }

        revalidatePath("/admin/llm-providers");
        revalidatePath(`/admin/llm-providers/${id}`);
        redirect("/admin/llm-providers");
    }

    async function deleteProvider() {
        "use server";

        const supabase = await createClient();
        const { error } = await supabase.from("llm_providers").delete().eq("id", id);

        if (error) {
            redirect(
                `/admin/llm-providers/${id}?error=${encodeURIComponent(error.message)}`,
            );
        }

        revalidatePath("/admin/llm-providers");
        redirect("/admin/llm-providers");
    }

    return (
        <AdminLayoutShell>
            <AdminPageHeader title={`Edit LLM Provider #${provider.id}`} />
            {errorMessage ? (
                <p style={{ color: "#ff6b6b", marginBottom: "12px" }}>
                    Error: {errorMessage}
                </p>
            ) : null}
            <form action={updateProvider} className="admin-form">
                <label className="admin-field">
                    <span>Name</span>
                    <input type="text" name="name" defaultValue={provider.name} required />
                </label>

                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <button className="admin-button primary" type="submit">
                        Save Changes
                    </button>

                    <button
                        className="admin-button danger"
                        type="submit"
                        formAction={deleteProvider}
                    >
                        Delete Provider
                    </button>

                    <Link href="/admin/llm-providers">Cancel</Link>
                </div>
            </form>
        </AdminLayoutShell>
    );
}
