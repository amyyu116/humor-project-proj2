import { createClient } from "@/utils/supabase/server";
import PackedBubbleChart from "./components/PackedBubbleChart";

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

export default async function Home() {
    const supabase = await createClient();

    const { data: imagesData } = await supabase
        .from("images")
        .select("id, url, captions(like_count, content)");

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

    return (
        <div className="chart-wrapper">
            <PackedBubbleChart images={imagesWithTotals} />
        </div>
    );
}
