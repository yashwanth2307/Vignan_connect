import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function Dialog({ open, onOpenChange, children }: any) {
    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => onOpenChange(false)}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative z-50 w-full max-w-lg p-6 bg-[hsl(var(--background))] border rounded-lg shadow-lg"
                    >
                        {children}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

export function DialogContent({ children, className }: any) {
    return <div className={`mt-4 ${className}`}>{children}</div>;
}

export function DialogHeader({ children, className }: any) {
    return <div className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}>{children}</div>;
}

export function DialogTitle({ children, className }: any) {
    return <h2 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h2>;
}

export function DialogTrigger({ children, asChild, onClick }: any) {
    if (asChild) {
        return React.cloneElement(children, {
            onClick: (e: any) => {
                if (onClick) onClick(e);
                if (children.props.onClick) children.props.onClick(e);
            }
        });
    }
    return <div onClick={onClick} className="inline-block cursor-pointer">{children}</div>;
}
