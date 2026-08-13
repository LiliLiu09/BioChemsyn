"use client";

import { useEffect, useRef, useState } from "react";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  uploadFolder: string;
  imageAlt: string;
};

const fontOptions = [
  { label: "雅黑", value: "Arial, Microsoft YaHei, sans-serif" },
  { label: "宋体", value: "SimSun, Songti SC, serif" },
  { label: "楷体", value: "KaiTi, STKaiti, serif" },
  { label: "黑体", value: "SimHei, Microsoft YaHei, sans-serif" }
];

const sizeOptions = [
  { label: "小号", value: "2" },
  { label: "正文", value: "3" },
  { label: "中号", value: "4" },
  { label: "大号", value: "5" },
  { label: "标题", value: "6" }
];

function runCommand(command: string, value?: string) {
  document.execCommand(command, false, value);
}

export function RichTextEditor({ value, onChange, uploadFolder, imageAlt }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const sync = () => {
    onChange(editorRef.current?.innerHTML || "");
  };

  const apply = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    runCommand(command, commandValue);
    sync();
  };

  const uploadImage = async (file: File | undefined) => {
    if (!file) return;

    setUploading(true);
    setMessage("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", uploadFolder);

    const response = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const payload = (await response.json()) as { url?: string; message?: string };
    setUploading(false);

    if (!response.ok || !payload.url) {
      setMessage(payload.message || "图片上传失败");
      return;
    }

    apply("insertHTML", `<p><img src="${payload.url}" alt="${imageAlt}" /></p>`);
    setMessage("图片已插入，请保存内容");
  };

  return (
    <div className="rich-editor">
      <div className="rich-toolbar" aria-label="富文本工具栏">
        <select className="field" defaultValue="" onChange={(event) => apply("fontName", event.target.value)} aria-label="字体">
          <option value="" disabled>
            字体
          </option>
          {fontOptions.map((font) => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>
        <select className="field" defaultValue="" onChange={(event) => apply("fontSize", event.target.value)} aria-label="字号">
          <option value="" disabled>
            字号
          </option>
          {sizeOptions.map((size) => (
            <option key={size.value} value={size.value}>
              {size.label}
            </option>
          ))}
        </select>
        <button type="button" className="btn" onClick={() => apply("bold")}>
          B
        </button>
        <button type="button" className="btn" onClick={() => apply("italic")}>
          I
        </button>
        <button type="button" className="btn" onClick={() => apply("underline")}>
          U
        </button>
        <button type="button" className="btn" onClick={() => apply("justifyLeft")}>
          左
        </button>
        <button type="button" className="btn" onClick={() => apply("justifyCenter")}>
          中
        </button>
        <button type="button" className="btn" onClick={() => apply("justifyRight")}>
          右
        </button>
        <label className="btn rich-upload">
          图片
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => uploadImage(event.target.files?.[0])} />
        </label>
      </div>
      <div ref={editorRef} className="rich-content" contentEditable suppressContentEditableWarning onInput={sync} />
      {uploading && <span className="result-count">图片上传中...</span>}
      {message && <span className="result-count">{message}</span>}
    </div>
  );
}
