import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
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

                {/* <Link href="/admin/caption-requests" className="admin-tab">
                    Caption Requests
                </Link>

                <Link href="/admin/caption-examples" className="admin-tab">
                    Caption Examples
                </Link>

                <Link href="/admin/terms" className="admin-tab">
                    Terms
                </Link>

                <Link href="/admin/humor-flavors" className="admin-tab">
                    Humor Flavors
                </Link>

                <Link href="/admin/humor-flavor-steps" className="admin-tab">
                    Flavor Steps
                </Link>

                <Link href="/admin/llm-providers" className="admin-tab">
                    LLM Providers
                </Link>

                <Link href="/admin/llm-models" className="admin-tab">
                    LLM Models
                </Link>

                <Link href="/admin/llm-prompt-chains" className="admin-tab">
                    LLM Prompt Chains
                </Link>

                <Link href="/admin/llm-model-responses" className="admin-tab">
                    LLM Responses
                </Link>

                <Link href="/admin/allowed-signup-domains" className="admin-tab">
                    Signup Domains
                </Link>

                <Link href="/admin/whitelist-email-addresses" className="admin-tab">
                    Whitelist Emails
                </Link>

                <Link href="/admin/humor-mix" className="admin-tab">
                    Humor Mix
                </Link> */}
            </div>
            {children}
        </div>
    );
}
