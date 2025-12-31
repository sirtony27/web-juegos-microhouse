import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ImageOff, Loader } from 'lucide-react';

const FadeImage = ({ src, alt, className = '', priority = false, ...props }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    return (
        <motion.div
            className={`relative overflow-hidden bg-gray-800 ${className}`}
            {...props}
        >
            {/* Loading Skeleton */}
            {!isLoaded && !hasError && (
                <div className="absolute inset-0 bg-white/5 animate-pulse flex items-center justify-center">
                    <Loader className="w-6 h-6 text-white/20 animate-spin" />
                </div>
            )}

            {/* Error Fallback */}
            {hasError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 text-gray-500 p-2">
                    <ImageOff size={24} className="mb-1 opacity-50" />
                    <span className="text-[10px] font-mono opacity-50 text-center truncate w-full px-2">
                        Sin imagen
                    </span>
                </div>
            ) : (
                <img
                    src={src}
                    alt={alt}
                    className={`w-full h-full object-cover transition-opacity duration-700 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setIsLoaded(true)}
                    onError={() => {
                        setHasError(true);
                        setIsLoaded(true); // Stop loading state
                    }}
                    loading={priority ? "eager" : "lazy"}
                    decoding="async"
                />
            )}
        </motion.div>
    );
};

export default FadeImage;
