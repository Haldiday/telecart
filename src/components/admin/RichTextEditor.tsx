import React, { useState, useRef, useEffect } from 'react';
import { 
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Link, Palette, Type, Quote, Code, Undo, Redo,
  Subscript, Superscript, Indent, Outdent, Table
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

function RichTextEditor({ value, onChange, placeholder = '', className = '' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isFocusedRef = useRef(false);
  const isMountedRef = useRef(true);
  const isUpdatingRef = useRef(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right' | 'justify'>('left');
  const [fontSize, setFontSize] = useState('16px');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [textColor, setTextColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  const fontSizes = ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px'];
  const fontFamilies = [
    'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
    'Comic Sans MS', 'Impact', 'Lucida Console', 'Tahoma', 'Trebuchet MS'
  ];

  // Sync innerHTML with value prop - only update when not focused and not currently updating
  useEffect(() => {
    if (!isMountedRef.current || isFocusedRef.current || isUpdatingRef.current) return;

    const updateInnerHTML = () => {
      if (editorRef.current && isMountedRef.current && !isFocusedRef.current && !isUpdatingRef.current) {
        isUpdatingRef.current = true;
        editorRef.current.innerHTML = value || '';
        // Reset flag after a short delay
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
    };

    requestAnimationFrame(updateInnerHTML);

    return () => {
      isMountedRef.current = false;
    };
  }, [value]);

  const updateContent = () => {
    if (editorRef.current && isMountedRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
      updateToolbarState();
    }
  };

  const updateToolbarState = () => {
    if (editorRef.current) {
      setIsBold(document.queryCommandState('bold'));
      setIsItalic(document.queryCommandState('italic'));
      setIsUnderline(document.queryCommandState('underline'));
      setIsStrikethrough(document.queryCommandState('strikeThrough'));
      
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const parentElement = range.commonAncestorContainer?.parentElement;
        if (parentElement) {
          const computedStyle = window.getComputedStyle(parentElement);
          setAlignment(computedStyle.textAlign as 'left' | 'center' | 'right' | 'justify');
        }
      }
    }
  };

  const handleFormat = (command: string, value?: string) => {
    try {
      document.execCommand(command, false, value);
      updateContent();
    } catch (error) {
      console.error('Command failed:', command, error);
    }
  };

  const handleTextColorChange = (color: string) => {
    setTextColor(color);
    handleFormat('foreColor', color);
    setShowTextColorPicker(false);
  };

  const handleBackgroundColorChange = (color: string) => {
    setBackgroundColor(color);
    handleFormat('backColor', color);
    setShowBgColorPicker(false);
  };

  const handleLink = () => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      setLinkText(selection.toString());
      setLinkUrl('');
      setShowLinkDialog(true);
    }
  };

  const insertLink = () => {
    if (linkUrl && linkText) {
      handleFormat('createLink', linkUrl);
      setShowLinkDialog(false);
      setLinkUrl('');
      setLinkText('');
    }
  };

  const insertList = (ordered: boolean) => {
    handleFormat(ordered ? 'insertOrderedList' : 'insertUnorderedList');
  };

  const insertTable = () => {
    const rows = prompt('Number of rows:', '3');
    const cols = prompt('Number of columns:', '3');
    if (rows && cols) {
      const tableHtml = `<table border="1"><tbody>${Array(parseInt(rows)).fill('').map(() => 
        `<tr>${Array(parseInt(cols)).fill('').map(() => '<td>&nbsp;</td>').join('')}</tr>`
      ).join('')}</tbody></table>`;
      handleFormat('insertHTML', tableHtml);
    }
  };

  return (
    <div className={`border border-border rounded-lg ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-muted/50">
        {/* Text Formatting */}
        <button
          type="button"
          onClick={() => handleFormat('bold')}
          className={`p-2 rounded hover:bg-muted ${isBold ? 'bg-muted' : ''}`}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        
        <button
          type="button"
          onClick={() => handleFormat('italic')}
          className={`p-2 rounded hover:bg-muted ${isItalic ? 'bg-muted' : ''}`}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>
        
        <button
          type="button"
          onClick={() => handleFormat('underline')}
          className={`p-2 rounded hover:bg-muted ${isUnderline ? 'bg-muted' : ''}`}
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </button>
        
        <button
          type="button"
          onClick={() => handleFormat('strikeThrough')}
          className={`p-2 rounded hover:bg-muted ${isStrikethrough ? 'bg-muted' : ''}`}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </button>
        
        <div className="w-px h-6 bg-border" />
        
        {/* Font Family */}
        <select
          value={fontFamily}
          onChange={(e) => {
            setFontFamily(e.target.value);
            handleFormat('fontName', e.target.value);
          }}
          className="px-2 py-1 text-sm border border-border rounded"
          title="Font Family"
        >
          {fontFamilies.map(font => (
            <option key={font} value={font}>{font}</option>
          ))}
        </select>
        
        {/* Font Size */}
        <select
          value={fontSize}
          onChange={(e) => {
            setFontSize(e.target.value);
            handleFormat('fontSize', e.target.value);
          }}
          className="px-2 py-1 text-sm border border-border rounded"
          title="Font Size"
        >
          {fontSizes.map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
        
        <div className="w-px h-6 bg-border" />
        
        {/* Text Color */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTextColorPicker(!showTextColorPicker)}
            className="p-2 rounded hover:bg-muted"
            title="Text Color"
          >
            <Palette className="h-4 w-4" />
          </button>
          
          {showTextColorPicker && (
            <div className="absolute top-full left-0 z-10 mt-1 p-2 bg-background border border-border rounded-lg shadow-lg">
              <input
                type="color"
                value={textColor}
                onChange={(e) => handleTextColorChange(e.target.value)}
                className="w-20 h-8 border border-border rounded"
              />
              <div className="mt-2 flex flex-wrap gap-1">
                {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500'].map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleTextColorChange(color)}
                    className="w-6 h-6 border border-border rounded"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Background Color */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowBgColorPicker(!showBgColorPicker)}
            className="p-2 rounded hover:bg-muted"
            title="Background Color"
          >
            <div className="w-4 h-4 border border-border rounded" style={{ backgroundColor }} />
          </button>
          
          {showBgColorPicker && (
            <div className="absolute top-full left-0 z-10 mt-1 p-2 bg-background border border-border rounded-lg shadow-lg">
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => handleBackgroundColorChange(e.target.value)}
                className="w-20 h-8 border border-border rounded"
              />
              <div className="mt-2 flex flex-wrap gap-1">
                {['#ffffff', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ff0000', '#ffa500'].map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleBackgroundColorChange(color)}
                    className="w-6 h-6 border border-border rounded"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="w-px h-6 bg-border" />
        
        {/* Alignment */}
        <button
          type="button"
          onClick={() => { 
            setAlignment('left'); 
            handleFormat('justifyLeft');
          }}
          className={`p-2 rounded hover:bg-muted ${alignment === 'left' ? 'bg-muted' : ''}`}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </button>
        
        <button
          type="button"
          onClick={() => { 
            setAlignment('center'); 
            handleFormat('justifyCenter');
          }}
          className={`p-2 rounded hover:bg-muted ${alignment === 'center' ? 'bg-muted' : ''}`}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </button>
        
        <button
          type="button"
          onClick={() => { 
            setAlignment('right'); 
            handleFormat('justifyRight');
          }}
          className={`p-2 rounded hover:bg-muted ${alignment === 'right' ? 'bg-muted' : ''}`}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </button>
        
        <button
          type="button"
          onClick={() => { 
            setAlignment('justify'); 
            handleFormat('justifyFull');
          }}
          className={`p-2 rounded hover:bg-muted ${alignment === 'justify' ? 'bg-muted' : ''}`}
          title="Justify"
        >
          <AlignJustify className="h-4 w-4" />
        </button>
        
        <div className="w-px h-6 bg-border" />
        
        {/* Lists */}
        <button
          type="button"
          onClick={() => insertList(false)}
          className="p-2 rounded hover:bg-muted"
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>
        
        <button
          type="button"
          onClick={() => insertList(true)}
          className="p-2 rounded hover:bg-muted"
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        
        <div className="w-px h-6 bg-border" />
        
        {/* Special Elements */}
        <button
          type="button"
          onClick={() => handleFormat('formatBlock', '<blockquote>')}
          className="p-2 rounded hover:bg-muted"
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </button>
        
        <button
          type="button"
          onClick={() => handleFormat('formatBlock', '<pre>')}
          className="p-2 rounded hover:bg-muted"
          title="Code"
        >
          <Code className="h-4 w-4" />
        </button>
        
        <button
          type="button"
          onClick={() => handleFormat('subscript')}
          className="p-2 rounded hover:bg-muted"
          title="Subscript"
        >
          <Subscript className="h-4 w-4" />
        </button>
        
        <button
          type="button"
          onClick={() => handleFormat('superscript')}
          className="p-2 rounded hover:bg-muted"
          title="Superscript"
        >
          <Superscript className="h-4 w-4" />
        </button>
        
        <div className="w-px h-6 bg-border" />
        
        {/* Insert Elements */}
        <button
          type="button"
          onClick={handleLink}
          className="p-2 rounded hover:bg-muted"
          title="Insert Link"
        >
          <Link className="h-4 w-4" />
        </button>
        
        <button
          type="button"
          onClick={insertTable}
          className="p-2 rounded hover:bg-muted"
          title="Insert Table"
        >
          <Table className="h-4 w-4" />
        </button>
      </div>
      
      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={true}
        className="min-h-[120px] p-4 focus:outline-none"
        style={{ fontSize, fontFamily }}
        onInput={updateContent}
        onMouseUp={updateToolbarState}
        onKeyUp={updateToolbarState}
        onFocus={() => { isFocusedRef.current = true; }}
        onBlur={() => { isFocusedRef.current = false; }}
        onPaste={(e) => {
          if (!isMountedRef.current) return;
          // Let the browser handle paste naturally to avoid DOM conflicts
          // updateContent will be called via onInput after paste
        }}
        onCopy={() => {
          if (!isMountedRef.current) return;
          setTimeout(updateToolbarState, 10);
        }}
        onCut={() => {
          if (!isMountedRef.current) return;
          setTimeout(updateToolbarState, 10);
        }}
        suppressContentEditableWarning={true}
      >
        {(!value || value === '<br>') && <span style={{ color: '#94a3b8', pointerEvents: 'none' }}>{placeholder}</span>}
      </div>
      
      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background border border-border rounded-lg p-6 shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Insert Link</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Link Text</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md"
                  placeholder="Link text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">URL</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md"
                  placeholder="https://example.com"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowLinkDialog(false)}
                  className="px-4 py-2 text-muted-foreground hover:bg-muted rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={insertLink}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Insert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const MemoizedRichTextEditor = React.memo(RichTextEditor);
export default MemoizedRichTextEditor;
