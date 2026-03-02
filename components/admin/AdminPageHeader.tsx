import Link from "next/link";

interface AdminPageHeaderProps {
    title: string;
    actionHref?: string;
    actionLabel?: string;
}

export default function AdminPageHeader({
    title,
    actionHref,
    actionLabel,
}: AdminPageHeaderProps) {
    return (
        <div className="admin-page-header">
            <h2 style={{ margin: 0 }}>{title}</h2>
            {actionHref && actionLabel ? (
                <Link className="admin-button primary" href={actionHref}>
                    {actionLabel}
                </Link>
            ) : null}
        </div>
    );
}
