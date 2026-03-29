import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import AdminLayoutShell from "@/components/admin/AdminLayoutShell";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

type CaptionRow = {
    id: string;
    content: string | null;
    like_count: number | null;
};

const PAGE_SIZE = 1000;

async function fetchCaptionStats(
    supabase: Awaited<ReturnType<typeof createClient>>,
) {
    let page = 0;
    let hasMore = true;
    let totalCaptions = 0;
    let ratedCaptions = 0;
    let totalLikes = 0;
    let topCaption: CaptionRow | null = null;

    while (hasMore) {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data, error } = await supabase
            .from("captions")
            .select("id, content, like_count")
            .range(from, to);

        if (error) {
            console.error("Failed to fetch caption stats page", error);
            break;
        }

        const rows = (data ?? []) as CaptionRow[];
        totalCaptions += rows.length;

        for (const caption of rows) {
            const likes = caption.like_count ?? 0;
            totalLikes += likes;
            if (likes > 0) {
                ratedCaptions += 1;
            }
            if (!topCaption || likes > (topCaption.like_count ?? 0)) {
                topCaption = caption;
            }
        }

        hasMore = rows.length === PAGE_SIZE;
        page += 1;
    }

    return {
        totalCaptions,
        ratedCaptions,
        totalLikes,
        topCaption,
    };
}

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

    const { totalCaptions, ratedCaptions, totalLikes, topCaption } =
        await fetchCaptionStats(supabase);
    const averageLikes =
        totalCaptions > 0 ? totalLikes / totalCaptions : 0;
    const averageLikesRated =
        ratedCaptions > 0 ? totalLikes / ratedCaptions : 0;
    const ratingCoverage =
        totalCaptions > 0 ? (ratedCaptions / totalCaptions) * 100 : 0;

    const formatNumber = (value: number) =>
        new Intl.NumberFormat("en-US").format(value);
    const formatDecimal = (value: number, digits = 2) =>
        new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 1,
            maximumFractionDigits: digits,
        }).format(value);

    return (
        <AdminLayoutShell>
            <AdminPageHeader title="Admin Overview" />

            <div className="admin-dashboard">
                <div className="admin-stat-grid">
                    <div className="admin-stat-card">
                        <div className="admin-stat-value">
                            {formatNumber(totalCaptions)}
                        </div>
                        <div className="admin-stat-label">
                            Total captions
                        </div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="admin-stat-value">
                            {formatNumber(totalLikes)}
                        </div>
                        <div className="admin-stat-label">
                            Total ratings (likes)
                        </div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="admin-stat-value">
                            {formatDecimal(averageLikes, 2)}
                        </div>
                        <div className="admin-stat-label">
                            Avg likes per caption
                        </div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="admin-stat-value">
                            {formatDecimal(averageLikesRated, 2)}
                        </div>
                        <div className="admin-stat-label">
                            Avg likes (rated only)
                        </div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="admin-stat-value">
                            {formatDecimal(ratingCoverage, 1)}%
                        </div>
                        <div className="admin-stat-label">
                            Captions rated
                        </div>
                        <div className="admin-stat-sub">
                            {formatNumber(ratedCaptions)} rated ·{" "}
                            {formatNumber(
                                Math.max(totalCaptions - ratedCaptions, 0),
                            )}{" "}
                            unrated
                        </div>
                    </div>
                </div>

                <div className="admin-stat-highlight">
                    <div className="admin-stat-highlight-title">
                        Top rated caption
                    </div>
                    <div className="admin-stat-highlight-body">
                        {topCaption?.content &&
                        (topCaption.like_count ?? 0) > 0 ? (
                            <>
                                <div className="admin-stat-highlight-text">
                                    “{topCaption.content}”
                                </div>
                                <div className="admin-stat-highlight-meta">
                                    {formatNumber(topCaption.like_count ?? 0)}{" "}
                                    likes
                                </div>
                            </>
                        ) : (
                            <div className="admin-stat-highlight-empty">
                                No rated captions yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayoutShell>
    );
}
