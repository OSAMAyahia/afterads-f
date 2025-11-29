import React, { useState, useRef, useEffect } from 'react';
import { apiCall, API_ENDPOINTS, buildImageUrl } from '../../../../config/api';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Code,
  Image,
  Lightbulb,
  AlertTriangle,
  Link,
  Heading1,
  Heading2,
  Heading3,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  minHeight?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'اكتب هنا...',
  label,
  required = false,
  minHeight = '300px'
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [textDirection, setTextDirection] = useState<'rtl' | 'ltr'>('rtl');
  const [imageOrientation, setImageOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const imageInputRef = useRef<HTMLInputElement>(null);

  const toggleDirection = () => {
    setTextDirection(prev => prev === 'rtl' ? 'ltr' : 'rtl');
    if (editorRef.current) {
      editorRef.current.style.direction = textDirection === 'rtl' ? 'ltr' : 'rtl';
      editorRef.current.focus();
    }
  };

  const saveSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const insertHtmlAtCursor = (html: string) => {
    const selection = window.getSelection();
    let range: Range | null = null;
    if (selection && selection.rangeCount > 0) {
      const potential = selection.getRangeAt(0);
      if (editorRef.current && editorRef.current.contains(potential.commonAncestorContainer)) {
        range = potential;
      }
    }

    if (!range) {
      range = savedRangeRef.current;
    }

    if (!range || !editorRef.current) {
      if (editorRef.current) {
        editorRef.current.insertAdjacentHTML('beforeend', html);
        handleContentChange();
      }
      return;
    }

    range.deleteContents();

    const div = document.createElement('div');
    div.innerHTML = html;
    const frag = document.createDocumentFragment();
    let lastNode: ChildNode | null = null;
    while (div.firstChild) {
      lastNode = frag.appendChild(div.firstChild);
    }
    range.insertNode(frag);

    if (lastNode) {
      range.setStartAfter(lastNode);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
      savedRangeRef.current = range.cloneRange();
    }

    handleContentChange();
  };

  const getCurrentTextElement = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    let el: Element | null = range.startContainer instanceof Element ? range.startContainer : (range.startContainer as any)?.parentElement || null;
    const isTextEl = (e: Element | null) => {
      if (!e) return false;
      const t = (e.tagName || '').toLowerCase();
      return ['p','h1','h2','h3','blockquote','pre','li','div'].includes(t) && !(e as HTMLElement).classList.contains('image-container');
    };
    while (el && editorRef.current && el !== editorRef.current && !isTextEl(el)) {
      el = el.parentElement;
    }
    return isTextEl(el) ? (el as HTMLElement) : null;
  };

  // تطبيق الاتجاه على الصور الموجودة
  const applyOrientationToImages = (orientation: 'horizontal' | 'vertical') => {
    if (!editorRef.current) return;
    const images = editorRef.current.querySelectorAll('.image-container');
    images.forEach(img => {
      img.setAttribute('data-orientation', orientation);
    });
    handleContentChange();
  };

  const getCurrentImageContainer = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    let el: Element | null = range.startContainer instanceof Element ? range.startContainer : (range.startContainer as any)?.parentElement || null;
    while (el && editorRef.current && el !== editorRef.current) {
      const he = el as HTMLElement;
      if (he.classList && he.classList.contains('image-container')) return he;
      el = el.parentElement;
    }
    return null;
  };

  const applyOrientationToCurrentGroup = (orientation: 'horizontal' | 'vertical') => {
    const target = getCurrentImageContainer();
    const anchor = getCurrentTextElement();
    const containers: HTMLElement[] = [];
    if (target) {
      containers.push(target);
    } else if (anchor && editorRef.current) {
      let next = anchor.nextElementSibling as HTMLElement | null;
      while (next && next.classList.contains('image-container')) {
        containers.push(next);
        next = next.nextElementSibling as HTMLElement | null;
      }
    }
    if (containers.length === 0 && editorRef.current) {
      const all = editorRef.current.querySelectorAll('.image-container');
      all.forEach(el => containers.push(el as HTMLElement));
    }
    containers.forEach(el => el.setAttribute('data-orientation', orientation));
    handleContentChange();
  };

  const insertImageAtCursor = (url: string, orientation: 'horizontal' | 'vertical', rawPath?: string) => {
    const imageClass = orientation === 'vertical' 
      ? 'w-64 h-auto' 
      : 'w-36 h-auto';
    
    const html = `
      <div class="image-container my-4" contenteditable="false" data-orientation="${orientation}">
        <img src="${url}" alt="صورة" ${rawPath ? `data-src-path="${rawPath}"` : ''} class="${imageClass} rounded-lg shadow-md mx-auto" />
        <button type="button" class="delete-img-btn" onclick="this.parentElement.remove(); document.dispatchEvent(new Event('contentChanged'));">×</button>
      </div>
      <p><br></p>
    `;
    insertHtmlAtCursor(html);
  };

  const handleUploadImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    try {
      const fd = new FormData();
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        fd.append('images', file);
      }

      const resp = await apiCall(API_ENDPOINTS.UPLOAD_ATTACHMENTS, { method: 'POST', body: fd });
      const urls: string[] = [];
      if (resp?.imagePaths && Array.isArray(resp.imagePaths)) {
        resp.imagePaths.forEach((p: string) => urls.push(buildImageUrl(p)));
      } else if (resp?.data?.imagePaths && Array.isArray(resp.data.imagePaths)) {
        resp.data.imagePaths.forEach((p: string) => urls.push(buildImageUrl(p)));
      } else if (resp?.data?.urls && Array.isArray(resp.data.urls)) {
        resp.data.urls.forEach((p: string) => urls.push(buildImageUrl(p)));
      } else if (resp?.urls && Array.isArray(resp.urls)) {
        resp.urls.forEach((p: string) => urls.push(buildImageUrl(p)));
      } else if (resp?.url) {
        urls.push(buildImageUrl(resp.url));
      }

      if (urls.length > 0) {
        const imgSizeClass = imageOrientation === 'horizontal' ? 'w-36 h-auto' : 'w-64 h-auto';
        const html = urls.map(u => `
          <div class="image-container my-3" contenteditable="false" data-orientation="${imageOrientation}">
            <img src="${u}" alt="صورة" class="${imgSizeClass} rounded-lg shadow-md mx-auto" />
            <button type="button" class="delete-img-btn" onclick="this.parentElement.remove(); document.dispatchEvent(new Event('contentChanged'));">×</button>
          </div>
        `).join('') + '<p><br></p>';
        const anchor = getCurrentTextElement();
        if (anchor) {
          anchor.insertAdjacentHTML('afterend', html);
        } else if (editorRef.current) {
          editorRef.current.insertAdjacentHTML('beforeend', html);
        }
        handleContentChange();
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('فشل رفع الصور، حاول مرة أخرى');
    } finally {
      e.target.value = '';
    }
  };

  const uploadAndInsertFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const fd = new FormData();
    fd.append('images', file);
    const resp = await apiCall(API_ENDPOINTS.UPLOAD_ATTACHMENTS, { method: 'POST', body: fd });
    let uploadedUrl = '';
    if (resp?.imagePaths && Array.isArray(resp.imagePaths) && resp.imagePaths[0]) {
      uploadedUrl = resp.imagePaths[0];
    } else if (resp?.data?.imagePaths && Array.isArray(resp.data.imagePaths) && resp.data.imagePaths[0]) {
      uploadedUrl = resp.data.imagePaths[0];
    } else if (resp?.data?.url) {
      uploadedUrl = resp.data.url;
    } else if (resp?.url) {
      uploadedUrl = resp.url;
    }
    const finalUrl = buildImageUrl(uploadedUrl);
    insertImageAtCursor(finalUrl, imageOrientation, uploadedUrl);
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items || items.length === 0) return;
    const imageItems = Array.from(items).filter(it => it.kind === 'file' && it.type.startsWith('image/'));
    if (imageItems.length === 0) return;
    e.preventDefault();
    for (const it of imageItems) {
      const file = it.getAsFile();
      if (file) {
        try {
          await uploadAndInsertFile(file);
        } catch (err) {
          console.error('Paste upload error:', err);
        }
      }
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer?.files ? Array.from(e.dataTransfer.files) : [];
    for (const file of files) {
      try {
        await uploadAndInsertFile(file);
      } catch (err) {
        console.error('Drop upload error:', err);
      }
    }
  };

  const insertNote = (type: 'info' | 'warning') => {
    const icons = {
      info: '💡',
      warning: '⚠️'
    };

    const colors = {
      info: 'bg-yellow-50 border-yellow-300 text-yellow-900',
      warning: 'bg-red-50 border-red-300 text-red-900'
    };

    const html = `
      <div class="my-4 p-4 rounded-lg border-2 ${colors[type]}" contenteditable="true">
        <div class="flex items-start gap-3">
          <span class="text-2xl">${icons[type]}</span>
          <div class="flex-1">
            <p class="font-semibold mb-1">${type === 'info' ? 'ملاحظة' : 'تحذير'}</p>
            <p>اكتب محتوى ${type === 'info' ? 'الملاحظة' : 'التحذير'} هنا...</p>
          </div>
        </div>
      </div>
    `;

    insertHtmlAtCursor(html);
  };

  const insertCodeBlock = () => {
    const html = `
      <pre class="my-4 p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto" contenteditable="true"><code>// اكتب الكود هنا
function example() {
  return "Hello World";
}</code></pre>
    `;

    insertHtmlAtCursor(html);
  };

  const insertQuote = () => {
    const html = `
      <blockquote class="my-4 pl-4 pr-4 py-2 border-r-4 border-[#203f61] bg-gray-50 italic text-gray-700" contenteditable="true">
        اكتب الاقتباس هنا...
      </blockquote>
    `;

    insertHtmlAtCursor(html);
  };

  const handleInsertLink = () => {
    if (linkUrl && linkText) {
      const html = `<a href="${linkUrl}" class="text-[#203f61] underline hover:text-[#2a537e]" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
      insertHtmlAtCursor(html);
      setLinkUrl('');
      setLinkText('');
      setShowLinkInput(false);
    }
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      const selection = window.getSelection();
      const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

      const clone = editorRef.current.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('.delete-img-btn, .delete-image-btn').forEach(el => el.remove());
      onChange(clone.innerHTML);

      if (range) {
        setTimeout(() => {
          try {
            selection?.removeAllRanges();
            selection?.addRange(range);
          } catch (e) {
            // ignore
          }
        }, 0);
      }
    }
  };

  const ToolbarButton: React.FC<{
    icon: React.ReactNode;
    onClick: () => void;
    title: string;
    active?: boolean;
  }> = ({ icon, onClick, title, active }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg transition-all hover:bg-gray-200 ${
        active ? 'bg-gray-300' : 'bg-white'
      }`}
    >
      {icon}
    </button>
  );

  useEffect(() => {
    if (editorRef.current) {
      if (!value || value.trim() === '') {
        editorRef.current.innerHTML = '<p><br></p>';
      } else if (editorRef.current.innerHTML !== value) {
        const selection = window.getSelection();
        const hadFocus = editorRef.current.contains(document.activeElement);

        editorRef.current.innerHTML = value;

        if (hadFocus && selection) {
          editorRef.current.focus();
        }
      }
    }

    const handleContentChanged = () => {
      handleContentChange();
    };

    document.addEventListener('contentChanged', handleContentChanged);
    return () => {
      document.removeEventListener('contentChanged', handleContentChanged);
    };
  }, [value]);

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Toolbar */}
      <div className="bg-gray-100 border border-gray-300 rounded-t-lg p-2 flex flex-wrap gap-1">
        <div className="flex gap-1 border-l border-gray-300 pl-2">
          <ToolbarButton
            icon={<Heading1 className="w-4 h-4" />}
            onClick={() => execCommand('formatBlock', '<h1>')}
            title="عنوان رئيسي"
          />
          <ToolbarButton
            icon={<Heading2 className="w-4 h-4" />}
            onClick={() => execCommand('formatBlock', '<h2>')}
            title="عنوان فرعي"
          />
          <ToolbarButton
            icon={<Heading3 className="w-4 h-4" />}
            onClick={() => execCommand('formatBlock', '<h3>')}
            title="عنوان صغير"
          />
          <ToolbarButton
            icon={<Type className="w-4 h-4" />}
            onClick={() => execCommand('formatBlock', '<p>')}
            title="نص عادي"
          />
        </div>

        <div className="flex gap-1 border-l border-gray-300 pl-2">
          <ToolbarButton
            icon={<Bold className="w-4 h-4" />}
            onClick={() => execCommand('bold')}
            title="عريض"
          />
          <ToolbarButton
            icon={<Italic className="w-4 h-4" />}
            onClick={() => execCommand('italic')}
            title="مائل"
          />
          <ToolbarButton
            icon={<Underline className="w-4 h-4" />}
            onClick={() => execCommand('underline')}
            title="تحته خط"
          />
        </div>

        <div className="flex gap-1 border-l border-gray-300 pl-2">
          <ToolbarButton
            icon={<AlignRight className="w-4 h-4" />}
            onClick={() => execCommand('justifyRight')}
            title="محاذاة لليمين"
          />
          <ToolbarButton
            icon={<AlignCenter className="w-4 h-4" />}
            onClick={() => execCommand('justifyCenter')}
            title="محاذاة للوسط"
          />
          <ToolbarButton
            icon={<AlignLeft className="w-4 h-4" />}
            onClick={() => execCommand('justifyLeft')}
            title="محاذاة لليسار"
          />
        </div>

        <div className="flex gap-1 border-l border-gray-300 pl-2">
          <ToolbarButton
            icon={<List className="w-4 h-4" />}
            onClick={() => execCommand('insertUnorderedList')}
            title="قائمة نقطية"
          />
          <ToolbarButton
            icon={<ListOrdered className="w-4 h-4" />}
            onClick={() => execCommand('insertOrderedList')}
            title="قائمة مرقمة"
          />
        </div>

        <div className="flex gap-1 border-l border-gray-300 pl-2">
          <ToolbarButton
            icon={<Quote className="w-4 h-4" />}
            onClick={insertQuote}
            title="اقتباس"
          />
          <ToolbarButton
            icon={<Code className="w-4 h-4" />}
            onClick={insertCodeBlock}
            title="كود برمجي"
          />
          <ToolbarButton
            icon={<Lightbulb className="w-4 h-4 text-yellow-600" />}
            onClick={() => insertNote('info')}
            title="ملاحظة"
          />
          <ToolbarButton
            icon={<AlertTriangle className="w-4 h-4 text-red-600" />}
            onClick={() => insertNote('warning')}
            title="تحذير"
          />
        </div>

        <div className="flex gap-1 border-l border-gray-300 pl-2">
          <ToolbarButton
            icon={<Image className="w-4 h-4" />}
            onClick={() => imageInputRef.current?.click()}
            title="إضافة صورة"
          />
          <ToolbarButton
            icon={<Link className="w-4 h-4" />}
            onClick={() => setShowLinkInput(!showLinkInput)}
            title="إضافة رابط"
          />
        </div>

        <div className="flex gap-1 border-l border-gray-300 pl-2">
          <button
            type="button"
            onClick={toggleDirection}
            title={textDirection === 'rtl' ? 'تبديل للإنجليزية' : 'تبديل للعربية'}
            className={`p-2 rounded-lg transition-all font-bold ${
              textDirection === 'rtl'
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {textDirection === 'rtl' ? 'ع' : 'EN'}
          </button>
        </div>
      </div>

      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleUploadImages}
        className="hidden"
        ref={imageInputRef}
      />

      {showLinkInput && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
          <input
            type="text"
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
            placeholder="نص الرابط"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="رابط URL"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleInsertLink}
              className="px-4 py-2.5 bg-[#203f61] text-white rounded-lg hover:bg-[#2a537e]"
            >
              إدراج
            </button>
            <button
              type="button"
              onClick={() => setShowLinkInput(false)}
              className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          اتجاه الصور:
        </label>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="orientation"
              value="horizontal"
              checked={imageOrientation === 'horizontal'}
              onChange={(e) => {
                const ori = e.target.value as 'horizontal' | 'vertical';
                setImageOrientation(ori);
                applyOrientationToCurrentGroup(ori);
              }}
              className="w-4 h-4 text-[#203f61] focus:ring-2 focus:ring-[#203f61]"
            />
            <span className="text-sm">أفقي (عريض)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="orientation"
              value="vertical"
              checked={imageOrientation === 'vertical'}
              onChange={(e) => {
                const ori = e.target.value as 'horizontal' | 'vertical';
                setImageOrientation(ori);
                applyOrientationToCurrentGroup(ori);
              }}
              className="w-4 h-4 text-[#203f61] focus:ring-2 focus:ring-[#203f61]"
            />
            <span className="text-sm">رأسي (طويل)</span>
          </label>
        </div>
      </div>

      <div
        ref={editorRef}
        contentEditable
        onInput={handleContentChange}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        onFocus={saveSelection}
        className="w-full px-4 py-3 border border-gray-300 rounded-b-lg focus:ring-2 focus:ring-[#203f61] focus:border-[#203f61] transition-all overflow-y-auto prose prose-sm max-w-none"
        style={{ minHeight, direction: textDirection }}
        data-placeholder={placeholder}
      />

      <style>{`
        [contenteditable] {
          unicode-bidi: plaintext;
          text-align: start;
        }
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
        }
        [contenteditable] h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.5em 0;
        }
        [contenteditable] h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.5em 0;
        }
        [contenteditable] h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin: 0.5em 0;
        }
        [contenteditable] ul, [contenteditable] ol {
          margin: 1em 0;
          padding-right: 2em;
        }
        [contenteditable] li {
          margin: 0.5em 0;
        }
        [contenteditable]:focus {
          outline: none;
        }
        [contenteditable] code {
          direction: ltr;
          text-align: left;
          display: inline-block;
        }
        [contenteditable] pre {
          direction: ltr;
          text-align: left;
        }
        
        [contenteditable] .image-container {
          position: relative;
          justify-content: center;
          align-items: center;
          margin: 0.75rem 0.5rem;
        }
        [contenteditable] .image-container[data-orientation="horizontal"] {
          display: inline-flex;
        }
        [contenteditable] .image-container[data-orientation="vertical"] {
          display: block;
        }
        
        [contenteditable] .image-container img {
          display: block;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          transition: width 0.3s ease;
        }
        
        [contenteditable] .delete-img-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(220, 38, 38, 0.95);
          color: white;
          border: none;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          opacity: 1;
          z-index: 10;
        }
        
        [contenteditable] .delete-img-btn:hover {
          background: rgba(185, 28, 28, 0.95);
        }

        [contenteditable] .image-container[data-orientation="horizontal"] img { 
          width: 9rem;
        }
        
        [contenteditable] .image-container[data-orientation="vertical"] img { 
          width: 16rem;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
