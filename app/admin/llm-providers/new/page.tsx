import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AdminLayoutShell from "@/components/admin/AdminLayoutShell";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

function getText(formData: FormData, key: string) {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
}

export default async function NewLlmProviderPage({
    searchParams,
}: {
    searchParams?: Promise<{ error?: string | string[] }>;
}) {
    const params = await searchParams;
    const errorMessage =
        (Array.isArray(params?.error) ? params?.error[0] : params?.error) || "";

    async function createProvider(formData: FormData) {
        "use server";

        const supabase = await createClient();
        const name = getText(formData, "name");

        if (!name) {
            redirect("/admin/llm-providers/new?error=Missing required fields");
        }

        let { error } = await supabase.from("llm_providers").insert({ name });

        // Fallback for out-of-sync PK sequences in the backing table.
        if (
            error?.code === "23505" &&
            error.message.includes("llm_providers_pkey")
        ) {
            const { data: latestProvider, error: latestError } = await supabase
                .from("llm_providers")
                .select("id")
                .order("id", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (latestError) {
                redirect(
                    `/admin/llm-providers/new?error=${encodeURIComponent(latestError.message)}`,
                );
            }

            const nextId = (latestProvider?.id ?? 0) + 1;
            const retry = await supabase
                .from("llm_providers")
                .insert({ id: nextId, name });

            error = retry.error;
        }

        if (error) {
            redirect(
                `/admin/llm-providers/new?error=${encodeURIComponent(error.message)}`,
            );
        }

        revalidatePath("/admin/llm-providers");
        redirect("/admin/llm-providers");
    }

    return (
        <AdminLayoutShell>
            <AdminPageHeader title="New LLM Provider" />
            {errorMessage ? (
                <p style={{ color: "#ff6b6b", marginBottom: "12px" }}>
                    Error: {errorMessage}
                </p>
            ) : null}
            <form action={createProvider} className="admin-form">
                <label className="admin-field">
                    <span>Name</span>
                    <input type="text" name="name" required />
                </label>

                <button className="admin-button primary" type="submit">
                    Create Provider
                </button>
            </form>
        </AdminLayoutShell>
    );
}
