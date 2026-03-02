"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

type AdminNavItem = {
    href: string;
    label: string;
};

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
    { href: "/admin/users", label: "Users / Profiles" },
    { href: "/admin/images", label: "Images" },
    { href: "/admin/captions", label: "Captions" },
    { href: "/admin/caption-requests", label: "Caption Requests" },
    { href: "/admin/caption-examples", label: "Caption Examples" },
    { href: "/admin/terms", label: "Terms" },
    { href: "/admin/humor-flavors", label: "Humor Flavors" },
    { href: "/admin/humor-flavor-steps", label: "Flavor Steps" },
    { href: "/admin/llm-providers", label: "LLM Providers" },
    { href: "/admin/llm-models", label: "LLM Models" },
    { href: "/admin/llm-prompt-chains", label: "LLM Prompt Chains" },
    { href: "/admin/llm-model-responses", label: "LLM Responses" },
    { href: "/admin/allowed-signup-domains", label: "Signup Domains" },
    { href: "/admin/whitelist-email-addresses", label: "Whitelist Emails" },
    { href: "/admin/humor-mix", label: "Humor Mix" },
];

export default function AdminNavDropdown() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const activeItem = useMemo(
        () =>
            ADMIN_NAV_ITEMS.find(
                (item) =>
                    pathname === item.href || pathname.startsWith(`${item.href}/`),
            ),
        [pathname],
    );

    return (
        <div className="admin-nav">
            <button
                type="button"
                className="admin-nav-trigger"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={isOpen}
            >
                <span className="admin-nav-trigger-label">
                    {activeItem?.label ?? "Admin Menu"}
                </span>
                <ChevronDown size={16} className={isOpen ? "open" : ""} />
            </button>

            {isOpen ? (
                <div className="admin-nav-menu" role="menu">
                    {ADMIN_NAV_ITEMS.map((item) => {
                        const isActive =
                            pathname === item.href ||
                            pathname.startsWith(`${item.href}/`);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                role="menuitem"
                                className={`admin-nav-item${isActive ? " active" : ""}`}
                                onClick={() => setIsOpen(false)}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
}
