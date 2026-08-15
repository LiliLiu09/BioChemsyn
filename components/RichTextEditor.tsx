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

function isSelectionInside(root: HTMLElement, range: Range) {
  return root.contains(range.commonAncestorContainer);
}

export function RichTextEditor({ value, onChange, uploadFolder, imageAlt }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const lastValueRef = useRef(value);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || value === lastValueRef.current) return;

    const editorIsFocused = document.activeElement === editor;
    if (!editorIsFocused) {
      editor.innerHTML = value;
      lastValueRef.current = value;
      selectionRef.current = null;
    }
  }, [value]);

  const saveSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (isSelectionInside(editor, range)) {
      selectionRef.current = range.cloneRange();
    }
  };

  const restoreSelection = () => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    const selection = window.getSelection();
    if (!selection) return;

    selection.removeAllRanges();
    if (selectionRef.current && isSelectionInside(editor, selectionRef.current)) {
      selection.addRange(selectionRef.current);
      return;
    }

    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    selection.addRange(range);
    selectionRef.current = range.cloneRange();
  };

  const sync = () => {
    const html = editorRef.current?.innerHTML || "";
    lastValueRef.current = html;
    onChange(html);
    saveSelection();
  };

  const apply = (command: string, commandValue?: string) => {
    restoreSelection();
    document.execCommand(command, false, commandValue);
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
        <button type="button" className="btn" onMouseDown={(event) => event.preventDefault()} onClick={() => apply("bold")}>
          B
        </button>
        <button type="button" className="btn" onMouseDown={(event) => event.preventDefault()} onClick={() => apply("italic")}>
          I
        </button>
        <button type="button" className="btn" onMouseDown={(event) => event.preventDefault()} onClick={() => apply("underline")}>
          U
        </button>
        <button type="button" className="btn" onMouseDown={(event) => event.preventDefault()} onClick={() => apply("justifyLeft")}>
          左
        </button>
        <button type="button" className="btn" onMouseDown={(event) => event.preventDefault()} onClick={() => apply("justifyCenter")}>
          中
        </button>
        <button type="button" className="btn" onMouseDown={(event) => event.preventDefault()} onClick={() => apply("justifyRight")}>
          右
        </button>
        <label className="btn rich-upload">
          图片
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => uploadImage(event.target.files?.[0])} />
        </label>
      </div>
      <div
        ref={editorRef}
        className="rich-content"
        contentEditable
        suppressContentEditableWarning
        onFocus={saveSelection}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        onInput={sync}
      />
      {uploading && <span className="result-count">图片上传中...</span>}
      {message && <span className="result-count">{message}</span>}
    </div>
  );
}
