import { memo, useCallback, useMemo, useState } from 'react';
import { UnwrapIcon, FileIcon } from '@/shared/ui/icons';
import fileTreeStyles from './FileTree.module.scss';

const sortTreeNodes = (nodes: LegacyValue) =>
  [...nodes].sort((a: LegacyValue, b: LegacyValue) => {
    if (a.isDirectory === b.isDirectory) {
      return a.name.localeCompare(b.name);
    }

    return a.isDirectory ? -1 : 1;
  });

const FileTreeNode = memo(({ node, level, selectedPath, onSelectFile, commentedFilesSet }: LegacyValue) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const sortedChildren = useMemo(() => (node.children ? sortTreeNodes(node.children) : []), [node.children]);

  const handleToggle = useCallback((e: LegacyValue) => {
    e.stopPropagation();
    setIsExpanded((prev: LegacyValue) => !prev);
  }, []);

  const handleSelect = useCallback(
    (e: LegacyValue) => {
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
    <div className={fileTreeStyles.wrapper}>
      <div
        className={[fileTreeStyles.node, isSelected ? fileTreeStyles.isSelected : ''].filter(Boolean).join(' ')}
        style={{
          paddingLeft: `${level * 25 + 5}px`,
        }}
        onClick={handleSelect}
        title={node.name}
      >
        <div className={fileTreeStyles.icon}>
          {node.isDirectory ? (
            <span
              className={fileTreeStyles.folderIcon}
              style={{
                transform: isExpanded ? 'none' : 'matrix(0, -1, 1, 0, 0, 0)',
              }}
            >
              <UnwrapIcon />
            </span>
          ) : (
            <span className={fileTreeStyles.fileIcon}>
              <FileIcon />
            </span>
          )}
        </div>
        <div className={fileTreeStyles.name}>{node.name}</div>
        {!node.isDirectory && hasComment && <div className={fileTreeStyles.commentDot} />}
      </div>

      {node.isDirectory && isExpanded && sortedChildren.length > 0 && (
        <div className={fileTreeStyles.children}>
          {sortedChildren.map((child: LegacyValue) => (
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

const FileTree = ({ files, selectedFile, onSelectFile, commentedFiles = [] }: LegacyValue) => {
  const sortedFiles = useMemo(() => sortTreeNodes(files), [files]);
  const selectedPath = selectedFile?.path || '';
  const commentedFilesSet = useMemo(() => new Set(commentedFiles), [commentedFiles]);

  return (
    <div className={fileTreeStyles.root}>
      {sortedFiles.map((node: LegacyValue) => (
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
