import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("is_superadmin")
        .eq("id", user.id)
        .single();

    if (!profile?.is_superadmin && user.email !== "ajy2127@columbia.edu") {
        redirect("/");
    }

    return (
        <div>
            <p>Select a tab above to manage content.</p>
        </div>
    );
}
