import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading,
  FontFamily,
  FontSize,
  FontColor,
  FontBackgroundColor,
  Alignment,
  List,
  ListProperties,
  Link,
  BlockQuote,
  Code,
  CodeBlock,
  Image,
  ImageUpload,
  ImageInsert,
  ImageResize,
  AutoImage,
  Table,
  TableToolbar,
  TableProperties,
  TableCellProperties,
  GeneralHtmlSupport,
  HtmlEmbed,
  PasteFromOffice,
  AutoLink,
  SourceEditing,
  RemoveFormat,
  HorizontalLine,
} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';
import 'ckeditor5-premium-features/ckeditor5-premium-features.css';
import React, { useRef, useEffect, useState } from 'react';

interface CKEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const CKEditorComponent: React.FC<CKEditorProps> = ({
  value,
  onChange,
  placeholder = '',
  className = '',
}) => {
  const editorRef = useRef<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  if (!isMounted) {
    return (
      <div className={`border border-input rounded-lg bg-background ${className} min-h-[200px] flex items-center justify-center`}>
        <div className="animate-pulse text-muted-foreground">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className={`border border-input rounded-lg bg-background min-h-[200px] ${className}`}>
      <CKEditor
        editor={ClassicEditor}
        data={value || '<p></p>'}
        config={{
          licenseKey: 'GPL',
          plugins: [
            Essentials,
            Paragraph,
            Bold,
            Italic,
            Underline,
            Strikethrough,
            Heading,
            FontFamily,
            FontSize,
            FontColor,
            FontBackgroundColor,
            Alignment,
            List,
            ListProperties,
            Link,
            AutoLink,
            BlockQuote,
            Code,
            CodeBlock,
            Image,
            ImageUpload,
            ImageInsert,
            ImageResize,
            AutoImage,
            Table,
            TableToolbar,
            TableProperties,
            TableCellProperties,
            GeneralHtmlSupport,
            HtmlEmbed,
            PasteFromOffice,
            SourceEditing,
            RemoveFormat,
            HorizontalLine,
          ],
          toolbar: [
            'undo',
            'redo',
            '|',
            'heading',
            '|',
            'bold',
            'italic',
            'underline',
            'strikethrough',
            'removeFormat',
            '|',
            'fontFamily',
            'fontSize',
            'fontColor',
            'fontBackgroundColor',
            '|',
            'alignment',
            '|',
            'bulletedList',
            'numberedList',
            '|',
            'link',
            'insertImage',
            'blockQuote',
            'codeBlock',
            'insertTable',
            'horizontalLine',
            '|',
            'sourceEditing',
          ],
          heading: {
            options: [
              { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
              { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
              { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
              { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
              { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
              { model: 'heading5', view: 'h5', title: 'Heading 5', class: 'ck-heading_heading5' },
              { model: 'heading6', view: 'h6', title: 'Heading 6', class: 'ck-heading_heading6' },
            ],
          },
          fontFamily: {
            supportAllValues: true,
            options: [
              'default',
              'Arial, Helvetica, sans-serif',
              'Courier New, Courier, monospace',
              'Georgia, serif',
              'Lucida Sans Unicode, Lucida Grande, sans-serif',
              'Tahoma, Geneva, sans-serif',
              'Times New Roman, Times, serif',
              'Trebuchet MS, Helvetica, sans-serif',
              'Verdana, Geneva, sans-serif',
            ],
          },
          fontSize: {
            options: [
              { title: '12px', model: '12px' },
              { title: '14px', model: '14px' },
              { title: '16px', model: '16px' },
              { title: '18px', model: '18px' },
              { title: '20px', model: '20px' },
              { title: '24px', model: '24px' },
              { title: '28px', model: '28px' },
              { title: '32px', model: '32px' },
              { title: '36px', model: '36px' },
              { title: '48px', model: '48px' },
            ],
            supportAllValues: true,
          },
          fontColor: {
            colors: [
              { color: '#000000', label: 'Black' },
              { color: '#ffffff', label: 'White' },
              { color: '#ff0000', label: 'Red' },
              { color: '#00ff00', label: 'Green' },
              { color: '#0000ff', label: 'Blue' },
              { color: '#ffff00', label: 'Yellow' },
              { color: '#ff00ff', label: 'Magenta' },
              { color: '#00ffff', label: 'Cyan' },
            ],
          },
          fontBackgroundColor: {
            colors: [
              { color: '#000000', label: 'Black' },
              { color: '#ffffff', label: 'White' },
              { color: '#ff0000', label: 'Red' },
              { color: '#00ff00', label: 'Green' },
              { color: '#0000ff', label: 'Blue' },
              { color: '#ffff00', label: 'Yellow' },
              { color: '#ff00ff', label: 'Magenta' },
              { color: '#00ffff', label: 'Cyan' },
            ],
          },
          alignment: {
            options: ['left', 'center', 'right', 'justify'],
          },
          list: {
            properties: {
              styles: true,
              startIndex: true,
              reversed: true,
            },
          },
          link: {
            addTargetToExternalLinks: true,
            defaultProtocol: 'https://',
          },
          image: {
            toolbar: [
              'imageTextAlternative',
              '|',
              'imageStyle:inline',
              'imageStyle:block',
              'imageStyle:wrapText',
              '|',
              'resizeImage',
            ],
          },
          table: {
            contentToolbar: [
              'tableColumn',
              'tableRow',
              'mergeTableCells',
              'tableProperties',
              'tableCellProperties',
            ],
          },
          htmlSupport: {
            allow: [
              {
                name: /.*/,
                attributes: true,
                classes: true,
                styles: true,
              },
            ],
          },
          placeholder: placeholder || 'Start typing...',
        }}
        onChange={(_event, editor) => {
          const data = editor.getData();
          onChange(data);
        }}
        onReady={(editor) => {
          editorRef.current = editor;
        }}
      />
    </div>
  );
};

export default React.memo(CKEditorComponent);
