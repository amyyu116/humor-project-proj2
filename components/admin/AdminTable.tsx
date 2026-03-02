import type { ReactNode } from "react";

interface AdminTableProps {
    headers: string[];
    children: ReactNode;
}

export default function AdminTable({ headers, children }: AdminTableProps) {
    return (
        <table className="admin-table">
            <thead>
                <tr>
                    {headers.map((header) => (
                        <th key={header}>{header}</th>
                    ))}
                </tr>
            </thead>
            <tbody>{children}</tbody>
        </table>
    );
}
