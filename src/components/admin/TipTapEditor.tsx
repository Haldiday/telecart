import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import { Extension } from '@tiptap/core';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link,
  Quote,
  Undo,
  Redo,
} from 'lucide-react';

const FONT_FAMILIES = [
  'Arial',
  'Times New Roman',
  'Georgia',
  'Courier New',
  'Verdana',
  'Comic Sans MS',
] as const;

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px'] as const;

const DEFAULT_FONT_FAMILY = 'Arial';
const DEFAULT_FONT_SIZE = '16px';

const parseFontFamily = (value: string | null | undefined) => {
  if (!value) return null;
  return value.split(',')[0]?.trim().replace(/^["']|["']$/g, '') || null;
};

const normalizeFontFamily = (value: string | null | undefined) => {
  const parsed = parseFontFamily(value);
  if (!parsed) return DEFAULT_FONT_FAMILY;
  const match = FONT_FAMILIES.find((font) => font.toLowerCase() === parsed.toLowerCase());
  return match ?? parsed;
};

const normalizeFontSize = (value: string | null | undefined) => {
  if (!value) return DEFAULT_FONT_SIZE;
  return FONT_SIZES.includes(value as (typeof FONT_SIZES)[number]) ? value : value;
};

// Custom Font Size extension
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle', 'listItem'],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize?.replace(/['"]+/g, '') || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize) =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
        },
    };
  },
});

// Custom Color and Font Family inheritance for List Items
const ListItemInheritance = Extension.create({
  name: 'listItemInheritance',
  addGlobalAttributes() {
    return [
      {
        types: ['listItem'],
        attributes: {
          color: {
            default: null,
            parseHTML: element => element.style.color,
            renderHTML: attributes => {
              if (!attributes.color) return {};
              return { style: `color: ${attributes.color}` };
            },
          },
          fontFamily: {
            default: null,
            parseHTML: element => element.style.fontFamily?.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontFamily) return {};
              return { style: `font-family: ${attributes.fontFamily}` };
            },
          },
          fontWeight: {
            default: null,
            parseHTML: element => element.style.fontWeight,
            renderHTML: attributes => {
              if (!attributes.fontWeight) return {};
              return { style: `font-weight: ${attributes.fontWeight}` };
            },
          },
        },
      },
    ];
  },
});

// Custom Font Family extension
const FontFamily = Extension.create({
  name: 'fontFamily',
  addOptions() {
    return {
      types: ['textStyle', 'listItem'],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontFamily: {
            default: null,
            parseHTML: (element) => parseFontFamily(element.style.fontFamily),
            renderHTML: (attributes) => {
              if (!attributes.fontFamily) {
                return {};
              }
              return {
                style: `font-family: ${attributes.fontFamily}`,
              };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontFamily:
        (fontFamily) =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontFamily }).run();
        },
      unsetFontFamily:
        () =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontFamily: null }).removeEmptyTextStyle().run();
        },
    };
  },
});

/** Avoid Tailwind `prose` in the editor — it overrides blockquote/list visuals. */
const EDITOR_CONTENT_CLASS =
  'tiptap-editor-content max-w-none focus:outline-none min-h-[100px] px-3 py-2 ' +
  '[&_p]:my-3 [&_p]:min-h-[1.5em] [&_h1]:my-3 [&_h2]:my-3 [&_h3]:my-3 [&_h4]:my-3 [&_h5]:my-3 [&_h6]:my-3 ' +
  '[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1';

const BLOCKQUOTE_INLINE_STYLE =
  'border-left:4px solid #1a73c7;background-color:#e8f2fc;padding:12px 16px;margin:16px 0;font-style:italic;display:block;';

/** Prevent toolbar clicks from stealing focus/selection before commands run. */
const preventToolbarBlur = (event: React.MouseEvent) => {
  event.preventDefault();
};

interface TipTapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

