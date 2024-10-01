import React from 'react';
import ReactMarkdown from 'react-markdown';
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Modal from 'react-modal';
import { Element } from 'hast';
import styles from './assets/MarkdownRenderer.module.css'; // CSSモジュールのインポート
import { Todo } from '../types';
import { API_BASE_URL } from '../config'; // API_BASE_URL をインポート

interface MarkdownRendererProps {
  content: string | null;
  isOpen: boolean;
  closeModal: () => void;
  todos?: Todo[];
  toggleSubContent: (id: number) => void;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  isOpen,
  closeModal,
}) => {
  return (
    <Modal isOpen={isOpen} onRequestClose={closeModal} contentLabel="マークダウン詳細">
      <h1>マークダウン内容</h1>
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
            p({ node, children, ...props }) {
              if (
                node &&
                node.children &&
                node.children[0] &&
                (node.children[0] as Element).tagName === 'img'
              ) {
                return <>{children}</>;
              }
              return <p {...props}>{children}</p>;
            },
            img({ src, alt, ...props }) {
              if (!src) return null;
            
              // API_BASE_URLを使用して画像の絶対パスを生成
              const fullSrc = `${API_BASE_URL}${src}`;
              return <img {...props} src={fullSrc} alt={alt} className={styles.image} />;
            },
          }}
        >
          {content}
        </ReactMarkdown>
      )}
      <div className={styles.buttonContainer}>
        <button onClick={closeModal} className={styles.closeButton}>
          閉じる
        </button>
      </div>
    </Modal>
  );
};

export default MarkdownRenderer;
