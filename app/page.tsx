import { createClient } from "@/utils/supabase/server";
import PackedBubbleChart from "./components/PackedBubbleChart";

export default async function Home() {
    const supabase = await createClient();

    const { data: imagesData } = await supabase
        .from("images")
        .select("*, captions(like_count, content)");

    const imagesWithTotals =
        imagesData?.map((image: any) => {
            const totalLikes =
                image.captions?.reduce(
                    (acc: number, c: any) => acc + (c.like_count || 0),
                    0,
                ) || 0;

            const topCaption =
                image.captions?.length > 0
                    ? [...image.captions].sort(
                          (a: any, b: any) => b.like_count - a.like_count,
                      )[0]
                    : null;

            return {
                ...image,
                totalLikes,
                topCaption,
            };
        }) || [];

    return (
        <div className="chart-wrapper">
            <PackedBubbleChart images={imagesWithTotals} />
        </div>
    );
}
