"use client";

import dynamic from 'next/dynamic';
import React from 'react';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'align': [] }],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'image'],
            ['clean']
        ],
    };

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike', 'blockquote',
        'align', 'color', 'background',
        'list', 'bullet',
        'link', 'image',
        'table'
    ];

    const [isHtmlMode, setIsHtmlMode] = React.useState(false);

    return (
        <div className="bg-white border rounded-md relative group">
            <div className="flex justify-end p-2 bg-gray-50 border-b">
                <button
                    type="button"
                    onClick={() => setIsHtmlMode(!isHtmlMode)}
                    className="text-xs font-medium text-gray-600 hover:text-blue-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                >
                    {isHtmlMode ? '📝 Visual Editor' : '⚡ Edit HTML Source'}
                </button>
            </div>

            {isHtmlMode ? (
                <textarea
                    className="w-full h-80 p-4 font-mono text-sm bg-slate-900 text-slate-100 resize-y focus:outline-none"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="<p>Enter HTML here...</p>"
                />
            ) : (
                <>
                    <style>{`
                        .ql-editor table {
                            border-collapse: collapse;
                            width: 100%;
                            margin-bottom: 1rem;
                        }
                        .ql-editor td, .ql-editor th {
                            border: 1px solid #cbd5e1;
                            padding: 8px;
                        }
                        .ql-editor th {
                            background-color: #f1f5f9;
                            font-weight: bold;
                        }
                        .ql-container {
                            border: none !important; /* Remove default border to merge with ours */
                        }
                        .ql-toolbar {
                            border: none !important;
                            border-bottom: 1px solid #ccc !important;
                        }
                    `}</style>
                    <ReactQuill
                        theme="snow"
                        value={value}
                        onChange={onChange}
                        modules={modules}
                        formats={formats}
                        placeholder={placeholder}
                        className="h-72"
                    />
                </>
            )}
        </div>
    );
}
