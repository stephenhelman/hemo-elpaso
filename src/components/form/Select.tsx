import React from "react";

interface Props {
  children: React.ReactNode;
  classNames: string;
  onChange: (e) => void;
  value: any;
}

export function Select({ children, classNames, onChange, value }: Props) {
  return (
    <select value={value} className={classNames} onChange={onChange}>
      {children}
    </select>
  );
}
