'use client';

import React from 'react';

interface TextBubbleProps {
  text?: string;
  isOutgoing?: boolean;
}

export function TextBubble({ text }: TextBubbleProps) {
  if (!text) return null;

  // Basic URL regex parser to convert links to clickable <a> tags
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return (
    <div className="text-[14.2px] leading-[19px] whitespace-pre-wrap break-words select-text">
      {parts.map((part, i) => {
        if (part.match(urlRegex)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#53bdeb] underline hover:text-[#70cbfa] break-all"
            >
              {part}
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}
