import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PaginationOptions } from '@/hooks/useFinancialEvents';

interface PaginationControlsProps {
  pagination: PaginationOptions;
  totalItems: number;
  onPaginationChange: (pagination: Partial<PaginationOptions>) => void;
  className?: string;
}

export function PaginationControls({
  pagination,
  totalItems,
  onPaginationChange,
  className,
}: PaginationControlsProps) {
  const totalPages = Math.ceil(totalItems / pagination.limit);
  const startItem = (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.page * pagination.limit, totalItems);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPaginationChange({ page });
    }
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 ${className}`}
    >
      <div className="text-sm text-muted-foreground order-2 sm:order-1">
        {totalItems > 0 ? (
          <>
            Exibindo{' '}
            <strong>
              {startItem}-{endItem}
            </strong>{' '}
            de <strong>{totalItems}</strong> resultados
          </>
        ) : (
          'Nenhum resultado encontrado'
        )}
      </div>

      <div className="flex items-center space-x-2 order-1 sm:order-2">
        <div className="flex items-center space-x-2 mr-4">
          <span className="text-sm text-muted-foreground hidden sm:inline">Itens por página</span>
          <Select
            value={String(pagination.limit)}
            onValueChange={(value) => onPaginationChange({ limit: Number(value), page: 1 })}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={String(pagination.limit)} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(1)}
            disabled={pagination.page === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="text-sm font-medium px-2">
            Página {pagination.page} de {totalPages || 1}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(totalPages)}
            disabled={pagination.page >= totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
