"use client";

import React, { useMemo, useState } from "react";
import * as d3 from "d3";

interface ImageType {
    id: string;
    url: string;
    totalLikes: number;
    topCaption?: {
        content: string;
        like_count: number;
    } | null;
}

export default function PackedBubbleChart({ images }: { images: ImageType[] }) {
    const size = 900;
    const [tooltip, setTooltip] = useState<any>(null);

    const root = useMemo(() => {
        const data = {
            children: images.map((img) => ({
                ...img,
                value: Math.sqrt(img.totalLikes + 1), //value: img.totalLikes || 1,
            })),
        };

        const hierarchy = d3.hierarchy(data).sum((d: any) => d.value);

        return d3.pack().size([size, size]).padding(4)(hierarchy);
    }, [images]);

    return (
        <div style={{ position: "relative" }}>
            <svg width={size} height={size}>
                {root.leaves().map((node, i) => (
                    <g
                        key={i}
                        transform={`translate(${node.x},${node.y})`}
                        onMouseEnter={(e) =>
                            setTooltip({
                                x: e.clientX,
                                y: e.clientY,
                                data: node.data,
                            })
                        }
                        onMouseMove={(e) =>
                            setTooltip((prev: any) =>
                                prev
                                    ? { ...prev, x: e.clientX, y: e.clientY }
                                    : null,
                            )
                        }
                        onMouseLeave={() => setTooltip(null)}
                        style={{ cursor: "pointer" }}
                    >
                        <clipPath id={`clip-${i}`}>
                            <circle r={node.r} />
                        </clipPath>

                        <image
                            href={node.data.url}
                            width={node.r * 2}
                            height={node.r * 2}
                            x={-node.r}
                            y={-node.r}
                            clipPath={`url(#clip-${i})`}
                            preserveAspectRatio="xMidYMid slice"
                        />

                        <circle
                            r={node.r}
                            fill="none"
                            stroke="white"
                            strokeWidth={1.5}
                        />
                    </g>
                ))}
            </svg>

            {tooltip && (
                <div
                    style={{
                        position: "fixed",
                        top: tooltip.y + 10,
                        left: tooltip.x + 10,
                        backgroundColor: "rgba(0,0,0,0.85)",
                        color: "white",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        maxWidth: "300px",
                        fontSize: "14px",
                        pointerEvents: "none",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
                    }}
                >
                    <div style={{ fontWeight: "bold", marginBottom: "6px" }}>
                        ❤️ Total Likes: {tooltip.data.totalLikes}
                    </div>
                    {tooltip.data.topCaption ? (
                        <>
                            <div
                                style={{
                                    fontStyle: "italic",
                                    marginBottom: "4px",
                                }}
                            >
                                <b>Top Caption:</b>
                                <br />
                                {tooltip.data.topCaption.content}
                            </div>
                            <div style={{ opacity: 0.8 }}>
                                👍 {tooltip.data.topCaption.like_count} likes
                            </div>
                        </>
                    ) : (
                        <div style={{ opacity: 0.7 }}>No captions yet</div>
                    )}
                </div>
            )}
        </div>
    );
}
