import { localizePath, type Locale } from "@/lib/i18n";

function hasHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function localizeHtmlLinks(content: string, locale: Locale) {
  // Keep quoted attribute values together: a title containing `href=` is not a link.
  // Skip comments and raw-text elements so their contents are never rewritten as markup.
  return content.replace(/<!--[\s\S]*?-->|<(script|style|textarea|title)\b[^>]*>[\s\S]*?<\/\1\s*>|<a\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi, (tag) => {
    if (!/^<a(?:\s|>)/i.test(tag)) return tag;
    return tag.replace(/(\s+)([^\s"'<>/=]+)(\s*=\s*)(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g, (attribute, space: string, name: string, equals: string, doubleQuoted: string | undefined, singleQuoted: string | undefined, unquoted: string | undefined) => {
      if (name.toLowerCase() !== "href") return attribute;
      const value = doubleQuoted ?? singleQuoted ?? unquoted ?? "";
      // Prefixing the raw URL preserves HTML entities such as &amp; and the original
      // quote style, without decoding/re-encoding or introducing attribute delimiters.
      if (!value.startsWith("/") || value.startsWith("//") || /\.[a-z\d]{1,10}(?:[?#]|$)/i.test(value)) return attribute;
      const localized = localizePath(value, locale);
      const quote = doubleQuoted !== undefined ? '"' : singleQuoted !== undefined ? "'" : "";
      return `${space}${name}${equals}${quote}${localized}${quote}`;
    });
  });
}

function renderLegacyText(value: string, imageAlt: string) {
  return value
    .split(/\n+/)
    .filter(Boolean)
    .map((paragraph) => {
      const image = paragraph.match(/^!\[(.*)]\((.*)\)$/);
      if (image) {
        const [, alt, src] = image;
        return <img className="article-inline-image" src={src} alt={alt || imageAlt} key={paragraph} />;
      }
      return <p key={paragraph}>{paragraph}</p>;
    });
}

export function RichTextContent({ content, imageAlt, locale }: { content: string; imageAlt: string; locale: Locale }) {
  if (!content.trim()) return null;

  if (hasHtml(content)) {
    return <div className="rich-output" dangerouslySetInnerHTML={{ __html: localizeHtmlLinks(content, locale) }} />;
  }

  return <div className="rich-output">{renderLegacyText(content, imageAlt)}</div>;
}
