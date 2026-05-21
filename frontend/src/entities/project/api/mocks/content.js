export const MOCK_LARGE_FILE_TREE = [
  {
    path: 'src',
    name: 'src',
    isDirectory: true,
    children: [
      {
        path: 'src/api',
        name: 'api',
        isDirectory: true,
        children: [
          {
            path: 'src/api/auth.js',
            name: 'auth.js',
            isDirectory: false,
            content:
              'export const login = async (username, password) => {\n  return { token: "123", username, password };\n};\n\nexport const logout = () => {\n  localStorage.removeItem("token");\n};\n',
          },
          {
            path: 'src/api/config.js',
            name: 'config.js',
            isDirectory: false,
            content: 'export const API_URL = "https://api.example.com";\nexport const TIMEOUT = 5000;\n',
          },
          {
            path: 'src/api/services.js',
            name: 'services.js',
            isDirectory: false,
            content:
              'import { API_URL } from "./config";\n\nexport const fetchData = async () => {\n  const res = await fetch(`${API_URL}/data`);\n  return res.json();\n};\n',
          },
        ],
      },
      {
        path: 'src/components',
        name: 'components',
        isDirectory: true,
        children: [
          {
            path: 'src/components/ArchitectureDiagram',
            name: 'ArchitectureDiagram',
            isDirectory: true,
            children: [
              {
                path: 'src/components/ArchitectureDiagram/index.jsx',
                name: 'index.jsx',
                isDirectory: false,
                content: 'export { default } from "./ArchitectureDiagram";\n',
              },
              {
                path: 'src/components/ArchitectureDiagram/ArchitectureDiagram.jsx',
                name: 'ArchitectureDiagram.jsx',
                isDirectory: false,
              },
              {
                path: 'src/components/ArchitectureDiagram/ArchitectureDiagram.css',
                name: 'ArchitectureDiagram.css',
                isDirectory: false,
                content: '.arch-diagram__wrapper { display: flex; flex-direction: column; width: 100%; height: 100%; }',
              },
              {
                path: 'src/components/ArchitectureDiagram/hooks.js',
                name: 'hooks.js',
                isDirectory: false,
                content: 'export const useZoom = () => {};',
              },
            ],
          },
          {
            path: 'src/components/Layout',
            name: 'Layout',
            isDirectory: true,
            children: [
              {
                path: 'src/components/Layout/Layout.jsx',
                name: 'Layout.jsx',
                isDirectory: false,
                content: 'export const Layout = ({ children }) => <div>{children}</div>;',
              },
              {
                path: 'src/components/Layout/Sidebar.jsx',
                name: 'Sidebar.jsx',
                isDirectory: false,
                content: 'export const Sidebar = () => <aside>Menu</aside>;',
              },
            ],
          },
        ],
      },
      {
        path: 'src/utils',
        name: 'utils',
        isDirectory: true,
        children: [
          {
            path: 'src/utils/helpers.js',
            name: 'helpers.js',
            isDirectory: false,
            content: 'export const noop = () => {};',
          },
          {
            path: 'src/utils/parser.js',
            name: 'parser.js',
            isDirectory: false,
            content: 'export const parseArchitectureConfig = (data) => { return { nodes: [], edges: [] }; };',
          },
        ],
      },
      {
        path: 'src/App.jsx',
        name: 'App.jsx',
        isDirectory: false,
        content:
          'import Layout from "./components/Layout/Layout";\nexport default function App() { return <Layout>App</Layout>; }',
      },
      {
        path: 'src/main.jsx',
        name: 'main.jsx',
        isDirectory: false,
        content:
          'import React from "react";\nimport ReactDOM from "react-dom";\nimport App from "./App";\n\nReactDOM.render(<App />, document.getElementById("root"));\n',
      },
    ],
  },
  {
    path: 'package.json',
    name: 'package.json',
    isDirectory: false,
    content: '{\n  "name": "mock-project",\n  "version": "1.0.0"\n}',
  },
  {
    path: 'README.md',
    name: 'README.md',
    isDirectory: false,
    content: '# Mock Project\nThis is a mock project for testing.\n',
  },
];

