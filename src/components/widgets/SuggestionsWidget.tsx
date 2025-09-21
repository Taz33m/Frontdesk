import { Lightbulb, Check, X, Clock, ChevronUp, ChevronDown } from "lucide-react";
import { FlippableCard } from "../FlippableCard";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useState, useEffect } from "react";

interface EmailEvent {
  id: string;
  email_subject: string;
  email_sender: string;
  event_description: string;
  event_date: string | null;
  event_time: string | null;
  event_location: string | null;
  event_type: string;
  priority: number;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  time: string;
  startHour: number;
  duration: number;
  reason: string;
  type: string;
  confidence: "high" | "medium" | "low";
  location: string;
}

// Helper function to format time
const formatTime = (hour: number, minutes: number = 0): string => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  const mins = minutes.toString().padStart(2, '0');
  return `${displayHour}:${mins} ${period}`;
};

// Helper to generate time range string
const getTimeRange = (startHour: number, duration: number): string => {
  const endHour = startHour + Math.ceil(duration);
  return `${formatTime(startHour)} - ${formatTime(endHour)}`;
};

// Process email events into suggestions
const processEmailEvents = (events: EmailEvent[]): Suggestion[] => {
  return events
    .filter(event => event.event_type && event.event_description && event.priority <= 2)
    .slice(0, 5) // Limit to top 5 suggestions
    .map((event, index) => {
      // Default to current day if no date is provided
      const eventDate = event.event_date || new Date().toISOString().split('T')[0];
      const eventTime = event.event_time ? event.event_time.split(':') : ['10', '00'];
      
      // Create a base hour (9 AM to 5 PM window)
      const baseHour = 9 + (index % 8);
      const startHour = eventTime ? parseInt(eventTime[0]) : baseHour;
      const duration = event.event_type === 'meeting' ? 0.5 : 1; // Default durations
      
      return {
        id: event.id,
        title: event.event_description.length > 30 
          ? `${event.event_description.substring(0, 30)}...` 
          : event.event_description,
        description: event.email_subject || 'No description available',
        time: getTimeRange(startHour, duration),
        startHour,
        duration,
        reason: `Based on your ${event.event_type} from ${event.email_sender?.split('<')[0]?.trim() || 'a contact'}`,
        type: event.event_type || 'other',
        confidence: index % 3 === 0 ? 'high' : index % 3 === 1 ? 'medium' : 'low',
        location: event.event_location || 'Not specified'
      };
    });
};

interface SuggestionsWidgetProps {
  onExpand?: () => void;
}

