
import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useIsMobile } from "@/hooks/use-mobile"

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  value?: number[];
  defaultValue?: number[];
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, value, defaultValue, ...props }, ref) => {
  const isMobile = useIsMobile();
  
  return (
    <SliderPrimitive.Root
      ref={ref}
      defaultValue={defaultValue}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-200">
        <SliderPrimitive.Range className="absolute h-full bg-sensa-purple" />
      </SliderPrimitive.Track>
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger asChild>
            <SliderPrimitive.Thumb className="block h-6 w-6 rounded-full border-2 border-sensa-purple bg-white ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
          </TooltipTrigger>
          {value && (
            <TooltipContent 
              className={cn(
                "bg-sensa-purple text-white text-xs font-medium px-2 py-1",
                isMobile ? "-translate-y-6" : "-translate-y-2"
              )}
              side="bottom"
              sideOffset={4}
            >
              {value[0]}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </SliderPrimitive.Root>
  );
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
