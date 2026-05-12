export const getLanguageByFileName = (fileName) => {
  if (!fileName) return 'javascript';
  const extension = fileName.split('.').pop().toLowerCase();
  
  const map = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    c: 'cpp',
    h: 'cpp',
    hpp: 'cpp',
    cs: 'csharp',
    html: 'html',
    css: 'css',
    scss: 'css',
    less: 'css',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    sql: 'sql',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    swift: 'swift',
    kt: 'kotlin',
    php: 'php',
    sh: 'shell',
    bash: 'shell',
    vue: 'html',
    svelte: 'html',
    xml: 'xml',
    txt: 'plaintext'
  };

  return map[extension] || 'plaintext';
};
