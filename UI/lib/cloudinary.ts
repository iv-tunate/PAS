import { api } from "./api";

type SignedUpload = {
  cloud_name: string;
  api_key: string;
  timestamp: number;
  signature: string;
  folder: string;
};


export function forceDownloadUrl(url: string): string {
  if (!url.includes("/upload/")) return url;
  if (url.includes("fl_attachment")) return url; // already set
  return url.replace("/upload/", "/upload/fl_attachment/");
}

export async function uploadToCloudinary(
  file: File,
  folder: "courses" | "pastor-photo" | "hero-video" | "book-covers" | "books"
): Promise<string> {
  const signed = await api.get<SignedUpload>(
    `/admin/uploads/signature?folder=${folder}`,
    true
  );

  let resourceType: "image" | "video" | "raw";
  if (folder === "book-covers") resourceType = "image";
  else if (folder === "books") resourceType = "raw";
  else resourceType = file.type.startsWith("video/") ? "video" : "image";

  const endpoint = `https://api.cloudinary.com/v1_1/${signed.cloud_name}/${resourceType}/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signed.api_key);
  formData.append("timestamp", String(signed.timestamp));
  formData.append("signature", signed.signature);
  formData.append("folder", signed.folder);

  const res = await fetch(endpoint, { method: "POST", body: formData });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error?.message || "Upload to Cloudinary failed");
  }

  const data = await res.json();
  return data.secure_url as string;
}
