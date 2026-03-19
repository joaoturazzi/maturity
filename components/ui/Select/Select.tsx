// TODO: Implement Select component
import { forwardRef } from 'react';

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ children, ...props }, ref) => {
    return <select ref={ref} {...props}>{children}</select>;
  }
);

Select.displayName = 'Select';
