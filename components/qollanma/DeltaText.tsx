import type { ReactNode } from 'react';
import type { DeltaContent, DeltaOp } from '@/lib/guideCourse';

function renderOp(op: DeltaOp, index: number) {
  const text = op.insert;
  if (!text || text === '\n') return null;

  const attrs = op.attributes ?? {};
  let node: ReactNode = text;

  if (attrs.link) {
    node = (
      <a
        key={index}
        href={attrs.link}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 underline underline-offset-2 hover:text-blue-300"
      >
        {text}
      </a>
    );
  }

  if (attrs.bold) node = <strong key={index}>{node}</strong>;
  if (attrs.italic) node = <em key={index}>{node}</em>;
  if (attrs.underline) node = <u key={index}>{node}</u>;

  if (attrs.header === 1) {
    return (
      <h2 key={index} className="mb-2 mt-4 text-lg font-bold text-white first:mt-0">
        {text.trim()}
      </h2>
    );
  }
  if (attrs.header === 2) {
    return (
      <h3 key={index} className="mb-2 mt-3 text-base font-bold text-white first:mt-0">
        {text.trim()}
      </h3>
    );
  }
  if (attrs.header === 3) {
    return (
      <h4 key={index} className="mb-1.5 mt-2 text-sm font-bold text-slate-200 first:mt-0">
        {text.trim()}
      </h4>
    );
  }

  if (attrs.list === 'ordered' || attrs.list === 'bullet') {
    return (
      <li key={index} className="text-sm leading-relaxed text-slate-300">
        {node}
      </li>
    );
  }

  if (text.endsWith('\n')) {
    return (
      <span key={index}>
        {typeof node === 'string' ? text.replace(/\n$/, '') : node}
        <br />
      </span>
    );
  }

  return <span key={index}>{node}</span>;
}

interface DeltaTextProps {
  delta: DeltaContent;
  className?: string;
}

export default function DeltaText({ delta, className }: DeltaTextProps) {
  const elements: ReactNode[] = [];
  let listBuffer: { type: 'ordered' | 'bullet'; items: ReactNode[] } | null = null;

  const flushList = () => {
    if (!listBuffer) return;
    const ListTag = listBuffer.type === 'ordered' ? 'ol' : 'ul';
    elements.push(
      <ListTag
        key={`list-${elements.length}`}
        className={`mb-3 space-y-1 pl-5 text-sm ${
          listBuffer.type === 'ordered' ? 'list-decimal' : 'list-disc'
        }`}
      >
        {listBuffer.items}
      </ListTag>
    );
    listBuffer = null;
  };

  delta.ops.forEach((op, index) => {
    const listType = op.attributes?.list;
    if (listType === 'ordered' || listType === 'bullet') {
      if (!listBuffer || listBuffer.type !== listType) {
        flushList();
        listBuffer = { type: listType, items: [] };
      }
      const item = renderOp(op, index);
      if (item) listBuffer.items.push(item);
      return;
    }

    flushList();
    const rendered = renderOp(op, index);
    if (rendered) elements.push(rendered);
  });

  flushList();

  return <div className={className}>{elements}</div>;
}
