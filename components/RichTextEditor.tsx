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

const imageWidths = ["25%", "50%", "75%", "100%"];

function isSelectionInside(root: HTMLElement, range: Range) {
  return root.contains(range.commonAncestorContainer);
}

function cleanEditorHtml(editor: HTMLDivElement) {
  const clone = editor.cloneNode(true) as HTMLDivElement;
  clone.querySelectorAll(".rich-selected-image").forEach((node) => node.classList.remove("rich-selected-image"));
  return clone.innerHTML;
}

export function RichTextEditor({ value, onChange, uploadFolder, imageAlt }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const selectedImageRef = useRef<HTMLImageElement | null>(null);
  const lastValueRef = useRef("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedImageWidth, setSelectedImageWidth] = useState("");

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || value === lastValueRef.current) return;

    const editorIsFocused = document.activeElement === editor;
    if (!editorIsFocused) {
      editor.innerHTML = value;
      lastValueRef.current = value;
      selectionRef.current = null;
      selectedImageRef.current = null;
      setSelectedImageWidth("");
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
    const editor = editorRef.current;
    const html = editor ? cleanEditorHtml(editor) : "";
    lastValueRef.current = html;
    onChange(html);
    saveSelection();
  };

  const apply = (command: string, commandValue?: string) => {
    restoreSelection();
    document.execCommand(command, false, commandValue);
    sync();
    requestAnimationFrame(() => {
      restoreSelection();
    });
  };

  const selectImage = (image: HTMLImageElement | null) => {
    selectedImageRef.current?.classList.remove("rich-selected-image");
    selectedImageRef.current = image;

    if (!image) {
      setSelectedImageWidth("");
      return;
    }

    image.classList.add("rich-selected-image");
    setSelectedImageWidth(image.style.width || "100%");
  };

  const updateSelectedImageWidth = (width: string) => {
    const image = selectedImageRef.current;
    if (!image) return;

    const nextWidth = width.trim();
    image.style.width = nextWidth || "auto";
    image.style.height = "auto";
    image.style.maxWidth = "100%";
    setSelectedImageWidth(nextWidth);
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

    apply("insertHTML", `<p><img src="${payload.url}" alt="${imageAlt}" style="width: 100%; height: auto; max-width: 100%;" /></p>`);
    setMessage("图片已插入，请保存内容。点击图片可调整宽度。");
  };

  return (
    <div className="rich-editor">
      <div className="rich-toolbar" aria-label="富文本工具栏">
        <select
          className="field"
          defaultValue=""
          onMouseDown={saveSelection}
          onChange={(event) => {
            apply("fontName", event.target.value);
            event.currentTarget.blur();
          }}
          aria-label="字体"
        >
          <option value="" disabled>
            字体
          </option>
          {fontOptions.map((font) => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>
        <select
          className="field"
          defaultValue=""
          onMouseDown={saveSelection}
          onChange={(event) => {
            apply("fontSize", event.target.value);
            event.currentTarget.blur();
          }}
          aria-label="字号"
        >
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

      {selectedImageRef.current && (
        <div className="rich-image-toolbar">
          <span>图片宽度</span>
          {imageWidths.map((width) => (
            <button className="btn" type="button" key={width} onMouseDown={(event) => event.preventDefault()} onClick={() => updateSelectedImageWidth(width)}>
              {width}
            </button>
          ))}
          <input
            className="field"
            value={selectedImageWidth}
            onChange={(event) => updateSelectedImageWidth(event.target.value)}
            placeholder="例如 300px"
            aria-label="自定义图片宽度"
          />
        </div>
      )}

      <div
        ref={editorRef}
        className="rich-content"
        contentEditable
        suppressContentEditableWarning
        onFocus={saveSelection}
        onBlur={saveSelection}
        onMouseDown={saveSelection}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        onInput={sync}
        onClick={(event) => {
          const target = event.target;
          selectImage(target instanceof HTMLImageElement ? target : null);
        }}
      />
      {uploading && <span className="result-count">图片上传中...</span>}
      {message && <span className="result-count">{message}</span>}
    </div>
  );
}
