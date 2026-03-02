import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AdminNavDropdown from "@/components/admin/AdminNavDropdown";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
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
        <div className="admin-layout">
            <AdminNavDropdown />
            {children}
        </div>
    );
}
