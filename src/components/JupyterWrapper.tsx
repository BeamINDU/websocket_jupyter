// components/JupyterWrapper.tsx
"use client";

import { Jupyter, Cell } from "@datalayer/jupyter-react";

export default function JupyterWrapper({ colorMode, theme }) {
  return (
    <Jupyter
      jupyterServerUrl="/api/jupyter" // This will use your local proxy instead of the remote server
      jupyterServerToken="60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6"
      colormode={colorMode}
      theme={theme}
      startDefaultKernel
    >
      <Cell source="print('Hello, world!')" />
    </Jupyter>
  );
}
