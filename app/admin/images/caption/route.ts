import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
    try {
        const { imageId } = await req.json();

        if (!imageId) {
            return NextResponse.json(
                { error: "Missing imageId" },
                { status: 400 },
            );
        }

        // 🔑 get logged-in session
        const supabase = await createClient();

        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        // 📡 call AlmostCrackd caption endpoint
        const response = await fetch(
            "https://api.almostcrackd.ai/pipeline/generate-captions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    imageId,
                }),
            },
        );

        if (!response.ok) {
            const text = await response.text();
            console.error("Caption generation error:", text);

            return NextResponse.json(
                { error: "Failed to generate captions" },
                { status: response.status },
            );
        }

        const captions = await response.json();

        // 👇 this matches your frontend expectation
        return NextResponse.json(captions);
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
