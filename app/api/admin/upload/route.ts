import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseConfig, uploadToSupabaseStorage } from "@/lib/supabase";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const allowedFolders = new Set(["products", "news", "info"]);

function extensionFor(file: File) {
  const fromName = path.extname(file.name).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(fromName)) return fromName;
  if (file.type === "image/png") return ".png";
  if (file.type === "image/webp") return ".webp";
  if (file.type === "image/gif") return ".gif";
  return ".jpg";
}

function cleanFolder(value: FormDataEntryValue | null) {
  const folder = typeof value === "string" ? value : "products";
  return allowedFolders.has(folder) ? folder : "products";
}

export async function POST(request: Request) {
  await requireAdmin();
  const formData = await request.formData();
  const file = formData.get("file");
  const folder = cleanFolder(formData.get("folder"));

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "请选择要上传的图片" }, { status: 400 });
  }

  if (!allowedTypes.has(file.type)) {
    return NextResponse.json({ message: "仅支持 JPG、PNG、WebP 或 GIF 图片" }, { status: 400 });
  }

  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ message: "图片不能超过 2MB" }, { status: 400 });
  }

  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extensionFor(file)}`;
  const objectPath = `${folder}/${fileName}`;

  if (getSupabaseConfig().canWrite) {
    const url = await uploadToSupabaseStorage("media", objectPath, file);
    return NextResponse.json({ ok: true, url });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
  await fs.mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  return NextResponse.json({ ok: true, url: `/uploads/${folder}/${fileName}` });
}
