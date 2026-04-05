import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

const pageVariants = {
    initial: {
        opacity: 0,
        y: 20,
        filter: 'blur(4px)',
        scale: 0.99
    },
    in: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        scale: 1
    },
    out: {
        opacity: 0,
        y: -20,
        filter: 'blur(4px)',
        scale: 0.99
    }
};

const pageTransition = {
    type: 'tween',
    ease: [0.25, 0.1, 0.25, 1],
    duration: 0.3
} as const;

export function PageTransition({ children }: { children: ReactNode }) {
    return (
        <motion.div
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="page-transition-wrapper"
        >
            {children}
        </motion.div>
    );
}
