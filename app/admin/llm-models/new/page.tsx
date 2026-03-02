import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AdminLayoutShell from "@/components/admin/AdminLayoutShell";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

type LlmProviderOption = {
    id: number;
    name: string;
};

function getText(formData: FormData, key: string) {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
}

export default async function NewLlmModelPage({
    searchParams,
}: {
    searchParams?: Promise<{ error?: string | string[] }>;
}) {
    const params = await searchParams;
    const errorMessage =
        (Array.isArray(params?.error) ? params?.error[0] : params?.error) || "";
    const supabase = await createClient();

    const { data: providerData } = await supabase
        .from("llm_providers")
        .select("id, name")
        .order("name", { ascending: true });

    const providers = (providerData ?? []) as LlmProviderOption[];

    async function createModel(formData: FormData) {
        "use server";

        const supabase = await createClient();
        const name = getText(formData, "name");
        const llmProviderIdRaw = getText(formData, "llm_provider_id");
        const providerModelId = getText(formData, "provider_model_id");
        const isTemperatureSupported =
            getText(formData, "is_temperature_supported") === "on";

        if (!name || !providerModelId || !llmProviderIdRaw) {
            redirect("/admin/llm-models/new?error=Missing required fields");
        }

        const llmProviderId = Number.parseInt(llmProviderIdRaw, 10);
        if (Number.isNaN(llmProviderId)) {
            redirect("/admin/llm-models/new?error=Invalid provider id");
        }

        const payload = {
            name,
            llm_provider_id: llmProviderId,
            provider_model_id: providerModelId,
            is_temperature_supported: isTemperatureSupported,
        };

        let { error } = await supabase.from("llm_models").insert(payload);

        // Fallback for out-of-sync PK sequences in the backing table.
        if (
            error?.code === "23505" &&
            error.message.includes("caption_generation_models_pkey")
        ) {
            const { data: latestModel, error: latestError } = await supabase
                .from("llm_models")
                .select("id")
                .order("id", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (latestError) {
                redirect(
                    `/admin/llm-models/new?error=${encodeURIComponent(latestError.message)}`,
                );
            }

            const nextId = (latestModel?.id ?? 0) + 1;
            const retry = await supabase
                .from("llm_models")
                .insert({ id: nextId, ...payload });

            error = retry.error;
        }

        if (error) {
            redirect(`/admin/llm-models/new?error=${encodeURIComponent(error.message)}`);
        }

        revalidatePath("/admin/llm-models");
        redirect("/admin/llm-models");
    }

    return (
        <AdminLayoutShell>
            <AdminPageHeader title="New LLM Model" />
            {errorMessage ? (
                <p style={{ color: "#ff6b6b", marginBottom: "12px" }}>
                    Error: {errorMessage}
                </p>
            ) : null}
            <form action={createModel} className="admin-form">
                <label className="admin-field">
                    <span>Name</span>
                    <input type="text" name="name" required />
                </label>

                <label className="admin-field">
                    <span>LLM Provider</span>
                    <select name="llm_provider_id" required defaultValue="">
                        <option value="" disabled>
                            Select a provider
                        </option>
                        {providers.map((provider) => (
                            <option key={provider.id} value={provider.id}>
                                {provider.name} (#{provider.id})
                            </option>
                        ))}
                    </select>
                </label>

                <label className="admin-field">
                    <span>Provider Model ID</span>
                    <input type="text" name="provider_model_id" required />
                </label>

                <label
                    className="admin-field"
                    style={{ display: "flex", gap: "8px", alignItems: "center" }}
                >
                    <input type="checkbox" name="is_temperature_supported" />
                    <span>Temperature Supported</span>
                </label>

                <button className="admin-button primary" type="submit">
                    Create Model
                </button>
            </form>
        </AdminLayoutShell>
    );
}
