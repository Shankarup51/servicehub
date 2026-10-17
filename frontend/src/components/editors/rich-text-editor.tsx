"use client"

import * as React from "react"
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Undo,
  Redo,
  Link as LinkIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface RichTextEditorProps {
  value?: string
  defaultValue?: string
  onChange?: (content: string) => void
  placeholder?: string
  disabled?: boolean
  error?: boolean | string
  minHeight?: string
  className?: string
}

export function RichTextEditor({
  value = "",
  defaultValue = "",
  onChange,
  placeholder = "Write detailed description or notes here...",
  disabled = false,
  error,
  minHeight = "160px",
  className,
}: RichTextEditorProps) {
  const editorRef = React.useRef<HTMLDivElement | null>(null)
  const [internalValue, setInternalValue] = React.useState(value || defaultValue)

  React.useEffect(() => {
    if (editorRef.current && value !== undefined && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML
      setInternalValue(html)
      onChange?.(html)
    }
  }

  const executeCommand = (command: string, arg: string | undefined = undefined) => {
    if (disabled) return
    document.execCommand(command, false, arg)
    editorRef.current?.focus()
    handleInput()
  }

  const handleAddLink = () => {
    if (disabled) return
    const url = prompt("Enter URL:")
    if (url) {
      executeCommand("createLink", url)
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col w-full rounded-xl border border-input bg-card shadow-xs transition-colors overflow-hidden",
        "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
        disabled && "opacity-60 cursor-not-allowed bg-muted/40",
        error && "border-destructive focus-within:border-destructive focus-within:ring-destructive/20",
        className
      )}
    >
      {/* Editor Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-1.5 border-b border-border bg-muted/30">
        <button
          type="button"
          onClick={() => executeCommand("bold")}
          disabled={disabled}
          title="Bold (Ctrl+B)"
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
        >
          <Bold className="size-4" />
        </button>

        <button
          type="button"
          onClick={() => executeCommand("italic")}
          disabled={disabled}
          title="Italic (Ctrl+I)"
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
        >
          <Italic className="size-4" />
        </button>

        <button
          type="button"
          onClick={() => executeCommand("underline")}
          disabled={disabled}
          title="Underline (Ctrl+U)"
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
        >
          <Underline className="size-4" />
        </button>

        <div className="h-4 w-px bg-border mx-1" />

        <button
          type="button"
          onClick={() => executeCommand("formatBlock", "h2")}
          disabled={disabled}
          title="Heading 2"
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
        >
          <Heading1 className="size-4" />
        </button>

        <button
          type="button"
          onClick={() => executeCommand("formatBlock", "h3")}
          disabled={disabled}
          title="Heading 3"
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
        >
          <Heading2 className="size-4" />
        </button>

        <div className="h-4 w-px bg-border mx-1" />

        <button
          type="button"
          onClick={() => executeCommand("insertUnorderedList")}
          disabled={disabled}
          title="Bullet List"
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
        >
          <List className="size-4" />
        </button>

        <button
          type="button"
          onClick={() => executeCommand("insertOrderedList")}
          disabled={disabled}
          title="Numbered List"
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
        >
          <ListOrdered className="size-4" />
        </button>

        <button
          type="button"
          onClick={handleAddLink}
          disabled={disabled}
          title="Add Link"
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
        >
          <LinkIcon className="size-4" />
        </button>

        <div className="h-4 w-px bg-border mx-1" />

        <button
          type="button"
          onClick={() => executeCommand("undo")}
          disabled={disabled}
          title="Undo"
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
        >
          <Undo className="size-4" />
        </button>

        <button
          type="button"
          onClick={() => executeCommand("redo")}
          disabled={disabled}
          title="Redo"
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
        >
          <Redo className="size-4" />
        </button>
      </div>

      {/* Editable Area */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        style={{ minHeight }}
        data-placeholder={placeholder}
        className={cn(
          "p-4 text-sm text-foreground outline-none overflow-y-auto leading-relaxed",
          "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/60 empty:before:pointer-events-none"
        )}
      />
    </div>
  )
}
