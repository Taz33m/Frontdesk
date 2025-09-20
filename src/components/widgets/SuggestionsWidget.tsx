import { Lightbulb, Check, X, Clock, Info } from "lucide-react";
import { FlippableCard } from "../FlippableCard";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

const suggestions = [
  {
    id: 1,
    title: "Morning Focus Block",
    description: "2-hour deep work session",
    time: "9:00 AM - 11:00 AM",
    reason: "Based on your productivity patterns, you're most focused in the morning",
    type: "focus",
    confidence: "high"
  },
  {
    id: 2,
    title: "Quick Team Sync",
    description: "15min standup with design team",
    time: "2:30 PM - 2:45 PM",
    reason: "You haven't connected with the design team this week",
    type: "meeting",
    confidence: "medium"
  }
];

const calendarDays = [
  { date: 19, isToday: false, events: [] },
  { date: 20, isToday: true, events: [{ type: "suggestion", color: "bg-yellow-200" }, { type: "existing", color: "bg-blue-200" }] },
  { date: 21, isToday: false, events: [{ type: "suggestion", color: "bg-yellow-200" }] },
  { date: 22, isToday: false, events: [] },
  { date: 23, isToday: false, events: [{ type: "existing", color: "bg-blue-200" }] },
  { date: 24, isToday: false, events: [] },
  { date: 25, isToday: false, events: [] }
];

interface SuggestionsWidgetProps {
  onExpand?: () => void;
}

export function SuggestionsWidget({ onExpand }: SuggestionsWidgetProps) {
  const frontContent = (
    <div className="flex flex-col h-full">
      {/* Mini Calendar */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-xs text-gray-500 text-center py-1">{day}</div>
        ))}
        {calendarDays.map((day, i) => (
          <div key={i} className="relative">
            <div className={`text-xs text-center py-1 rounded ${
              day.isToday ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
            }`}>
              {day.date}
            </div>
            {day.events.length > 0 && (
              <div className="flex gap-0.5 mt-1 justify-center">
                {day.events.map((event, j) => (
                  <div key={j} className={`w-1 h-1 rounded-full ${event.color}`} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* New Proposals */}
      <div className="space-y-2 flex-1">
        <div className="flex items-center gap-2 mb-2">
          <h4 className="text-sm font-medium">AI Suggestions</h4>
          <Badge variant="secondary" className="text-xs">2 new</Badge>
        </div>
        
        {suggestions.slice(0, 2).map((suggestion) => (
          <TooltipProvider key={suggestion.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-2 rounded-lg bg-yellow-50 border border-yellow-200 cursor-help">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span className="text-sm font-medium">{suggestion.title}</span>
                    <Info className="h-3 w-3 text-yellow-600 ml-auto" />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{suggestion.time}</p>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-sm">{suggestion.reason}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );

  const backContent = (
    <div className="flex flex-col h-full">
      <div className="space-y-3 flex-1">
        {suggestions.map((suggestion) => (
          <div key={suggestion.id} className="p-3 rounded-lg border border-gray-200">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-medium text-sm">{suggestion.title}</h4>
                <p className="text-xs text-gray-600">{suggestion.description}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{suggestion.time}</span>
                </div>
              </div>
              <Badge 
                variant={suggestion.confidence === 'high' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {suggestion.confidence}
              </Badge>
            </div>
            
            <div className="flex gap-2 mt-3">
              <Button size="sm" className="flex-1">
                <Check className="h-3 w-3 mr-1" />
                Accept
              </Button>
              <Button size="sm" variant="outline">
                Maybe
              </Button>
              <Button size="sm" variant="outline">
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-500">Drag events to reschedule</p>
      </div>
    </div>
  );

  return (
    <FlippableCard
      icon={<Lightbulb className="h-4 w-4" />}
      title="Suggestions"
      count={2}
      frontContent={frontContent}
      backContent={backContent}
      onExpand={onExpand}
    />
  );
}