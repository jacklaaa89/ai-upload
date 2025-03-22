'use client';

import React, { Suspense, useState } from 'react';
import dynamic from 'next/dynamic';

// Use any for the dynamic import to avoid type errors
const DynamicSyntaxHighlighter = dynamic(
  () => import('react-syntax-highlighter').then((mod) => mod.Prism) as any,
  { ssr: false }
);

interface SyntaxHighlightRendererProps {
  content: string;
  className?: string;
}

// Colorful theme styles
const colorfulTheme = {
  'code[class*="language-"]': {
    color: '#f8f8f2',
    background: 'none',
    fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1.5',
    tabSize: '4',
    hyphens: 'none',
  },
  'pre[class*="language-"]': {
    color: '#f8f8f2',
    background: '#282a36',
    fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1.5',
    tabSize: '4',
    hyphens: 'none',
    padding: '1em',
    margin: '0.5em 0',
    overflow: 'auto',
    borderRadius: '0.3em',
  },
  ':not(pre) > code[class*="language-"]': {
    background: '#282a36',
    padding: '0.1em',
    borderRadius: '0.3em',
    whiteSpace: 'normal',
  },
  comment: {
    color: '#6272a4',
  },
  prolog: {
    color: '#6272a4',
  },
  doctype: {
    color: '#6272a4',
  },
  cdata: {
    color: '#6272a4',
  },
  punctuation: {
    color: '#f8f8f2',
  },
  '.namespace': {
    opacity: '0.7',
  },
  property: {
    color: '#ff79c6',
  },
  keyword: {
    color: '#ff79c6',
  },
  tag: {
    color: '#ff79c6',
  },
  'class-name': {
    color: '#8be9fd',
    fontStyle: 'italic',
  },
  boolean: {
    color: '#bd93f9',
  },
  constant: {
    color: '#bd93f9',
  },
  symbol: {
    color: '#f1fa8c',
  },
  deleted: {
    color: '#f07178',
  },
  number: {
    color: '#bd93f9',
  },
  selector: {
    color: '#a6e22e',
  },
  'attr-name': {
    color: '#a6e22e',
  },
  string: {
    color: '#f1fa8c',
  },
  char: {
    color: '#f1fa8c',
  },
  builtin: {
    color: '#8be9fd',
  },
  inserted: {
    color: '#a6e22e',
  },
  variable: {
    color: '#f8f8f2',
  },
  operator: {
    color: '#ff79c6',
  },
  entity: {
    color: '#f8f8f2',
    cursor: 'help',
  },
  url: {
    color: '#66d9ef',
  },
  '.language-css .token.string': {
    color: '#f1fa8c',
  },
  '.style .token.string': {
    color: '#f1fa8c',
  },
  atrule: {
    color: '#8be9fd',
  },
  'attr-value': {
    color: '#f1fa8c',
  },
  function: {
    color: '#50fa7b',
  },
  regex: {
    color: '#f1fa8c',
  },
  important: {
    color: '#fd971f',
    fontWeight: 'bold',
  },
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
};

export default function SyntaxHighlightRenderer({ content, className = '' }: SyntaxHighlightRendererProps) {
  const [highlighterStyle] = useState<any>(colorfulTheme);

  // Check if content contains code blocks with ```
  if (!content.includes('```')) {
    return <span className={className}>{content}</span>;
  }

  try {
    // Extract code blocks
    const parts = content.split(/(```(?:[\w-]+)?\n[\s\S]*?\n```)/g);
    
    return (
      <div className={`syntax-wrapper ${className}`}>
        {parts.map((part, index) => {
          // Check if this part is a code block
          const codeBlockMatch = part.match(/```((?:[\w-]+)?)\n([\s\S]*?)\n```/);
          
          if (codeBlockMatch) {
            const language = codeBlockMatch[1] || 'text';
            const code = codeBlockMatch[2];
            
            // Map some common language aliases
            const languageMap: {[key: string]: string} = {
              'js': 'javascript',
              'ts': 'typescript',
              'py': 'python',
              'rb': 'ruby',
              'sh': 'bash',
              'shell': 'bash',
              'yml': 'yaml',
              'rust': 'rust',
              'golang': 'go',
              'rs': 'rust',
              'md': 'markdown',
              'html': 'html',
              'css': 'css',
              'scss': 'scss',
              'sql': 'sql',
              'json': 'json',
              'jsx': 'jsx',
              'tsx': 'tsx',
            };
            
            // Use the mapping if available
            const mappedLanguage = languageMap[language] || language;
            
            return (
              <div key={index} className="code-block my-3 overflow-hidden rounded-md shadow-md">
                <div className="code-header px-4 py-2 text-xs bg-gray-800 text-gray-200 flex items-center justify-between">
                  <span className="font-medium">{mappedLanguage ? mappedLanguage.toUpperCase() : 'TEXT'}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-gray-700">CODE</span>
                </div>
                <Suspense fallback={<pre className="text-sm p-4 bg-gray-900 text-gray-200 rounded-b-md">{code}</pre>}>
                  <DynamicSyntaxHighlighter
                    style={highlighterStyle}
                    language={mappedLanguage || 'text'}
                    showLineNumbers={true}
                    customStyle={{
                      margin: 0,
                      borderRadius: '0 0 0.375rem 0.375rem',
                      fontSize: '0.875rem',
                      backgroundColor: '#282a36',
                    }}
                  >
                    {code}
                  </DynamicSyntaxHighlighter>
                </Suspense>
              </div>
            );
          }
          
          // Regular text
          return <span key={index}>{part}</span>;
        })}
      </div>
    );
  } catch (error) {
    console.error('Error rendering code blocks:', error);
    // Fallback to plain text if rendering fails
    return <div className={className}>{content}</div>;
  }
} 