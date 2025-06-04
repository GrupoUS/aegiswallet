
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const NewsLoadingSkeleton = () => {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, index) => (
        <Card key={index} className="animate-pulse overflow-hidden">
          {/* Image skeleton */}
          <Skeleton className="h-48 w-full" />
          
          <CardHeader className="pb-3">
            {/* Title skeleton */}
            <Skeleton className="h-6 w-3/4 mb-2" />
            {/* Date skeleton */}
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          
          <CardContent className="pt-0">
            {/* Summary label skeleton */}
            <Skeleton className="h-4 w-16 mb-2" />
            {/* Summary text skeleton */}
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3 mb-4" />
            {/* Button skeleton */}
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default NewsLoadingSkeleton;
