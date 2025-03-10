'use client';

import { useState, useCallback } from 'react';
import { Jupyter, Cell, Button } from '@datalayer/jupyter-react';
import type { Colormode, JupyterTheme } from '../types/jupyter';

// Define cell types and data structure
type CellType = 'code' | 'markdown';

interface CellData {
  id: string;
  source: string;
  cell_type: CellType;
}

interface CellComponentProps {
  colorMode: Colormode;
  theme: JupyterTheme;
}

export const InteractiveCellComponent = (props: CellComponentProps) => {
  const { colorMode, theme } = props;

  // Initialize with one empty code cell
  const [cells, setCells] = useState<CellData[]>([
    {
      id: 'cell-1',
      source: 'print("Hello, world!")',
      cell_type: 'code',
    },
  ]);

  // Generate a unique ID for new cells
  const generateCellId = () => `cell-${Date.now()}`;

  // Function to add a new code cell
  const addCodeCell = useCallback(() => {
    setCells(prevCells => [
      ...prevCells,
      {
        id: generateCellId(),
        source: '',
        cell_type: 'code',
      },
    ]);
  }, []);

  // Function to add a new markdown cell
  const addMarkdownCell = useCallback(() => {
    setCells(prevCells => [
      ...prevCells,
      {
        id: generateCellId(),
        source: '## New Markdown Cell',
        cell_type: 'markdown',
      },
    ]);
  }, []);

  // Function to delete a cell
  const deleteCell = useCallback((id: string) => {
    setCells(prevCells => prevCells.filter(cell => cell.id !== id));
  }, []);

  // Function to handle cell content changes
  const updateCellSource = useCallback((id: string, newSource: string) => {
    setCells(prevCells =>
      prevCells.map(cell =>
        cell.id === id ? { ...cell, source: newSource } : cell
      )
    );
  }, []);

  // Function to move cell up
  const moveCellUp = useCallback((index: number) => {
    if (index <= 0) return; // Can't move the first cell up

    setCells(prevCells => {
      const newCells = [...prevCells];
      [newCells[index - 1], newCells[index]] = [
        newCells[index],
        newCells[index - 1],
      ];
      return newCells;
    });
  }, []);

  // Function to move cell down
  const moveCellDown = useCallback((index: number) => {
    setCells(prevCells => {
      if (index >= prevCells.length - 1) return prevCells; // Can't move the last cell down

      const newCells = [...prevCells];
      [newCells[index], newCells[index + 1]] = [
        newCells[index + 1],
        newCells[index],
      ];
      return newCells;
    });
  }, []);

  // Function to toggle cell type between code and markdown
  const toggleCellType = useCallback((id: string) => {
    setCells(prevCells =>
      prevCells.map(cell =>
        cell.id === id
          ? {
              ...cell,
              cell_type: cell.cell_type === 'code' ? 'markdown' : 'code',
            }
          : cell
      )
    );
  }, []);

  return (
    <>
      <div style={{ fontSize: 20, marginBottom: 16 }}>
        Interactive Jupyter Cells
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <button
          onClick={addCodeCell}
          style={{
            padding: '8px 16px',
            backgroundColor: theme.colors.primary,
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Add Code Cell
        </button>
        <button
          onClick={addMarkdownCell}
          style={{
            padding: '8px 16px',
            backgroundColor: theme.colors.primary,
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Add Markdown Cell
        </button>
      </div>

      <Jupyter
        jupyterServerUrl="/api/jupyter" // This will use your local proxy instead of the remote server
        jupyterServerToken="60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6"
        colormode={colorMode}
        theme={theme}
        startDefaultKernel
      >
        {cells.map((cell, index) => (
          <div
            key={cell.id}
            style={{
              marginBottom: 16,
              position: 'relative',
              border: `1px solid ${theme.colors.text}20`,
              borderRadius: 4,
              padding: 8,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <div style={{ color: theme.colors.text, fontSize: 14 }}>
                {cell.cell_type === 'code' ? 'Code Cell' : 'Markdown Cell'}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => toggleCellType(cell.id)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: theme.colors.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  Toggle Type
                </button>
                <button
                  onClick={() => moveCellUp(index)}
                  disabled={index === 0}
                  style={{
                    padding: '4px 8px',
                    backgroundColor:
                      index === 0 ? '#ccc' : theme.colors.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: index === 0 ? 'not-allowed' : 'pointer',
                    fontSize: 12,
                  }}
                >
                  ▲
                </button>
                <button
                  onClick={() => moveCellDown(index)}
                  disabled={index === cells.length - 1}
                  style={{
                    padding: '4px 8px',
                    backgroundColor:
                      index === cells.length - 1
                        ? '#ccc'
                        : theme.colors.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor:
                      index === cells.length - 1 ? 'not-allowed' : 'pointer',
                    fontSize: 12,
                  }}
                >
                  ▼
                </button>
                <button
                  onClick={() => deleteCell(cell.id)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
            <Cell
              source={cell.source}
              cell_type={cell.cell_type}
              onChange={newSource => updateCellSource(cell.id, newSource)}
            />
          </div>
        ))}
      </Jupyter>
    </>
  );
};

export default InteractiveCellComponent;
