import React, { useState } from 'react';
import { motion } from 'framer-motion';

const FadeImage = ({ src, alt, className = '', ...props }) => {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <motion.div
            className={`relative overflow-hidden ${className}`}
            {...props}
        >
            {!isLoaded && (
                <div className="absolute inset-0 bg-brand-surface animate-pulse" />
            )}
            <img
                src={src}
                alt={alt}
                className={`w-full h-full object-cover transition-opacity duration-700 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setIsLoaded(true)}
                loading="lazy"
            />
        </motion.div>
    );
};

export default FadeImage;
