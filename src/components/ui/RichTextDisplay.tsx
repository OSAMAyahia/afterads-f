import React from 'react';
import { buildImageUrl } from '../../config/api';

type ImageItem = {
  url: string;
  orientation?: 'horizontal' | 'vertical';
};

type ContentBlock = {
  text?: string;
  images?: ImageItem[];
};

interface RichTextDisplayProps {
  content: string | ContentBlock[];
  className?: string;
}

const sanitizeHtml = (html: string): string => {
  const container = document.createElement('div');
  container.innerHTML = html || '';
  container.querySelectorAll('script,style,iframe,link').forEach(n => n.remove());
  const allowed = new Set(['p','h1','h2','h3','ul','ol','li','blockquote','pre','code','a','img','div','span','br','strong','em','u']);
  const walk = (node: Node) => {
    if (node.nodeType === 1) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      if (!allowed.has(tag)) {
        const parent = el.parentNode;
        if (parent) {
          while (el.firstChild) parent.insertBefore(el.firstChild, el);
          parent.removeChild(el);
          return;
        }
      } else {
        Array.from(el.attributes).forEach(attr => {
          const n = attr.name.toLowerCase();
          if (n === 'style' || n.startsWith('on')) el.removeAttribute(attr.name);
          if (n === 'class') el.removeAttribute('class');
        });
        if (tag === 'a') {
          el.setAttribute('rel', 'noopener noreferrer');
        }
        if (tag === 'img') {
          if (!el.getAttribute('alt')) el.setAttribute('alt', '');
          el.removeAttribute('onerror');
        }
      }
    }
    Array.from(node.childNodes).forEach(walk);
  };
  walk(container);
  return container.innerHTML;
};

const RichTextDisplay: React.FC<RichTextDisplayProps> = ({ content, className = '' }) => {
  const isBlocks = Array.isArray(content);

  if (!isBlocks) {
    return (
      <div
        className={`rich-text-content prose prose-invert max-w-none text-white ${className}`}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml((content as string) || '') }}
      />
    );
  }

  return (
    <div className={`rich-text-content prose prose-invert max-w-none text-white ${className}`}>
      {(content as ContentBlock[]).map((block, idx) => (
        <div key={idx}>
          {block.text && (
            <div
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.text) }}
            />
          )}
          {block.images && block.images.length > 0 && (
            <div>
              {block.images.map((img, i) => (
                <img
                  key={i}
                  src={buildImageUrl(img.url)}
                  alt=""
                  loading="lazy"
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default RichTextDisplay;
