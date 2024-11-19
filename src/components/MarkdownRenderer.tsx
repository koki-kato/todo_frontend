import React from 'react';
import ReactMarkdown from 'react-markdown';
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Modal from 'react-modal';
import { Element } from 'hast';
import styles from './assets/MarkdownRenderer.module.css'; // CSSモジュールのインポート
import { API_BASE_URL } from '../config'; // API_BASE_URL をインポート
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface MarkdownRendererProps {
  title: string | null;
  sub_content: string | null;
  isOpen: boolean;
  closeModal: () => void;
  parseMarkdownLinks: (content: string) => string;
  handleMarkdownLinkClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
  e.preventDefault();
  const href = e.currentTarget.getAttribute('href');
  if (href) {
    window.open(href, '_blank', 'noopener,noreferrer');
  }
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  title,
  sub_content,
  isOpen,
  closeModal,
  parseMarkdownLinks,
  handleMarkdownLinkClick,
}) => {
  const exportMarkdownToExcel = () => {
    const content = sub_content || title || '';
    if (!content) {
      console.log('Content is empty');
      return;
    }

    console.log('Content before processing:', content);

    // content を行に分割
    const lines = content.split('\n');
    console.log('Lines after splitting:', lines);

    const data = lines.map(line => [line]); // 各行を配列形式で保持
    console.log('Data array for Excel:', data);

    // シート作成
    const ws = XLSX.utils.aoa_to_sheet(data);
    console.log('Worksheet after aoa_to_sheet:', ws);

    // 各行にスタイル適用
    lines.forEach((line, index) => {
      const cellRef = XLSX.utils.encode_cell({ c: 0, r: index });
      const cell = ws[cellRef];

      if (cell) { // セルが存在する場合のみスタイル適用
        if (line.startsWith('# ')) {
          cell.s = { font: { bold: true, sz: 16 } }; // フォントサイズ16で太字
        } else if (line.startsWith('## ')) {
          cell.s = { font: { bold: true, sz: 14 } };
        } else if (line.startsWith('### ')) {
          cell.s = { font: { bold: true, sz: 12 } };
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
          cell.s = { alignment: { indent: 1 } };
        }
      }
    });

    console.log('Worksheet after styling:', ws);

    ws['!cols'] = [{ wch: 100 }]; // 列幅を設定
    console.log('Worksheet after setting column width:', ws);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Markdown Content");
    console.log('Workbook:', wb);

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    console.log('Excel buffer created:', excelBuffer);

    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, 'markdown_content.xlsx');
    console.log('Excel file saved');
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={closeModal} contentLabel="マークダウン詳細">
      {sub_content && (
        <div className={styles.modalTitle}>
          {(sub_content.includes('[') && sub_content.includes('](')) ||
            parseMarkdownLinks(sub_content).includes('<a') ? (
            <div onClick={handleMarkdownLinkClick}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  a: ({ node, ...props }) => (
                    <a
                      onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                        e.preventDefault();
                        handleMarkdownLinkClick(e as unknown as React.MouseEvent<HTMLDivElement>);
                      }}
                      {...props}
                    />
                  ),
                  table: ({ node, ...props }) => (
                    <table className={styles.table} {...props} />
                  ),
                  p: ({ children }) => {
                    const childrenArray = React.Children.toArray(children);
                    if (childrenArray.length === 1 && typeof childrenArray[0] === 'string') {
                      const text = childrenArray[0] as string;
                      if (text.trim().startsWith('|') && text.trim().endsWith('|')) {
                        return (
                          <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                              <tbody>
                                {text.trim().split('\n').map((row, index) => (
                                  <tr key={index}>
                                    {row.split('|').filter(Boolean).map((cell, cellIndex) => (
                                      <td key={cellIndex}>{cell.trim()}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      }
                    }
                    return <p>{children}</p>;
                  }
                }}
              >
                {sub_content}
              </ReactMarkdown>
            </div>
          ) : (
            sub_content
          )}
        </div>
      )}
      <div className="input-content-mark-down">
        {title && (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              a({ href, children, ...props }) {
                return (
                  <a
                    href={href}
                    onClick={handleLinkClick}
                    rel="noopener noreferrer"
                    {...props}
                  >
                    {children}
                  </a>
                );
              },
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
                if (node && node.children && node.children[0] && (node.children[0] as Element).tagName === 'img') {
                  return <>{children}</>;
                }
                return <p {...props}>{children}</p>;
              },
              img({ src, alt, ...props }) {
                if (!src) return null;

                const fullSrc = `${API_BASE_URL}${src}`;

                return (
                  <img
                    {...props}
                    src={fullSrc}
                    alt={alt}
                    className={styles.image}
                    style={{ width: '50%' }}
                  />
                );
              },
            }}
          >
            {title}
          </ReactMarkdown>
        )}
      </div>
      <div className={styles.buttonContainer}>
        <button onClick={closeModal} className={styles.closeButton}>
          閉じる
        </button>
      </div>
      <button onClick={exportMarkdownToExcel} className={styles.exportButton}>
        マークダウンをエクセルにエクスポート
      </button>
    </Modal>
  );
};

export default MarkdownRenderer;
