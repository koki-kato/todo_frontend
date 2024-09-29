import React from 'react';
import ReactMarkdown from 'react-markdown';
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import DOMPurify from 'dompurify';
import Modal from 'react-modal';
import styles from './assets/MarkdownRenderer.module.css'; // CSSモジュールのインポート
import { Todo } from '../types';

interface MarkdownRendererProps {
  content: string | null;
  isOpen: boolean;
  closeModal: () => void;
  todos?: Todo[];
  toggleSubContent: (id: number) => void; // toggleSubContent 関数を受け取る
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  isOpen,
  closeModal,
  todos,
  toggleSubContent,
}) => {
  const handleMarkdownLinkClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const link = e.target as HTMLAnchorElement;
    if (link.tagName === 'A' && link.href) {
      window.open(link.href, '_blank', 'noopener,noreferrer');
      e.preventDefault();
    }
  };

  const parseMarkdownLinks = (content: string) => {
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    const sanitizedContent = content.replace(linkRegex, (match, text, url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    });
    return DOMPurify.sanitize(sanitizedContent);
  };

  const handleEdit = () => {
    if (content && todos) {
      console.log('Modal content:', content); // デバッグ: content を確認
      const targetTodo = todos.find((t) => t.sub_content === content);
      if (targetTodo) {
        console.log('Target Todo found:', targetTodo); // デバッグ: 対象のTodoを確認
        console.log('Calling toggleSubContent with ID:', targetTodo.id); // デバッグ: toggleSubContent 呼び出しを確認
        toggleSubContent(targetTodo.id); // toggleSubContent 呼び出し
      } else {
        console.log('No matching Todo found for the content');
      }
    }
    closeModal(); // モーダルを閉じる
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={closeModal} contentLabel="マークダウン詳細">
      <h1>
        {content && todos && (
          <div
            dangerouslySetInnerHTML={{
              __html: parseMarkdownLinks(
                todos.find((t) => t.sub_content === content)?.content || ''
              ),
            }}
            onClick={handleMarkdownLinkClick}
            style={{ cursor: 'pointer' }}
          />
        )}
      </h1>
      {content && (
        <ReactMarkdown
          components={{
            li({ children, ...props }) {
              return (
                <li {...props} className={styles.listItem}>
                  {children}
                </li>
              );
            },
            code({ inline, className, children, ...props }: React.ComponentPropsWithoutRef<'code'> & { inline?: boolean }) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter {...props} language={match[1]} style={darcula} PreTag="div">
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code {...props} className={styles.inlineCode}>
                  {children}
                </code>
              );
            },
          }}
        >
          {DOMPurify.sanitize(content)}
        </ReactMarkdown>
      )}
      <div className={styles.buttonContainer}>
        {/* <button onClick={handleEdit} className={styles.editButton}>
          編集
        </button> */}
        <button onClick={closeModal} className={styles.closeButton}>
          閉じる
        </button>
      </div>
    </Modal>
  );
};

export default MarkdownRenderer;
