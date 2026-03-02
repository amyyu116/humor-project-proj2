import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
    try {
        const { imageUrl } = await req.json();

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

        const response = await fetch(
            "https://api.almostcrackd.ai/pipeline/upload-image-from-url",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    imageUrl,
                    isCommonUse: false,
                }),
            },
        );

        if (!response.ok) {
            const text = await response.text();
            console.error("Register error:", text);

            return NextResponse.json(
                { error: "Failed to register image" },
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
