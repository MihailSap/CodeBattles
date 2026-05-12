import React, { useState } from 'react';
import { UnwrapIcon, FileIcon } from '../Icons/Icons';
import './FileTree.css';

const FileTreeNode = ({ node, level, selectedFile, onSelectFile, commentedFiles }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleToggle = (e) => {
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  };

  const handleSelect = (e) => {
    e.stopPropagation();
    if (!node.isDirectory) {
      onSelectFile(node);
    } else {
      handleToggle(e);
    }
  };

  const isSelected = selectedFile && selectedFile.path === node.path;
  const hasComment = commentedFiles && commentedFiles.includes(node.path);

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
        {!node.isDirectory && hasComment && (
          <div className="file-tree-node__comment-dot" />
        )}
      </div>

      {node.isDirectory && isExpanded && node.children && (
        <div className="file-tree-node__children">
          {node.children
            .slice()
            .sort((a, b) => {
              if (a.isDirectory === b.isDirectory) {
                return a.name.localeCompare(b.name);
              }
              return a.isDirectory ? -1 : 1;
            })
            .map((child) => (
              <FileTreeNode
                key={child.path}
                node={child}
                level={level + 1}
                selectedFile={selectedFile}
                onSelectFile={onSelectFile}
                commentedFiles={commentedFiles}
              />
            ))}
        </div>
      )}
    </div>
  );
};

const FileTree = ({ files, selectedFile, onSelectFile, commentedFiles = [] }) => {
  const sortedFiles = files.slice().sort((a, b) => {
    if (a.isDirectory === b.isDirectory) {
      return a.name.localeCompare(b.name);
    }
    return a.isDirectory ? -1 : 1;
  });

  return (
    <div className="file-tree">
      {sortedFiles.map((node) => (
        <FileTreeNode
          key={node.path}
          node={node}
          level={0}
          selectedFile={selectedFile}
          onSelectFile={onSelectFile}
          commentedFiles={commentedFiles}
        />
      ))}
    </div>
  );
};

export default FileTree;
