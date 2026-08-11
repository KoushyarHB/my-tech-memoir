import type { ReactNode } from "react";
import type { TiptapDocument, TiptapMark, TiptapNode } from "../types/document";
import { cn } from "@/lib/utils";

function applyMarks(text: ReactNode, marks: TiptapMark[] = []): ReactNode {
  return marks.reduce<ReactNode>((content, mark, index) => {
    const key = `${mark.type}-${index}`;
    if (mark.type === "bold") return <strong key={key}>{content}</strong>;
    if (mark.type === "italic") return <em key={key}>{content}</em>;
    if (mark.type === "strike") return <s key={key}>{content}</s>;
    if (mark.type === "code") return <code key={key}>{content}</code>;
    if (mark.type === "highlight") return <mark key={key}>{content}</mark>;
    if (mark.type === "textStyle") {
      const color = typeof mark.attrs?.color === "string" ? mark.attrs.color : undefined;
      return color ? (
        <span key={key} style={{ color }}>
          {content}
        </span>
      ) : (
        content
      );
    }
    if (mark.type === "link") {
      const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : "#";
      return <a key={key} href={href} className="text-primary underline underline-offset-4">{content}</a>;
    }
    return content;
  }, text);
}

function renderNodes(nodes: TiptapNode[] | undefined): ReactNode {
  return nodes?.map((node, index) => <TiptapNodeView key={`${node.type}-${index}`} node={node} />);
}

function TiptapNodeView({ node }: { node: TiptapNode }): ReactNode {
  const children = renderNodes(node.content);
  switch (node.type) {
    case "text":
      return applyMarks(node.text ?? "", node.marks);
    case "paragraph":
      return <p>{children}</p>;
    case "heading": {
      const level = node.attrs?.level === 1 || node.attrs?.level === 2 || node.attrs?.level === 3 ? node.attrs.level : 2;
      const Heading = `h${level}` as "h1" | "h2" | "h3";
      return <Heading>{children}</Heading>;
    }
    case "bulletList":
      return <ul>{children}</ul>;
    case "orderedList":
      return <ol>{children}</ol>;
    case "taskList":
      return <ul className="list-none pl-0">{children}</ul>;
    case "listItem":
    case "taskItem":
      return <li>{children}</li>;
    case "blockquote":
      return <blockquote>{children}</blockquote>;
    case "codeBlock": {
      const language = typeof node.attrs?.language === "string" ? node.attrs.language : undefined;
      const filename = typeof node.attrs?.filename === "string" ? node.attrs.filename : undefined;
      return (
        <figure className="my-5 overflow-hidden rounded-lg border border-border bg-(--code-bg)">
          {filename ? <figcaption className="border-b border-border px-4 py-2 font-mono text-xs text-ink-tertiary">{filename}</figcaption> : null}
          <pre><code className={language ? `language-${language}` : undefined}>{children}</code></pre>
        </figure>
      );
    }
    case "horizontalRule":
      return <hr />;
    case "image": {
      const src = typeof node.attrs?.src === "string" ? node.attrs.src : "";
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
      const caption = typeof node.attrs?.caption === "string" ? node.attrs.caption : "";
      const width = typeof node.attrs?.width === "number" ? node.attrs.width : 100;
      return <figure className={cn("memoir-figure", `memoir-figure--${node.attrs?.align ?? "center"}`)} style={{ width: `${width}%` }}><img src={src} alt={alt} />{caption ? <figcaption>{caption}</figcaption> : null}</figure>;
    }
    case "callout": {
      const variant = typeof node.attrs?.variant === "string" ? node.attrs.variant : "info";
      const title = typeof node.attrs?.title === "string" ? node.attrs.title : "";
      return <aside className={`memoir-callout memoir-callout--${variant}`}>{title ? <strong>{title}</strong> : null}{children}</aside>;
    }
    case "table":
      return <table><tbody>{children}</tbody></table>;
    case "tableRow":
      return <tr>{children}</tr>;
    case "tableHeader":
      return <th>{children}</th>;
    case "tableCell":
      return <td>{children}</td>;
    case "hardBreak":
      return <br />;
    case "doc":
      return <>{children}</>;
    default:
      return null;
  }
}

export function TiptapContent({ document, className }: { document: TiptapDocument; className?: string }) {
  return <div className={cn("prose-memoir", className)}>{renderNodes(document.content)}</div>;
}