function getToolbarState(editor: Editor) {
  const textStyle = editor.getAttributes('textStyle');
  return {
    fontFamily: normalizeFontFamily(textStyle.fontFamily),
    fontSize: normalizeFontSize(textStyle.fontSize),
    isBold: editor.isActive('bold'),
    isItalic: editor.isActive('italic'),
    isUnderline: editor.isActive('underline'),
    isStrike: editor.isActive('strike'),
    isBulletList: editor.isActive('bulletList'),
    isOrderedList: editor.isActive('orderedList'),
    isBlockquote: editor.isActive('blockquote'),
    isLink: editor.isActive('link'),
    alignLeft: editor.isActive({ textAlign: 'left' }),
    alignCenter: editor.isActive({ textAlign: 'center' }),
    alignRight: editor.isActive({ textAlign: 'right' }),
    alignJustify: editor.isActive({ textAlign: 'justify' }),
    canUndo: editor.can().chain().focus().undo().run(),
    canRedo: editor.can().chain().focus().redo().run(),
  };
}

type SavedSelection = { from: number; to: number };

function MenuBar({ editor }: { editor: Editor }) {
  const [toolbar, setToolbar] = useState(() => getToolbarState(editor));
  const savedSelectionRef = useRef<SavedSelection | null>(null);
  const [fontControlActive, setFontControlActive] = useState(false);

  const saveSelection = useCallback(() => {
    const { from, to } = editor.state.selection;
    savedSelectionRef.current = { from, to };
  }, [editor]);

  const applyWithSavedSelection = useCallback(
    (run: (chain: ReturnType<Editor['chain']>) => ReturnType<Editor['chain']>) => {
      const saved = savedSelectionRef.current;
      let chain = editor.chain().focus();
      if (saved) {
        chain = chain.setTextSelection({ from: saved.from, to: saved.to });
      }
      run(chain).run();
      savedSelectionRef.current = null;
      setFontControlActive(false);
      setToolbar(getToolbarState(editor));
    },
    [editor],
  );

  useEffect(() => {
    const sync = () => {
      if (fontControlActive) return;
      setToolbar(getToolbarState(editor));
    };
    sync();
    editor.on('selectionUpdate', sync);
    editor.on('transaction', sync);
    return () => {
      editor.off('selectionUpdate', sync);
      editor.off('transaction', sync);
    };
  }, [editor, fontControlActive]);

  const handleFontControlPointerDown = useCallback(() => {
    saveSelection();
    setFontControlActive(true);
  }, [saveSelection]);

  const handleFontControlBlur = useCallback(() => {
    setFontControlActive(false);
    setToolbar(getToolbarState(editor));
  }, [editor]);

  const setLink = useCallback(() => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const btnClass = (active: boolean) =>
    `p-2 rounded ${active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`;

  return (
    <div className="flex flex-wrap gap-1 border-b border-input p-2 mb-2">
      <button
        type="button"
        onMouseDown={preventToolbarBlur}
        onClick={() => {
          editor.chain().focus().toggleBold().run();
          if (editor.isActive('listItem')) {
            editor.chain().focus().updateAttributes('listItem', { fontWeight: null }).run();
          }
        }}
        className={btnClass(toolbar.isBold)}
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={preventToolbarBlur}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={btnClass(toolbar.isItalic)}
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={preventToolbarBlur}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={btnClass(toolbar.isUnderline)}
        title="Underline"
      >
        <UnderlineIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={preventToolbarBlur}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={btnClass(toolbar.isStrike)}
        title="Strike"
      >
        <Strikethrough className="w-4 h-4" />
      </button>

      <div className="w-px bg-border mx-1" />

      <select
        value={toolbar.fontFamily}
        onPointerDown={handleFontControlPointerDown}
        onBlur={handleFontControlBlur}
        onChange={(e) =>
          applyWithSavedSelection((chain) =>
            chain.updateAttributes('listItem', { fontFamily: null }).setFontFamily(e.target.value),
          )
        }
        className="px-2 py-1 rounded border border-input bg-background text-sm cursor-pointer"
        title="Font Family"
      >
        {FONT_FAMILIES.map((font) => (
          <option key={font} value={font}>
            {font}
          </option>
        ))}
        {!FONT_FAMILIES.includes(toolbar.fontFamily as (typeof FONT_FAMILIES)[number]) && (
          <option value={toolbar.fontFamily}>{toolbar.fontFamily}</option>
        )}
      </select>

      <select
        value={toolbar.fontSize}
        onPointerDown={handleFontControlPointerDown}
        onBlur={handleFontControlBlur}
        onChange={(e) =>
          applyWithSavedSelection((chain) =>
            chain.updateAttributes('listItem', { fontSize: null }).setFontSize(e.target.value),
          )
        }
        className="px-2 py-1 rounded border border-input bg-background text-sm cursor-pointer"
        title="Font Size"
      >
        {FONT_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
        {!FONT_SIZES.includes(toolbar.fontSize as (typeof FONT_SIZES)[number]) && (
          <option value={toolbar.fontSize}>{toolbar.fontSize}</option>
        )}
      </select>

      <div className="w-px bg-border mx-1" />

      <button
        type="button"
        onMouseDown={preventToolbarBlur}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={btnClass(toolbar.alignLeft)}
        title="Align Left"
      >
        <AlignLeft className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={preventToolbarBlur}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={btnClass(toolbar.alignCenter)}
        title="Align Center"
      >
        <AlignCenter className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={preventToolbarBlur}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={btnClass(toolbar.alignRight)}
        title="Align Right"
      >
        <AlignRight className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={preventToolbarBlur}
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        className={btnClass(toolbar.alignJustify)}
        title="Align Justify"
      >
        <AlignJustify className="w-4 h-4" />
      </button>

      <div className="w-px bg-border mx-1" />

      <button
        type="button"
        onMouseDown={preventToolbarBlur}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btnClass(toolbar.isBulletList)}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={preventToolbarBlur}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={btnClass(toolbar.isOrderedList)}
        title="Ordered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>

      <div className="w-px bg-border mx-1" />

      <button
        type="button"
        onMouseDown={preventToolbarBlur}
        onClick={() => {
          if (editor.isActive('blockquote')) {
            editor.chain().focus().lift('blockquote').run();
          } else {
            editor.chain().focus().toggleBlockquote().run();
          }
        }}
        className={btnClass(toolbar.isBlockquote)}
        title="Quote"
      >
        <Quote className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={preventToolbarBlur}
        onClick={setLink}
        className={btnClass(toolbar.isLink)}
        title="Link"
      >
        <Link className="w-4 h-4" />
      </button>

      <div className="w-px bg-border mx-1" />

      <input
        type="color"
        onMouseDown={preventToolbarBlur}
        onChange={(e) => {
          const color = e.target.value;
          editor.chain().focus().updateAttributes('listItem', { color: null }).setColor(color).run();
        }}
        className="w-8 h-8 rounded cursor-pointer border border-input"
        title="Text Color"
      />

      <div className="w-px bg-border mx-1" />

      <button
        type="button"
        onMouseDown={preventToolbarBlur}
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!toolbar.canUndo}
        className="p-2 rounded hover:bg-muted disabled:opacity-40"
        title="Undo"
      >
        <Undo className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={preventToolbarBlur}
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!toolbar.canRedo}
        className="p-2 rounded hover:bg-muted disabled:opacity-40"
        title="Redo"
      >
        <Redo className="w-4 h-4" />
      </button>
    </div>
  );
}

const TipTapEditor: React.FC<TipTapEditorProps> = ({ value, onChange, placeholder = '', className = '' }) => {
  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          underline: false,
          blockquote: {
            HTMLAttributes: {
              class: 'rich-blockquote',
              style: BLOCKQUOTE_INLINE_STYLE,
            },
          },
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        TextStyle,
        Color,
        Underline,
        FontSize,
        FontFamily,
        ListItemInheritance,
      ],
      content: value || '',
      editorProps: {
        attributes: {
          class: EDITOR_CONTENT_CLASS,
          'data-placeholder': placeholder,
        },
      },
      onUpdate: ({ editor: ed }) => {
        onChange(ed.getHTML());
      },
    },
    [placeholder],
  );

  useEffect(() => {
    if (editor && value !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return <div className={className}>Loading editor...</div>;
  }

  return (
    <div className={`border border-input rounded-lg bg-background ${className}`}>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="tiptap-editor-root" />
    </div>
  );
};

export default React.memo(TipTapEditor);
