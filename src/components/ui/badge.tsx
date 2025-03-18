import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'bg-primary/10 text-primary hover:bg-primary/20',
        secondary:
          'bg-secondary/10 text-secondary hover:bg-secondary/20',
        destructive:
          'bg-destructive/10 text-destructive hover:bg-destructive/20',
        success:
          'bg-green-500/10 text-green-500 hover:bg-green-500/20',
        warning:
          'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20',
        outline:
          'text-foreground border border-input hover:bg-accent hover:text-accent-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants }; 