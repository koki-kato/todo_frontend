import DOMPurify from 'dompurify';

// マークダウン形式のリンクをHTMLの<a>タグに変換する関数
export const parseMarkdownLinks = (content: string) => {
  const linkRegex = /\[(.*?)\]\((.*?)\)/g;
  const sanitizedContent = content.replace(linkRegex, (text, url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
  });
  return DOMPurify.sanitize(sanitizedContent);
};