export const MOCK_LARGE_CODE = `import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchArchitectureData, updateNodePosition } from '../../store/architectureSlice';
import { NodeRenderer } from './NodeRenderer';
import { ConnectionLine } from './ConnectionLine';
import { DiagramControls } from './DiagramControls';
import { parseArchitectureConfig } from '../../utils/parser';
import './ArchitectureDiagram.css';

export const ArchitectureDiagram = ({ configId, initialZoom = 1 }) => {
  const dispatch = useDispatch();
  const rawData = useSelector(state => state.architecture.data[configId]);
  const isDataLoading = useSelector(state => state.architecture.isLoading);
  
  const [zoom, setZoom] = useState(initialZoom);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const { nodes, edges } = useMemo(() => {
    if (!rawData) return { nodes: [], edges: [] };
    return parseArchitectureConfig(rawData);
  }, [rawData]);

  useEffect(() => {
    if (configId) {
      dispatch(fetchArchitectureData(configId));
    }
  }, [configId, dispatch]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const zoomFactor = 0.1;
    if (e.deltaY < 0) {
      setZoom(z => Math.min(z + zoomFactor, 3));
    } else {
      setZoom(z => Math.max(z - zoomFactor, 0.5));
    }
  }, []);

  const handleNodeDragEnd = useCallback((nodeId, newPosition) => {
    dispatch(updateNodePosition({ configId, nodeId, position: newPosition }));
  }, [configId, dispatch]);

  const handleNodeClick = useCallback((nodeId) => {
    setSelectedNode(nodeId === selectedNode ? null : nodeId);
  }, [selectedNode]);

  if (isDataLoading) {
    return <div className="arch-diagram__loader">Loading architecture data...</div>;
  }

  if (!nodes.length) {
    return <div className="arch-diagram__empty">No architecture config found.</div>;
  }

  return (
    <div className="arch-diagram__wrapper">
      <DiagramControls zoom={zoom} onZoomChange={setZoom} />
      
      <div 
        className="arch-diagram__canvas"
        onWheel={handleWheel}
        style={{ transform: \`scale(\${zoom}) translate(\${pan.x}px, \${pan.y}px)\` }}
      >
        <svg className="arch-diagram__edges" width="100%" height="100%">
          {edges.map(edge => (
            <ConnectionLine 
              key={edge.id} 
              source={nodes.find(n => n.id === edge.source)}
              target={nodes.find(n => n.id === edge.target)}
              type={edge.type}
            />
          ))}
        </svg>
        
        <div className="arch-diagram__nodes">
          {nodes.map(node => (
            <NodeRenderer
              key={node.id}
              node={node}
              isSelected={selectedNode === node.id}
              onDragEnd={(pos) => handleNodeDragEnd(node.id, pos)}
              onClick={() => handleNodeClick(node.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ArchitectureDiagram;
`;

