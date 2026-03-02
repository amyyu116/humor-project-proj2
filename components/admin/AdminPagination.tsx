interface AdminPaginationProps {
    page: number;
    totalPages: number;
    buildPageLink: (newPage: number) => string;
}

export default function AdminPagination({
    page,
    totalPages,
    buildPageLink,
}: AdminPaginationProps) {
    return (
        <div className="admin-pagination">
            {page > 1 ? (
                <a href={buildPageLink(page - 1)} className="admin-page-link">
                    Previous
                </a>
            ) : null}

            <span className="admin-page-label">
                Page {page} of {totalPages}
            </span>

            {page < totalPages ? (
                <a href={buildPageLink(page + 1)} className="admin-page-link">
                    Next
                </a>
            ) : null}
        </div>
    );
}
