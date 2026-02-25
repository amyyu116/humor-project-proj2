import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

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

    // Fetch profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("is_superadmin")
        .eq("id", user.id)
        .single();

    if (!profile?.is_superadmin && user.email !== "ajy2127@columbia.edu") {
        redirect("/");
    }

    return (
        <div className="p-8">
            <h1 className="admin-title">Admin Dashboard</h1>

            <div className="admin-tabs">
                <Link href="/admin/users" className="admin-tab">
                    Users / Profiles
                </Link>

                <Link href="/admin/images" className="admin-tab">
                    Images
                </Link>

                <Link href="/admin/captions" className="admin-tab">
                    Captions
                </Link>
            </div>

            {children}
        </div>
    );
}
