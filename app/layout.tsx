import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import NavTabs from "./components/NavTabs";
import "./globals.css";

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    return (
        <html>
            <body>
                <div className="app-container">
                    <div className="app-header">
                        <div className="app-title">Humor Studies Project 2</div>

                        {user && (
                            <div className="user-section">
                                <span>{user.email}</span>
                                <form action="/auth/signout" method="post">
                                    <button
                                        className="signout-btn"
                                        type="submit"
                                    >
                                        Sign out
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>

                    <NavTabs />
                    {children}
                </div>
            </body>
        </html>
    );
}
