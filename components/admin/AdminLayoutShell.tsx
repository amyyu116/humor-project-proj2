import type { ReactNode } from "react";

export default function AdminLayoutShell({ children }: { children: ReactNode }) {
    return <div style={{ marginTop: "16px" }}>{children}</div>;
}
