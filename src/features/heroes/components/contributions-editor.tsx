'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ContributionsEditorProps {
  contributions: string[];
  onChange: (contributions: string[]) => void;
}

export function ContributionsEditor({ contributions, onChange }: ContributionsEditorProps) {
  function updateAt(index: number, value: string) {
    onChange(contributions.map((c, i) => (i === index ? value : c)));
  }

  function removeAt(index: number) {
    onChange(contributions.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...contributions, '']);
  }

  return (
    <div className='space-y-2'>
      {contributions.map((contribution, index) => (
        <div key={index} className='flex items-center gap-2'>
          <Input
            value={contribution}
            onChange={(e) => updateAt(index, e.target.value)}
            placeholder='Ex.: Liderou o projeto X'
          />
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='shrink-0'
            disabled={contributions.length <= 1}
            onClick={() => removeAt(index)}
          >
            <Icons.close className='size-4' />
          </Button>
        </div>
      ))}
      <Button type='button' variant='outline' size='sm' onClick={add}>
        <Icons.add className='mr-1.5 size-4' />
        Adicionar contribuição
      </Button>
    </div>
  );
}
