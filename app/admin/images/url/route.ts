import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
    try {
        const { contentType } = await req.json();

        // 🔑 create supabase server client
        const supabase = await createClient();

        // 🔑 get current session
        const {
            data: { session },
            error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
            return NextResponse.json(
                { error: "Unauthorized - no session" },
                { status: 401 },
            );
        }

        const accessToken = session.access_token;

        // call AlmostCrackd backend
        const response = await fetch(
            "https://api.almostcrackd.ai/pipeline/generate-presigned-url",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`, // ← integrated here
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contentType,
                }),
            },
        );

        if (!response.ok) {
            const text = await response.text();
            console.error("AlmostCrackd error:", text);
            return NextResponse.json(
                { error: "Failed to generate presigned URL" },
                { status: response.status },
            );
        }

        const data = await response.json();

        return NextResponse.json(data);
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
