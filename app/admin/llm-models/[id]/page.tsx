import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
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

export default async function EditLlmModelPage({
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

    const [{ data: model }, { data: providerData }] = await Promise.all([
        supabase
            .from("llm_models")
            .select(
                "id, name, llm_provider_id, provider_model_id, is_temperature_supported",
            )
            .eq("id", id)
            .single(),
        supabase.from("llm_providers").select("id, name").order("name", {
            ascending: true,
        }),
    ]);

    if (!model) {
        notFound();
    }

    const providers = (providerData ?? []) as LlmProviderOption[];

    async function updateModel(formData: FormData) {
        "use server";

        const supabase = await createClient();
        const name = getText(formData, "name");
        const llmProviderIdRaw = getText(formData, "llm_provider_id");
        const providerModelId = getText(formData, "provider_model_id");
        const isTemperatureSupported =
            getText(formData, "is_temperature_supported") === "on";

        if (!name || !providerModelId || !llmProviderIdRaw) {
            redirect(`/admin/llm-models/${id}?error=Missing required fields`);
        }

        const llmProviderId = Number.parseInt(llmProviderIdRaw, 10);
        if (Number.isNaN(llmProviderId)) {
            redirect(`/admin/llm-models/${id}?error=Invalid provider id`);
        }

        const { error } = await supabase
            .from("llm_models")
            .update({
                name,
                llm_provider_id: llmProviderId,
                provider_model_id: providerModelId,
                is_temperature_supported: isTemperatureSupported,
            })
            .eq("id", id);

        if (error) {
            redirect(`/admin/llm-models/${id}?error=${encodeURIComponent(error.message)}`);
        }

        revalidatePath("/admin/llm-models");
        revalidatePath(`/admin/llm-models/${id}`);
        redirect("/admin/llm-models");
    }

    async function deleteModel() {
        "use server";

        const supabase = await createClient();
        const { error } = await supabase.from("llm_models").delete().eq("id", id);

        if (error) {
            redirect(`/admin/llm-models/${id}?error=${encodeURIComponent(error.message)}`);
        }

        revalidatePath("/admin/llm-models");
        redirect("/admin/llm-models");
    }

    return (
        <AdminLayoutShell>
            <AdminPageHeader title={`Edit LLM Model #${model.id}`} />
            {errorMessage ? (
                <p style={{ color: "#ff6b6b", marginBottom: "12px" }}>
                    Error: {errorMessage}
                </p>
            ) : null}
            <form action={updateModel} className="admin-form">
                <label className="admin-field">
                    <span>Name</span>
                    <input type="text" name="name" defaultValue={model.name} required />
                </label>

                <label className="admin-field">
                    <span>LLM Provider</span>
                    <select
                        name="llm_provider_id"
                        required
                        defaultValue={String(model.llm_provider_id)}
                    >
                        {providers.map((provider) => (
                            <option key={provider.id} value={provider.id}>
                                {provider.name} (#{provider.id})
                            </option>
                        ))}
                    </select>
                </label>

                <label className="admin-field">
                    <span>Provider Model ID</span>
                    <input
                        type="text"
                        name="provider_model_id"
                        defaultValue={model.provider_model_id}
                        required
                    />
                </label>

                <label
                    className="admin-field"
                    style={{ display: "flex", gap: "8px", alignItems: "center" }}
                >
                    <input
                        type="checkbox"
                        name="is_temperature_supported"
                        defaultChecked={model.is_temperature_supported}
                    />
                    <span>Temperature Supported</span>
                </label>

                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <button className="admin-button primary" type="submit">
                        Save Changes
                    </button>

                    <button
                        className="admin-button danger"
                        type="submit"
                        formAction={deleteModel}
                    >
                        Delete Model
                    </button>

                    <Link href="/admin/llm-models">Cancel</Link>
                </div>
            </form>
        </AdminLayoutShell>
    );
}
