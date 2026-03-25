import { createClient } from "@/utils/supabase/server";
import PackedBubbleChart from "./components/PackedBubbleChart";

export const revalidate = 60;

type CaptionRow = {
    like_count: number | null;
    content: string | null;
};

type ValidCaption = {
    like_count: number;
    content: string;
};

type ImageRow = {
    id: string;
    url: string;
    captions: CaptionRow[] | null;
};

async function fetchTableCount(
    supabase: Awaited<ReturnType<typeof createClient>>,
    table: string,
) {
    const { count, error } = await supabase
        .from(table)
        .select("id", { count: "exact", head: true });

    if (error) {
        console.error(`Failed to fetch count for ${table}`, error);
        return 0;
    }

    return count ?? 0;
}

export default async function Home() {
    const supabase = await createClient();

    const { data: imagesData } = await supabase
        .from("images")
        .select("id, url, captions(like_count, content)");

    const [captionCount, imageCount, userCount] = await Promise.all([
        fetchTableCount(supabase, "captions"),
        fetchTableCount(supabase, "images"),
        fetchTableCount(supabase, "profiles"),
    ]);

    const imagesWithTotals =
        (imagesData as ImageRow[] | null)
            ?.map((image) => {
                const captions = image.captions ?? [];
                const likedCaptions = captions.filter(
                    (caption): caption is ValidCaption =>
                        typeof caption.like_count === "number" &&
                        caption.like_count > 0 &&
                        typeof caption.content === "string",
                );
                const totalLikes = likedCaptions.reduce(
                    (acc, caption) => acc + caption.like_count,
                    0,
                );

                const topCaption =
                    likedCaptions.length > 0
                        ? [...likedCaptions].sort((a, b) => b.like_count - a.like_count)[0]
                        : null;

                return {
                    ...image,
                    totalLikes,
                    topCaption,
                };
            })
            .filter(
                (image) => image.totalLikes >= 1 && image.topCaption !== null,
            ) || [];

    const formatNumber = (value: number) =>
        new Intl.NumberFormat("en-US").format(value);
    const formatDecimal = (value: number) =>
        new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 2,
        }).format(value);

    const averageCaptionsPerImage =
        imageCount > 0 ? captionCount / imageCount : 0;

    return (
        <div className="chart-wrapper">
            <div className="chart-area">
                <PackedBubbleChart images={imagesWithTotals} />
            </div>
            <div className="facts-panel">
                <div className="fact-bubble fact-bubble-lg">
                    <div className="fact-value">
                        {formatDecimal(averageCaptionsPerImage)}
                    </div>
                    <div className="fact-label">
                        Average captions per image
                    </div>
                </div>
                <div className="fact-bubble fact-bubble-md">
                    <div className="fact-value">
                        {formatNumber(imageCount)}
                    </div>
                    <div className="fact-label">Images in the database</div>
                </div>
                <div className="fact-bubble fact-bubble-sm">
                    <div className="fact-value">
                        {formatNumber(userCount)}
                    </div>
                    <div className="fact-label">Users in the database</div>
                </div>
            </div>
        </div>
    );
}