export function SuggestionsWidget({ onExpand }: SuggestionsWidgetProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<{[key: string]: 'accepting' | 'removing' | null}>({});

  // Fetch email events and process them into suggestions
  useEffect(() => {
    const fetchEmailEvents = async () => {
      try {
        // In a real app, this would be an API call to your backend
        // For now, we'll use the local JSON file
        const response = await fetch('/mails_widget/email_events.json');
        if (!response.ok) {
          throw new Error('Failed to fetch email events');
        }
        const data = await response.json();
        const processed = processEmailEvents(data.events);
        setSuggestions(processed);
      } catch (err) {
        console.error('Error fetching email events:', err);
        setError('Failed to load suggestions. Using sample data instead.');
        // Fallback to sample data
        setSuggestions([
          {
            id: 'sample1',
            title: 'Sample Meeting',
            description: 'Example meeting from sample data',
            time: '10:00 AM - 11:00 AM',
            startHour: 10,
            duration: 1,
            reason: 'Sample reason',
            type: 'meeting',
            confidence: 'medium',
            location: 'Sample Location'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchEmailEvents();
  }, []);

  // Handle removing a suggestion
  const handleRemoveSuggestion = (id: string) => {
    setSuggestions(prev => prev.filter(suggestion => suggestion.id !== id));
  };

  // Handle accepting a suggestion and creating a calendar event
  const handleAcceptSuggestion = async (suggestion: Suggestion) => {
    try {
      setProcessing(prev => ({ ...prev, [suggestion.id]: 'accepting' }));
      
      // Get current date and time
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Create start time (using today's date and the suggested hour)
      const startTime = new Date(today);
      startTime.setHours(suggestion.startHour, 0, 0, 0);
      
      // If the suggested hour has already passed today, schedule for the next day
      if (startTime < now) {
        startTime.setDate(startTime.getDate() + 1);
      }
      
      // Create end time by adding duration to start time
      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + suggestion.duration);
      
      // Format date as YYYY-MM-DD
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      // Format time as HH:MM
      const formatTime = (date: Date) => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      };

      // Create event data in required format
      const eventData = {
        summary: suggestion.title,
        description: `${suggestion.description}\n\n${suggestion.reason}\n\nLocation: ${suggestion.location}`,
        location: suggestion.location,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        start: {
          date: formatDate(startTime),
          time: formatTime(startTime)
        },
        end: {
          date: formatDate(endTime),
          time: formatTime(endTime)
        },
        reminders: {
          useDefault: true
        }
      };

      // Send request to create calendar event
      const response = await fetch('http://localhost:5004/create_calendar_event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create calendar event');
      }

      // Remove the suggestion after successful creation
      handleRemoveSuggestion(suggestion.id);
      alert('Event added to your calendar successfully!');
    } catch (error) {
      console.error('Error creating calendar event:', error);
      alert(`Failed to add event to calendar: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(prev => ({ ...prev, [suggestion.id]: null }));
    }
  };

  // Handle time adjustment
  const adjustTime = (id: string, increment: boolean) => {
    setSuggestions(prev => 
      prev.map(suggestion => {
        if (suggestion.id !== id) return suggestion;
        
        const newStartHour = increment 
          ? Math.min(17, suggestion.startHour + 1) // Don't go past 5 PM
          : Math.max(8, suggestion.startHour - 1); // Don't go before 8 AM
        
        return {
          ...suggestion,
          startHour: newStartHour,
          time: getTimeRange(newStartHour, suggestion.duration)
        };
      })
    );
  };

  const content = (
    <div className="flex flex-col h-full">
      <div className="space-y-3 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded">{error}</div>
        ) : suggestions.length === 0 ? (
          <div className="p-3 text-sm text-gray-500 text-center">No suggestions available</div>
        ) : (
          suggestions.map((suggestion) => (
            <div key={suggestion.id} className="p-3 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-sm">{suggestion.title}</h4>
                  <p className="text-xs text-gray-600 line-clamp-1">{suggestion.description}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-500">{suggestion.time}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-gray-500">{suggestion.location}</span>
                  </div>
                </div>
                <Badge 
                  variant={suggestion.confidence === 'high' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {suggestion.confidence}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-6 w-6" 
                  onClick={(e) => {
                    e.stopPropagation();
                    adjustTime(suggestion.id, false);
                  }}
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
                
                <div className="text-xs text-center w-8">
                  {formatTime(suggestion.startHour)}
                </div>
                
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    adjustTime(suggestion.id, true);
                  }}
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
                
                <div className="flex-1" />
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 px-2"
                  disabled={processing[suggestion.id] === 'accepting'}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAcceptSuggestion(suggestion);
                  }}
                >
                  {processing[suggestion.id] === 'accepting' ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-900 mr-1"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Accept
                    </>
                  )}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 px-2"
                  disabled={processing[suggestion.id] === 'removing'}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveSuggestion(suggestion.id);
                  }}
                >
                  {processing[suggestion.id] === 'removing' ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-900"></div>
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <FlippableCard
      icon={<Lightbulb className="h-4 w-4" />}
      title="Calendar Suggestions"
      count={suggestions.length}
      frontContent={content}
      backContent={null}
      defaultFlipped={false}
    />
  );
}