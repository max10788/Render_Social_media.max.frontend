// src/components/ui/select.js
import React from 'react';

const Select = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={`relative ${className}`}>
      <select
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        {...props}
      >
        {children}
      </select>
    </div>
  );
});
Select.displayName = "Select";

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 ${className}`}
    {...props}
  >
    {children}
  </div>
));
SelectTrigger.displayName = "SelectTrigger";

const SelectValue = React.forwardRef(({ className, ...props }, ref) => (
  <span ref={ref} className={className} {...props} />
));
SelectValue.displayName = "SelectValue";

const SelectContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={`relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ${className}`}
    {...props}
  >
    <div className="p-1">
      {children}
    </div>
  </div>
));
SelectContent.displayName = "SelectContent";

const SelectItem = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${className}`}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      {/* Add checkmark here if needed */}
    </span>
    <span className="truncate">{children}</span>
  </div>
));
SelectItem.displayName = "SelectItem";

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
