// src/components/NotebookComponent.tsx
"use client";

import {
  Jupyter,
  Notebook,
  CellSidebar,
  NotebookToolbar,
} from "@datalayer/jupyter-react";
import type { Colormode, JupyterTheme } from "../types/jupyter";

interface NotebookComponentProps {
  colorMode: Colormode;
  theme: JupyterTheme;
}

export const NotebookComponent = (props: NotebookComponentProps) => {
  const { colorMode, theme } = props;

  const containerStyle = {
    fontSize: 20,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
    padding: theme.spacing?.medium || 16,
  };

  return (
    <>
      <div style={containerStyle}>Jupyter Notebook in Next.js</div>
      <Jupyter
        jupyterServerUrl="/api/jupyter" // This will use your local proxy instead of the remote server
        jupyterServerToken="60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6"
        colormode={colorMode}
        theme={theme}
        startDefaultKernel
      >
        <Notebook
          path="ipywidgets.ipynb"
          id="notebook-nextjs-1"
          cellSidebarMargin={120}
          height="500px"
          CellSidebar={CellSidebar}
          Toolbar={NotebookToolbar}
        />
      </Jupyter>
    </>
  );
};

export default NotebookComponent;
