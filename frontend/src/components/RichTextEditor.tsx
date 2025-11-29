'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { useCallback, useRef, useState } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
  placeholder?: string;
}

const FONT_SIZES = [
  { label: 'Mali', value: '14px' },
  { label: 'Normalan', value: '16px' },
  { label: 'Srednji', value: '18px' },
  { label: 'Veliki', value: '20px' },
  { label: 'Veći', value: '24px' },
  { label: 'Ogroman', value: '32px' },
];

const COLORS = [
  '#000000', '#374151', '#6B7280', '#9CA3AF',
  '#DC2626', '#EA580C', '#CA8A04', '#16A34A',
  '#0891B2', '#2563EB', '#7C3AED', '#DB2777',
];

export default function RichTextEditor({
  content,
  onChange,
  onImageUpload,
  placeholder = 'Pocnite da pisete...',
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-4 cursor-move',
          draggable: 'true',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      Color,
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[300px] p-4',
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length) {
          const files = Array.from(event.dataTransfer.files);
          const images = files.filter(file => file.type.startsWith('image/'));

          if (images.length > 0) {
            event.preventDefault();
            images.forEach(file => handleImageFile(file));
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
              event.preventDefault();
              const file = item.getAsFile();
              if (file) handleImageFile(file);
              return true;
            }
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const handleImageFile = useCallback(async (file: File) => {
    if (!editor || !onImageUpload) return;

    setIsUploading(true);
    try {
      const url = await onImageUpload(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch (err) {
      console.error('Image upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  }, [editor, onImageUpload]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          handleImageFile(file);
        }
      });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Unesite URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="border-b bg-gray-50 p-2 flex flex-wrap gap-1">
        {/* Text formatting */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-gray-200 font-bold ${
              editor.isActive('bold') ? 'bg-gray-200 text-blue-600' : ''
            }`}
            title="Bold (Ctrl+B)"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-gray-200 italic ${
              editor.isActive('italic') ? 'bg-gray-200 text-blue-600' : ''
            }`}
            title="Italic (Ctrl+I)"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded hover:bg-gray-200 underline ${
              editor.isActive('underline') ? 'bg-gray-200 text-blue-600' : ''
            }`}
            title="Underline (Ctrl+U)"
          >
            U
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 rounded hover:bg-gray-200 line-through ${
              editor.isActive('strike') ? 'bg-gray-200 text-blue-600' : ''
            }`}
            title="Strikethrough"
          >
            S
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded hover:bg-gray-200 text-sm font-bold ${
              editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 text-blue-600' : ''
            }`}
            title="Naslov 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded hover:bg-gray-200 text-sm font-bold ${
              editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 text-blue-600' : ''
            }`}
            title="Naslov 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-2 rounded hover:bg-gray-200 text-sm font-bold ${
              editor.isActive('heading', { level: 3 }) ? 'bg-gray-200 text-blue-600' : ''
            }`}
            title="Naslov 3"
          >
            H3
          </button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('bulletList') ? 'bg-gray-200 text-blue-600' : ''
            }`}
            title="Lista sa tackama"
          >
            •
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('orderedList') ? 'bg-gray-200 text-blue-600' : ''
            }`}
            title="Numerisana lista"
          >
            1.
          </button>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200 text-blue-600' : ''
            }`}
            title="Levo poravnanje"
          >
            ≡
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200 text-blue-600' : ''
            }`}
            title="Centrirano"
          >
            ≡
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200 text-blue-600' : ''
            }`}
            title="Desno poravnanje"
          >
            ≡
          </button>
        </div>

        {/* Colors */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2 relative">
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-2 rounded hover:bg-gray-200 flex items-center gap-1"
            title="Boja teksta"
          >
            <span className="w-4 h-4 rounded border" style={{ backgroundColor: editor.getAttributes('textStyle').color || '#000' }}></span>
            A
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white border rounded-lg shadow-lg z-10 grid grid-cols-4 gap-1">
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    editor.chain().focus().setColor(color).run();
                    setShowColorPicker(false);
                  }}
                  className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('highlight') ? 'bg-yellow-200 text-blue-600' : ''
            }`}
            title="Oznaci tekst"
          >
            <span className="bg-yellow-200 px-1">H</span>
          </button>
        </div>

        {/* Link & Image */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={addLink}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('link') ? 'bg-gray-200 text-blue-600' : ''
            }`}
            title="Dodaj link"
          >
            🔗
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"
            title="Dodaj sliku"
          >
            {isUploading ? '⏳' : '🖼️'}
          </button>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1 ml-auto border-l pl-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-2 rounded hover:bg-gray-200 disabled:opacity-30"
            title="Undo (Ctrl+Z)"
          >
            ↩️
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-2 rounded hover:bg-gray-200 disabled:opacity-30"
            title="Redo (Ctrl+Y)"
          >
            ↪️
          </button>
        </div>
      </div>

      {/* Editor */}
      <div
        className={`relative ${dragOver ? 'bg-blue-50' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {dragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-50/90 z-10 border-2 border-dashed border-blue-400 rounded-lg m-2">
            <div className="text-center">
              <span className="text-4xl">📷</span>
              <p className="text-blue-600 font-medium mt-2">Pustite sliku ovde</p>
            </div>
          </div>
        )}
        <EditorContent editor={editor} />
      </div>

      {/* Help text */}
      <div className="border-t bg-gray-50 px-4 py-2 text-xs text-gray-500">
        <span>💡 Drag & drop slike direktno u editor ili kopiraj/zalepi slike • Ctrl+B za bold • Ctrl+I za italic</span>
      </div>
    </div>
  );
}
