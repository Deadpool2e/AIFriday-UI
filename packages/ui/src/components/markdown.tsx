import * as React from 'react'
import DOMPurify from 'dompurify'
import { marked } from 'marked'

import { cn } from '../lib/cn'

marked.setOptions({ breaks: true, gfm: true })

interface MarkdownProps {
  text: string
  className?: string
}

// Renders chat/assistant replies (bold, lists, tables, code) instead of
// showing raw "**"/"|" markup. Sanitized with DOMPurify since the source
// is model output, not trusted app content.
function Markdown({ text, className }: MarkdownProps) {
  const html = React.useMemo(() => {
    const raw = marked.parse(text || '', { async: false }) as string
    return DOMPurify.sanitize(raw)
  }, [text])

  return (
    <div
      className={cn(
        'prose-chat max-w-none text-sm leading-relaxed break-words',
        '[&_p]:my-1.5 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0',
        '[&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5',
        '[&_li]:my-0.5',
        '[&_strong]:font-semibold',
        '[&_code]:bg-black/10 [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em]',
        '[&_pre]:bg-black/10 [&_pre]:my-1.5 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:p-2',
        '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
        '[&_a]:underline [&_a]:underline-offset-2',
        '[&_blockquote]:border-l-2 [&_blockquote]:pl-2 [&_blockquote]:italic [&_blockquote]:opacity-80',
        '[&_table]:my-1.5 [&_table]:w-full [&_table]:border-collapse [&_table]:text-xs',
        '[&_th]:border [&_th]:border-current/20 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-semibold',
        '[&_td]:border [&_td]:border-current/20 [&_td]:px-2 [&_td]:py-1',
        '[&_hr]:my-2 [&_hr]:border-current/20',
        className,
      )}
      // Sanitized above via DOMPurify.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export { Markdown }
