import { cn } from '@/lib/utils';

interface RichTextContentProps {
  content?: string | null;
  className?: string;
}

const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;

export default function RichTextContent({ content, className = '' }: RichTextContentProps) {
  if (!content) return null;

  if (HTML_TAG_PATTERN.test(content)) {
    return (
      <div
        className={cn('rich-html-content', className)}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <div className={cn('whitespace-pre-line', className)}>
      {content}
    </div>
  );
}
