"use client";

import { useEffect, useRef } from "react";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Underline,
} from "lucide-react";
import {
  blogHtmlTextLength,
  sanitizeBlogHtml,
  toEditorHtml,
} from "@/lib/blog-html";

const BODY_MAX = 20000;

type Props = {
  id?: string;
  value: string;
  onChange: (html: string) => void;
  resetKey?: string | number;
};

function run(command: string, value?: string) {
  document.execCommand(command, false, value);
}

export function BlogBodyEditor({ id = "blog-body", value, onChange, resetKey }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = toEditorHtml(value);
  }, [resetKey]);

  function emit() {
    onChange(sanitizeBlogHtml(ref.current?.innerHTML || ""));
  }

  function format(command: string, arg?: string) {
    ref.current?.focus();
    run(command, arg);
    emit();
  }

  function addLink() {
    const url = window.prompt("Link URL", "https://");
    if (!url) return;
    if (!/^https?:\/\//i.test(url) && !url.startsWith("/")) {
      window.alert("Use an http, https, or site path link.");
      return;
    }
    format("createLink", url);
  }

  const textLength = blogHtmlTextLength(value);

  return (
    <div className="blog-rich-editor">
      <div className="blog-rich-toolbar" role="toolbar" aria-label="Story formatting">
        <button type="button" onClick={() => format("bold")} aria-label="Bold">
          <Bold size={15} />
        </button>
        <button type="button" onClick={() => format("italic")} aria-label="Italic">
          <Italic size={15} />
        </button>
        <button
          type="button"
          onClick={() => format("underline")}
          aria-label="Underline"
        >
          <Underline size={15} />
        </button>
        <span className="blog-rich-sep" />
        <button
          type="button"
          onClick={() => format("formatBlock", "h2")}
          aria-label="Heading"
        >
          <Heading2 size={15} />
        </button>
        <button
          type="button"
          onClick={() => format("formatBlock", "h3")}
          aria-label="Subheading"
        >
          <Heading3 size={15} />
        </button>
        <span className="blog-rich-sep" />
        <button
          type="button"
          onClick={() => format("insertUnorderedList")}
          aria-label="Bullet list"
        >
          <List size={15} />
        </button>
        <button
          type="button"
          onClick={() => format("insertOrderedList")}
          aria-label="Numbered list"
        >
          <ListOrdered size={15} />
        </button>
        <button type="button" onClick={addLink} aria-label="Link">
          <Link2 size={15} />
        </button>
      </div>
      <div
        id={id}
        ref={ref}
        className="blog-body blog-rich-surface"
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label="Story"
        data-placeholder="Write the story. Use the toolbar for headings, lists and links."
        onInput={emit}
        onBlur={emit}
        suppressContentEditableWarning
      />
      <p className="blog-rich-count">
        {textLength} characters · max {BODY_MAX.toLocaleString("en-IN")}
      </p>
    </div>
  );
}
