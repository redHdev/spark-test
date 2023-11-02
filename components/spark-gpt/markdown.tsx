import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import ReactMarkdown from 'react-markdown';
import styled from '@emotion/styled';
import { FunctionComponent, useState, useEffect } from 'react';
import { IconClipboard } from '@tabler/icons-react';
import { ActionIcon, Box } from '@mantine/core';
import { css } from '@emotion/react';
import { useMediaQuery } from "@mantine/hooks";

interface MarkdownProps {
  content: string;
}

const Header = styled.div`
    align-items: center;
    justify-content: flex-end;
    background: #191919;
    height: 2.5rem;
    padding: 0.1rem 0.1rem 0 0.5rem;
`;

const CodeBlockContainer = styled.div`
  max-width: 100%;
  overflow: auto;
`;

const Code = styled.div`
    padding: 0;
    border-radius: 0.25rem;
    overflow: hidden;
`;

export const Markdown: FunctionComponent<MarkdownProps> = ({ content }) => {
  const [lightTheme, setLightTheme] = useState(() => {
    const storedTheme = localStorage.getItem('theme');
    return storedTheme ? JSON.parse(storedTheme) : false;
  });
    const isMobile = useMediaQuery("(max-width: 480px)");

  useEffect(() => {
    const handleStorageChange = () => {
      const storedTheme = localStorage.getItem('theme');
      setLightTheme(storedTheme ? JSON.parse(storedTheme) : false);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div>
      <ReactMarkdown
      components={{
          code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              const shouldApplySpecialStyling = String(children).startsWith('$$!');
              const contentToDisplay = shouldApplySpecialStyling ?
                  String(children).slice(3) :
                  String(children);
            return !inline && match ? (
              <>
              <Code style={{width: isMobile ? "80vw" : "60vw"}}>
              <Header style={{borderTopLeftRadius:'6px', borderTopRightRadius:'6px', display:'flex'}}>
                <ActionIcon style={{right:'5px', float:'right'}} onClick={() => copyToClipboard(String(children).replace(/\n$/, ''))}>
                  <IconClipboard size="1rem" style={{marginRight:'3px', color:'white'}}/>
                </ActionIcon>
                </Header>
                <Box style={{marginTop:'-1vh'}}>
                <CodeBlockContainer>
                {shouldApplySpecialStyling ? (
                    <SyntaxHighlighter
                      css={css`
                        max-width: 100%;
                        white-space: pre-wrap;
                        word-wrap: break-word;
                        overflow-x: auto;
                        line-height: 0.5;
                        letter-spacing: -2.5px;
                      `}
                      style={vscDarkPlus as any}
                      language={match?.[1] || 'text'}
                      PreTag="div"
                      {...props}
                    >
                        {contentToDisplay}
                    </SyntaxHighlighter>
                ) : (
                    <SyntaxHighlighter
                      css={css`
                        max-width: 100%;
                        white-space: pre-wrap;
                        word-wrap: break-word;
                        overflow-x: auto;
                      `}
                      style={vscDarkPlus as any}
                      language={match?.[1] || 'text'}
                      PreTag="div"
                      {...props}
                    >
                        {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                )}
                </CodeBlockContainer>
              </Box>
            </Code>
          </>
        ) : (
          <code className={className} {...props}>
            {children}
          </code>
        );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
