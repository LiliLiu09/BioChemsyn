function hasHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
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

export function RichTextContent({ content, imageAlt }: { content: string; imageAlt: string }) {
  if (!content.trim()) return null;

  if (hasHtml(content)) {
    return <div className="rich-output" dangerouslySetInnerHTML={{ __html: content }} />;
  }

  return <div className="rich-output">{renderLegacyText(content, imageAlt)}</div>;
}
