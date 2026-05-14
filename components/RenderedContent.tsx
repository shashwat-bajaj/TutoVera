'use client';

import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

type RenderedContentProps = {
  content: string;
};

const markdownComponents: Components = {
  table({ children }) {
    return (
      <div className="markdownTableWrap">
        <table>{children}</table>
      </div>
    );
  },
  th({ children }) {
    return <th>{children}</th>;
  },
  td({ children }) {
    return <td>{children}</td>;
  },
  a({ children, href }) {
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }
};

export default function RenderedContent({ content }: RenderedContentProps) {
  return (
    <div className="renderedContent formatted-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
        rehypePlugins={[rehypeKatex]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}