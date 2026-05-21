import { memo, useCallback, useMemo, useState } from 'react';
import { UnwrapIcon, FileIcon } from '@/shared/ui/icons';
import './FileTree.css';

const sortTreeNodes = (nodes) =>
  [...nodes].sort((a, b) => {
    if (a.isDirectory === b.isDirectory) {
      return a.name.localeCompare(b.name);
    }
    return a.isDirectory ? -1 : 1;
  });

const FileTreeNode = memo(({ node, level, selectedPath, onSelectFile, commentedFilesSet }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const sortedChildren = useMemo(() => (node.children ? sortTreeNodes(node.children) : []), [node.children]);

  const handleToggle = useCallback((e) => {
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  }, []);

  const handleSelect = useCallback(
    (e) => {
      e.stopPropagation();
      if (!node.isDirectory) {
        onSelectFile(node);
      } else {
        handleToggle(e);
      }
    },
    [handleToggle, node, onSelectFile]
  );

  const isSelected = selectedPath === node.path;
  const hasComment = commentedFilesSet.has(node.path);

  return (
    <div className="file-tree-node-wrapper">
      <div
        className={`file-tree-node ${isSelected ? 'file-tree-node--selected' : ''}`}
        style={{ paddingLeft: `${level * 25 + 5}px` }}
        onClick={handleSelect}
        title={node.name}
      >
        <div className="file-tree-node__icon">
          {node.isDirectory ? (
            <span
              className="file-tree-node__folder-icon"
              style={{ transform: isExpanded ? 'none' : 'matrix(0, -1, 1, 0, 0, 0)' }}
            >
              <UnwrapIcon />
            </span>
          ) : (
            <span className="file-tree-node__file-icon">
              <FileIcon />
            </span>
          )}
        </div>
        <div className="file-tree-node__name">{node.name}</div>
        {!node.isDirectory && hasComment && <div className="file-tree-node__comment-dot" />}
      </div>

      {node.isDirectory && isExpanded && sortedChildren.length > 0 && (
        <div className="file-tree-node__children">
          {sortedChildren.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              level={level + 1}
              selectedPath={selectedPath}
              onSelectFile={onSelectFile}
              commentedFilesSet={commentedFilesSet}
            />
          ))}
        </div>
      )}
    </div>
  );
});

FileTreeNode.displayName = 'FileTreeNode';

const FileTree = ({ files, selectedFile, onSelectFile, commentedFiles = [] }) => {
  const sortedFiles = useMemo(() => sortTreeNodes(files), [files]);
  const selectedPath = selectedFile?.path || '';
  const commentedFilesSet = useMemo(() => new Set(commentedFiles), [commentedFiles]);

  return (
    <div className="file-tree">
      {sortedFiles.map((node) => (
        <FileTreeNode
          key={node.path}
          node={node}
          level={0}
          selectedPath={selectedPath}
          onSelectFile={onSelectFile}
          commentedFilesSet={commentedFilesSet}
        />
      ))}
    </div>
  );
};

export default memo(FileTree);
