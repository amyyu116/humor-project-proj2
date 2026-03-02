"use client";

import { useState } from "react";
import { Upload, Loader2, CheckCircle2, ImageIcon } from "lucide-react";

export default function ImageUpload() {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<string>("");
    const [imageId, setImageId] = useState<string | null>(null);
    const [captions, setCaptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);

        setStatus("Getting presigned URL...");
        setImageId(null);
        setCaptions([]);

        try {
            const response = await fetch("/admin/images/url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contentType: file.type }),
            });

            if (!response.ok) {
                throw new Error(
                    `Failed to get presigned URL: ${response.status}`,
                );
            }

            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("text/html")) {
                throw new Error(
                    "Received HTML response. You may need to log in again.",
                );
            }

            const { presignedUrl, cdnUrl } = await response.json();

            setStatus("Uploading to S3...");

            const uploadResponse = await fetch(presignedUrl, {
                method: "PUT",
                headers: { "Content-Type": file.type },
                body: file,
            });

            if (!uploadResponse.ok) {
                throw new Error("Failed to upload to S3");
            }

            setStatus("Registering image...");

            const registerResponse = await fetch("/admin/images/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageUrl: cdnUrl }),
            });

            if (!registerResponse.ok) {
                throw new Error("Failed to register image");
            }

            const { imageId } = await registerResponse.json();
            setImageId(imageId);

            setStatus("Generating captions...");

            const captionResponse = await fetch("/admin/images/caption", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageId }),
            });

            if (!captionResponse.ok) {
                throw new Error("Failed to generate captions");
            }

            const captionsData = await captionResponse.json();
            setCaptions(captionsData);

            setStatus("Process complete!");
        } catch (e) {
            console.error(e);
            setStatus("Upload failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>
                <ImageIcon size={18} /> Upload Image
            </h2>

            <label style={styles.fileLabel}>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={styles.fileInput}
                />
                {file ? (
                    file.name
                ) : (
                    <span style={{ color: "darkgrey" }}>Choose an image</span>
                )}
            </label>

            <button
                onClick={handleUpload}
                disabled={!file || loading}
                style={{
                    ...styles.button,
                    opacity: !file || loading ? 0.6 : 1,
                    cursor: !file || loading ? "not-allowed" : "pointer",
                }}
            >
                {loading ? (
                    <>
                        <Loader2 size={16} style={{ marginRight: 8 }} />
                        Uploading...
                    </>
                ) : (
                    <>
                        <Upload size={16} style={{ marginRight: 8 }} />
                        Upload
                    </>
                )}
            </button>

            <p style={{ color: "darkgrey" }}>
                {status && <CheckCircle2 size={14} />}
                {status}
            </p>

            {imageId && <p style={styles.meta}>Image ID: {imageId}</p>}

            {captions.length > 0 && (
                <div style={styles.captionBox}>
                    <h3 style={styles.captionTitle}>Generated Captions</h3>
                    <ul style={styles.list}>
                        {captions.map((caption, i) => (
                            <li key={i}>
                                {typeof caption === "object" && caption?.content
                                    ? caption.content
                                    : typeof caption === "object"
                                      ? JSON.stringify(caption)
                                      : caption}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    p: {
        color: "darkgray",
    },
    container: {
        display: "flex",
        flexDirection: "column",
        gap: 14,
        maxWidth: 460,
        padding: 24,
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
        background: "#2e2e2e",
        fontFamily: "system-ui, sans-serif",
    },
    title: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        margin: 0,
        fontSize: 18,
        fontWeight: 600,
    },
    fileLabel: {
        border: "1px dashed #cbd5e1",
        borderRadius: 8,
        padding: "12px 14px",
        cursor: "pointer",
        background: "#f8fafc",
        fontSize: 14,
    },
    fileInput: {
        display: "none",
        color: "darkgray",
    },
    button: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "none",
        borderRadius: 8,
        padding: "10px 14px",
        background: "#2563eb",
        color: "white",
        fontWeight: 600,
        fontSize: 15,
        transition: "all 0.2s ease",
    },
    status: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        minHeight: 20,
        color: "#334155",
        fontSize: 14,
        margin: 0,
    },
    meta: {
        fontSize: 13,
        color: "#64748b",
        margin: 0,
    },
    captionBox: {
        marginTop: 8,
        borderTop: "1px solid #eee",
        paddingTop: 12,
    },
    captionTitle: {
        margin: "0 0 8px",
        fontSize: 15,
        fontWeight: 600,
    },
    list: {
        margin: 0,
        color: "#c7dfff",
        fontSize: 14,
        display: "flex",
        flexDirection: "column",
        gap: 14,
    },
};
