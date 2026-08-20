'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Icons } from '@/components/icons';
import { CATEGORY_CHART_COLORS, WALLET_CATEGORY_LABEL, formatBRL } from '../lib/wallet-format';
import type { ReimbursementCategory } from '@/types/api';

interface ExpenseCategoryChartProps {
  data: { category: ReimbursementCategory; total: number }[];
}

function CustomTooltip({
  active,
  payload
}: {
  active?: boolean;
  payload?: { payload: { category: ReimbursementCategory; total: number } }[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className='rounded-lg border bg-popover px-3 py-2 shadow-md text-sm'>
      <p className='font-medium'>{WALLET_CATEGORY_LABEL[item.category] ?? item.category}</p>
      <p className='text-muted-foreground'>{formatBRL(item.total)}</p>
    </div>
  );
}

export function ExpenseCategoryChart({ data }: ExpenseCategoryChartProps) {
  if (data.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center gap-2 py-10 text-center'>
        <Icons.receipt className='size-8 text-muted-foreground' />
        <p className='text-muted-foreground text-sm'>Nenhuma despesa no período</p>
      </div>
    );
  }

  const total = data.reduce((acc, d) => acc + d.total, 0);
  const chartData = data.map((d) => ({
    ...d,
    label: WALLET_CATEGORY_LABEL[d.category] ?? d.category
  }));

  return (
    <div className='space-y-3'>
      <div className='relative h-[180px] w-full'>
        <ResponsiveContainer width='100%' height='100%'>
          <PieChart>
            <Pie
              data={chartData}
              dataKey='total'
              nameKey='label'
              cx='50%'
              cy='50%'
              outerRadius={80}
              innerRadius={46}
              paddingAngle={3}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={index}
                  fill={CATEGORY_CHART_COLORS[index % CATEGORY_CHART_COLORS.length]}
                  stroke='transparent'
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center'>
          <span className='text-muted-foreground text-[11px]'>Total</span>
          <span className='text-sm font-semibold tabular-nums'>{formatBRL(total)}</span>
        </div>
      </div>
      <div className='flex flex-wrap justify-center gap-x-4 gap-y-1.5'>
        {chartData.map((item, index) => (
          <div key={index} className='flex items-center gap-1.5 text-xs'>
            <span
              className='size-2.5 flex-shrink-0 rounded-full'
              style={{
                backgroundColor: CATEGORY_CHART_COLORS[index % CATEGORY_CHART_COLORS.length]
              }}
            />
            <span className='text-muted-foreground'>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
