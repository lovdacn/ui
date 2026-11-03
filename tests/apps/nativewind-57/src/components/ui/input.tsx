import { getLvcnFontStyle } from '@/lib/lvcn-fonts';
import { cn } from '@/lib/utils';
import { TextInput } from '@/components/ui/primitives';
import { Platform } from 'react-native';

function Input({ className, style, ...props }: React.ComponentProps<typeof TextInput> & React.RefAttributes<TextInput>) {
  return (
    <TextInput
      className={cn('text-foreground flex h-10 w-full min-w-0 flex-row items-center shadow-black/5 sm:h-9 dark:bg-input/30 border-input min-h-9 rounded-md border bg-transparent px-2.5 py-1 text-base shadow-xs file:min-h-7 file:text-sm file:font-medium md:text-sm',
        props.editable === false &&
        cn(
          'opacity-50',
          Platform.select({ web: 'disabled:pointer-events-none disabled:cursor-not-allowed' })
        ),
        Platform.select({
          web: cn(
            'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground outline-none transition-[color,box-shadow] md:text-sm',
            'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
            'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive'
          ),
          native: 'placeholder:text-muted-foreground/50',
        }),
        className
      )}
      style={[style, getLvcnFontStyle(className)]}
      {...props}
    />
  );
}

export { Input };
