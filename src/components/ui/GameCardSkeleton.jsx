import React from 'react';

const GameCardSkeleton = () => {
    return (
        <div className="h-full flex flex-col bg-brand-surface/50 border border-white/5 rounded-xl overflow-hidden shadow-sm relative animate-pulse">
            {/* Image Area Skeleton */}
            <div className="relative w-full aspect-[3/4] bg-neutral-800/50">
                {/* Platform Strip Skeleton */}
                <div className="absolute top-0 left-0 right-0 h-6 bg-white/5"></div>
            </div>

            {/* Info Area Skeleton */}
            <div className="p-4 flex flex-col flex-grow gap-2">
                {/* Title Skeleton */}
                <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-white/10 rounded w-1/2"></div>

                <div className="mt-auto pt-4 flex items-end justify-between">
                    {/* Price Skeleton */}
                    <div className="h-6 bg-white/10 rounded w-20"></div>
                </div>
            </div>
        </div>
    );
};

export default GameCardSkeleton;
