
import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  value?: number[];
  defaultValue?: number[];
  labels?: {
    min: string;
    max: string;
  };
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, value, defaultValue, labels = { min: "Fácil", max: "Máximo" }, ...props }, ref) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm text-gray-600">
        <span>{labels.min}</span>
        <span>{labels.max}</span>
      </div>
      <div className="pt-6">
        <div className="relative">
          <SliderPrimitive.Root
            ref={ref}
            defaultValue={defaultValue}
            value={value}
            className={cn(
              "relative flex w-full touch-none select-none items-center",
              className
            )}
            {...props}
          >
            <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-violet-100">
              <SliderPrimitive.Range className="absolute h-full bg-violet-500" />
            </SliderPrimitive.Track>
            
            <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-violet-500 bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
          </SliderPrimitive.Root>
          
          {/* Custom tooltip implementation positioned absolutely */}
          {value && (
            <div 
              className="absolute bg-violet-500 text-white text-xs font-medium px-2 py-1 rounded-md left-0 top-0 -translate-y-full transform"
              style={{
                left: `calc(${((value[0] - (props.min || 1)) / ((props.max || 10) - (props.min || 1))) * 100}% - 8px)`,
                marginTop: "-8px",
              }}
            >
              {value[0]}
            </div>
          )}
        </div>
      </div>
    </div>
  );
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
