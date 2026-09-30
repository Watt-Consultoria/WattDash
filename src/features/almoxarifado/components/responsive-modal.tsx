'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle
} from '@/components/ui/drawer';
import { Icons } from '@/components/icons';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  icon?: keyof typeof Icons;
  children: React.ReactNode;
}

function ModalIcon({ icon }: { icon?: keyof typeof Icons }) {
  if (!icon) return null;
  const Icon = Icons[icon];
  return (
    <span className='bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-full'>
      <Icon className='text-primary size-4' />
    </span>
  );
}

/**
 * Bottom sheet arrastável no celular (alcance do polegar, gesto de fechar) e diálogo
 * centralizado no desktop. Use `ResponsiveModalActions` para os botões do rodapé.
 */
export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  icon,
  children
}: ResponsiveModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className='data-[vaul-drawer-direction=bottom]:max-h-[92dvh]'>
          <DrawerHeader className='text-left'>
            <DrawerTitle className='flex items-center gap-2 text-lg'>
              <ModalIcon icon={icon} />
              {title}
            </DrawerTitle>
            {description && <DrawerDescription>{description}</DrawerDescription>}
          </DrawerHeader>
          <div className='overflow-y-auto overscroll-contain px-4'>{children}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90dvh] w-[min(95vw,520px)] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <ModalIcon icon={icon} />
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

/** Rodapé fixo no bottom sheet (com safe-area do iOS) e alinhado à direita no desktop. */
export function ResponsiveModalActions({ children }: { children: React.ReactNode }) {
  return (
    <div className='bg-background sticky bottom-0 -mx-4 mt-2 flex flex-col-reverse gap-2 border-t px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] md:static md:mx-0 md:flex-row md:justify-end md:border-0 md:p-0 [&_button]:h-11 md:[&_button]:h-9'>
      {children}
    </div>
  );
}
