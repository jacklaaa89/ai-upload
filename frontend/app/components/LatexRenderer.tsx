'use client';

import React, { useEffect } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LatexRendererProps {
  content: string;
}

export default function LatexRenderer({ content }: LatexRendererProps) {
  useEffect(() => {
    console.log('LatexRenderer received content:', content.substring(0, 50) + '...');
  }, [content]);

  // If no LaTeX expressions detected, return plain text
  if (!content.includes('$')) {
    return <span>{content}</span>;
  }

  try {
    console.log('Processing content with LaTeX:', content.substring(0, 50) + '...');
    
    // Create a temporary representation to avoid conflicts
    const BLOCK_PLACEHOLDER = '___BLOCK_LATEX_PLACEHOLDER___';
    const INLINE_PLACEHOLDER = '___INLINE_LATEX_PLACEHOLDER___';
    
    // Store all LaTeX expressions
    const blocks: string[] = [];
    const inlines: string[] = [];
    
    // Step 1: Replace block LaTeX with placeholders first (to avoid confusion with inline $)
    let processedContent = content.replace(/\$\$([\s\S]+?)\$\$/g, (match, latex) => {
      blocks.push(latex.trim());
      console.log(`Found block LaTeX (${blocks.length-1}):`, latex.trim().substring(0, 20) + '...');
      return `${BLOCK_PLACEHOLDER}${blocks.length-1}${BLOCK_PLACEHOLDER}`;
    });
    
    // Step 2: Now replace inline LaTeX with placeholders
    processedContent = processedContent.replace(/\$([^$\n]+?)\$/g, (match, latex) => {
      inlines.push(latex.trim());
      console.log(`Found inline LaTeX (${inlines.length-1}):`, latex.trim());
      return `${INLINE_PLACEHOLDER}${inlines.length-1}${INLINE_PLACEHOLDER}`;
    });
    
    console.log(`Found ${blocks.length} block and ${inlines.length} inline LaTeX expressions`);
    
    // Step 3: Split by placeholders and reconstruct with rendered LaTeX
    const blockRegex = new RegExp(`${BLOCK_PLACEHOLDER}(\\d+)${BLOCK_PLACEHOLDER}`, 'g');
    const inlineRegex = new RegExp(`${INLINE_PLACEHOLDER}(\\d+)${INLINE_PLACEHOLDER}`, 'g');
    
    // Split content by both types of placeholders
    const parts: Array<{ type: 'text' | 'block-placeholder' | 'inline-placeholder'; content: string }> = [];
    
    // Split by all placeholders - this creates a complex regex that matches either placeholder type
    const combinedRegex = new RegExp(`(${BLOCK_PLACEHOLDER}\\d+${BLOCK_PLACEHOLDER}|${INLINE_PLACEHOLDER}\\d+${INLINE_PLACEHOLDER})`, 'g');
    const segments = processedContent.split(combinedRegex);
    
    segments.forEach(segment => {
      if (segment.startsWith(BLOCK_PLACEHOLDER)) {
        const index = parseInt(segment.replace(new RegExp(`^${BLOCK_PLACEHOLDER}(\\d+)${BLOCK_PLACEHOLDER}$`), '$1'), 10);
        parts.push({ type: 'block-placeholder', content: String(index) });
      } else if (segment.startsWith(INLINE_PLACEHOLDER)) {
        const index = parseInt(segment.replace(new RegExp(`^${INLINE_PLACEHOLDER}(\\d+)${INLINE_PLACEHOLDER}$`), '$1'), 10);
        parts.push({ type: 'inline-placeholder', content: String(index) });
      } else if (segment) {
        parts.push({ type: 'text', content: segment });
      }
    });
    
    console.log('Processed into', parts.length, 'parts');
    
    // Render content with rendered LaTeX
    return (
      <span>
        {parts.map((part, index) => {
          if (part.type === 'text') {
            return <span key={index}>{part.content}</span>;
          } else if (part.type === 'block-placeholder') {
            const blockIndex = parseInt(part.content, 10);
            try {
              const html = katex.renderToString(blocks[blockIndex], { 
                displayMode: true,
                throwOnError: false
              });
              
              return (
                <div 
                  key={index} 
                  className="math-block my-6 py-4 px-4 bg-gray-50 dark:bg-gray-800 rounded-md overflow-x-auto"
                  style={{ padding: "0 10px" }}
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              );
            } catch (error) {
              console.error('Error rendering block LaTeX:', error);
              return (
                <span key={index} className="text-red-500 font-mono p-1 bg-red-50 rounded">
                  {`$$${blocks[blockIndex]}$$`}
                </span>
              );
            }
          } else if (part.type === 'inline-placeholder') {
            const inlineIndex = parseInt(part.content, 10);
            try {
              const html = katex.renderToString(inlines[inlineIndex], { 
                displayMode: false,
                throwOnError: false
              });
              
              return (
                <span 
                  key={index} 
                  className="math-inline px-0.5"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              );
            } catch (error) {
              console.error('Error rendering inline LaTeX:', error);
              return (
                <span key={index} className="text-red-500 font-mono p-1 bg-red-50 rounded">
                  {`$${inlines[inlineIndex]}$`}
                </span>
              );
            }
          }
          
          return null;
        })}
      </span>
    );
  } catch (error) {
    console.error('Error in LaTeX processing:', error);
    // Fallback to plain text if processing fails
    return <span>{content}</span>;
  }
} 