import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import type { AlmoxarifadoMaterial } from '@/types/almoxarifado';

const LOW_STOCK_THRESHOLD = 2;

function StockIndicator({ quantity }: { quantity: number }) {
  const tone =
    quantity === 0
      ? { dot: 'bg-red-500', text: 'text-red-700 dark:text-red-400', label: 'Sem estoque' }
      : quantity <= LOW_STOCK_THRESHOLD
        ? {
            dot: 'bg-amber-500',
            text: 'text-amber-700 dark:text-amber-400',
            label: quantity === 1 ? 'Última unidade' : `Últimas ${quantity} unidades`
          }
        : {
            dot: 'bg-green-500',
            text: 'text-green-700 dark:text-green-400',
            label: `${quantity} disponíveis`
          };

  return (
    <p className={cn('flex items-center gap-1.5 text-xs font-medium', tone.text)}>
      <span aria-hidden className={cn('size-2 rounded-full', tone.dot)} />
      {tone.label}
    </p>
  );
}

interface MaterialCardProps {
  material: AlmoxarifadoMaterial;
  canManage: boolean;
  onRequestLoan: (materialId: string) => void;
  onEdit: (material: AlmoxarifadoMaterial) => void;
}

export function MaterialCard({ material, canManage, onRequestLoan, onEdit }: MaterialCardProps) {
  const isUnavailable = material.quantidade_estoque === 0;

  return (
    <Card className='hover:border-primary/40 h-full gap-0 py-0 motion-safe:transition-colors'>
      <CardContent className='flex h-full flex-col gap-3 p-4'>
        <div className='flex items-start gap-3'>
          <span
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-lg',
              isUnavailable ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
            )}
          >
            <Icons.package className='size-5' aria-hidden />
          </span>
          <div className='min-w-0 flex-1 space-y-1'>
            <h3 className='truncate leading-tight font-medium'>{material.nome}</h3>
            <StockIndicator quantity={material.quantidade_estoque} />
          </div>
          {canManage && (
            <Button
              variant='ghost'
              size='icon'
              className='-mt-1 -mr-2 size-10 shrink-0 md:size-8'
              onClick={() => onEdit(material)}
              aria-label={`Editar ${material.nome}`}
            >
              <Icons.edit className='size-4' />
            </Button>
          )}
        </div>

        <p className='text-muted-foreground line-clamp-3 text-sm'>{material.descricao}</p>

        {material.observacoes && (
          <p className='bg-muted/60 text-muted-foreground flex gap-1.5 rounded-md px-2.5 py-1.5 text-xs'>
            <Icons.info className='mt-px size-3.5 shrink-0' aria-hidden />
            <span className='line-clamp-2'>{material.observacoes}</span>
          </p>
        )}

        <Button
          className='mt-auto h-11 w-full md:h-9'
          variant={isUnavailable ? 'secondary' : 'default'}
          disabled={isUnavailable}
          onClick={() => onRequestLoan(material.id)}
        >
          {isUnavailable ? (
            'Indisponível no momento'
          ) : (
            <>
              <Icons.plusCircle className='mr-1.5 size-4' />
              Pegar emprestado
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
