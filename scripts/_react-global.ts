// tsx compiles JSX with the classic runtime here (tsconfig has jsx: preserve), which needs a global React.
import React from "react";
(globalThis as unknown as { React: typeof React }).React = React;
