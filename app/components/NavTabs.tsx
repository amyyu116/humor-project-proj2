"use client";
import "../globals.css";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavTabs() {
    const pathname = usePathname();

    return (
        <div className="tabs">
            <Link
                href="/"
                className={`tab ${pathname === "/" ? "active" : ""}`}
            >
                Visualization
            </Link>

            <Link
                href="/admin"
                className={`tab ${pathname.startsWith("/admin") ? "active" : ""}`}
            >
                Admin
            </Link>
        </div>
    );
}