export const MOCK_LARGE_COMMENTS = [
  {
    id: 1001,
    file: 'src/components/ArchitectureDiagram/ArchitectureDiagram.jsx',
    startLine: 35,
    endLine: 35,
    text: 'Этот useCallback не нужен, setZoom можно просто вызывать с callback формой внутри onWheel без мемоизации.',
    authorId: 14,
    authorName: 'Петрова Алина Олеговна',
    authorRole: 'Reviewer',
    revealName: true,
    reviewerIndex: 2,
    createdAt: '2026-05-09T10:00:00Z',
    likedBy: [12, 15],
    dislikedBy: [],
    isClosed: false,
    replies: [
      {
        id: 1002,
        text: 'Но handleWheel передается в onWheel, который при рендере будет создаваться заново, если не мемоизировать.',
        authorId: 11,
        authorName: 'Кузнецова Екатерина Андреевна',
        authorRole: 'Assignee',
        createdAt: '2026-05-09T10:15:00Z',
        likedBy: [],
        dislikedBy: [],
        replies: [
          {
            id: 10021,
            text: 'Да, но в случае с обычным div это не страшно. React сам оптимизирует.',
            authorId: 14,
            authorName: 'Петрова Алина Олеговна',
            authorRole: 'Reviewer',
            revealName: true,
            reviewerIndex: 2,
            createdAt: '2026-05-09T10:17:00Z',
            likedBy: [11],
            dislikedBy: [],
            replies: [
              {
                id: 10022,
                text: 'Поняла, переделаю без useCallback.',
                authorId: 11,
                authorName: 'Кузнецова Екатерина Андреевна',
                authorRole: 'Assignee',
                createdAt: '2026-05-09T10:18:00Z',
                likedBy: [14],
                dislikedBy: [],
                replies: [],
              },
            ],
          },
        ],
      },
      {
        id: 1003,
        text: 'Верно, но в React 18+ для DOM событий это не вызывает лишних рендеров дочерних компонентов, если это просто div.',
        authorId: 14,
        authorName: 'Петрова Алина Олеговна',
        authorRole: 'Reviewer',
        revealName: true,
        reviewerIndex: 2,
        createdAt: '2026-05-09T10:20:00Z',
        likedBy: [],
        dislikedBy: [],
        replies: [],
      },
    ],
  },
  {
    id: 1004,
    file: 'src/components/ArchitectureDiagram/ArchitectureDiagram.jsx',
    startLine: 18,
    endLine: 20,
    text: 'Почему здесь не используется селектор из reselect? Мы пересоздаем объект {nodes, edges} на каждое изменение rawData, но rawData - это ссылка на весь объект стора.',
    authorId: 12,
    authorName: 'Романов Александр Сергеевич',
    authorRole: 'Reviewer',
    revealName: false,
    reviewerIndex: 1,
    createdAt: '2026-05-09T11:05:00Z',
    likedBy: [],
    dislikedBy: [],
    isClosed: true,
    replies: [],
  },
  {
    id: 1005,
    file: 'src/components/ArchitectureDiagram/ArchitectureDiagram.jsx',
    startLine: 52,
    endLine: 58,
    text: 'Очень неоптимально: O(N^2) поиск узлов внутри рендера edges. Нужно предварительно сделать мапу nodesById.',
    authorId: 14,
    authorName: 'Петрова Алина Олеговна',
    authorRole: 'Reviewer',
    revealName: true,
    reviewerIndex: 2,
    createdAt: '2026-05-09T11:30:00Z',
    likedBy: [12, 11, 57],
    dislikedBy: [],
    isClosed: false,
    replies: [],
  },
  {
    id: 1007,
    file: 'src/api/auth.js',
    startLine: 1,
    endLine: 4,
    text: 'Нужно добавить обработку ошибок (try/catch) на случай если сервер упадет.',
    authorId: 12,
    authorName: 'Романов Александр Сергеевич',
    authorRole: 'Reviewer',
    revealName: false,
    reviewerIndex: 1,
    createdAt: '2026-05-09T12:00:00Z',
    likedBy: [],
    dislikedBy: [],
    isClosed: false,
    replies: [],
  },
  {
    id: 1006,
    file: 'src/components/ArchitectureDiagram/ArchitectureDiagram.jsx',
    startLine: 69,
    endLine: 77,
    text: 'handleWheel содержит e.preventDefault(), что может вызвать проблемы в passive event listener. Рекомендуется использовать { passive: false } при подписке на wheel event через useEffect вместо onWheel пропа.',
    authorId: 0,
    authorName: 'AI',
    authorRole: 'AI',
    createdAt: '2026-05-09T09:00:00Z',
    likedBy: [],
    dislikedBy: [11],
    isClosed: false,
    replies: [],
  },
];

export const MOCK_REWORK_HISTORY_COMMENTS = [
  {
    id: 801,
    file: 'src/components/ArchitectureDiagram/ArchitectureDiagram.jsx',
    startLine: 2,
    endLine: 2,
    text: 'Убери lodash, он тут не нужен и раздувает бандл.',
    authorId: 14,
    authorName: 'Петрова Алина Олеговна',
    authorRole: 'Reviewer',
    revealName: true,
    reviewerIndex: 2,
    createdAt: '2026-05-05T12:00:00Z',
    likedBy: [],
    dislikedBy: [],
    isClosed: true,
    replies: [
      {
        id: 802,
        text: 'Убрал, переписал на нативные функции.',
        authorId: 11,
        authorName: 'Кузнецова Екатерина Андреевна',
        authorRole: 'Assignee',
        createdAt: '2026-05-05T14:00:00Z',
        likedBy: [],
        dislikedBy: [],
        replies: [],
      },
    ],
  },
];
