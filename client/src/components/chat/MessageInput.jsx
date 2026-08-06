import React, { useState, useRef, useEffect } from 'react';

import { IconPaperclip, IconSend, IconX } from '../icons';

export default function MessageInput({ onSendMessage, onTyping, recipientId }) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleTextChange = (e) => {
    setContent(e.target.value);

    // Notify typing status
    if (!isTyping) {
      setIsTyping(true);
      onTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTyping(false);
    }, 1500);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            url: reader.result, // base64 representation
            type: file.type || 'application/octet-stream'
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
    // Reset file input value
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim() && attachments.length === 0) return;

    // Call send message callback
    onSendMessage({
      content: content.trim(),
      attachments
    });

    // Reset fields
    setContent('');
    setAttachments([]);

    // Clear typing timeout and set typing to false
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTyping(false);
    onTyping(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800 bg-slate-900/40 flex flex-col gap-3">
      {/* Attachments preview list */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {attachments.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-xs font-medium text-indigo-300"
            >
              <span className="truncate max-w-[120px]">{file.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveAttachment(idx)}
                className="text-slate-500 hover:text-rose-400 font-bold ml-1 transition-colors cursor-pointer"
                aria-label={`Remove attachment ${file.name}`}
              >
                <IconX className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-center gap-3">
        {/* Attachment upload button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-3 text-slate-400 hover:text-indigo-400 bg-slate-800/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all cursor-pointer shrink-0"
          title="Attach file"
          aria-label="Attach file"
        >
          <IconPaperclip className="h-5 w-5" />
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
        />

        {/* Text Input */}
        <input
          type="text"
          value={content}
          onChange={handleTextChange}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 hover:border-slate-750 focus:border-indigo-500/80 rounded-2xl text-slate-100 text-sm font-medium outline-none transition-all placeholder:text-slate-600"
        />

        {/* Submit button */}
        <button
          type="submit"
          className="p-3 text-white bg-indigo-600 hover:bg-indigo-500 rounded-2xl transition-all shadow-md shadow-indigo-600/20 hover:shadow-indigo-500/35 cursor-pointer shrink-0"
          aria-label="Send message"
        >
          <IconSend className="h-5 w-5 rotate-90" />
        </button>
      </div>
    </form>
  );
}
