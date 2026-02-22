type SkeletonProps = {
  className?: string;
};

export const Skeleton = ({ className = "" }: SkeletonProps) => (
  <div className={`animate-pulse rounded-full bg-white/10 ${className}`} />
);

