import React, { useState, useEffect } from "react";
import { Calendar, Clock, Loader2, MapPin } from "lucide-react";
import { FlippableCard } from "../FlippableCard";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  type: string;
  attendees?: string[];
  location?: string;
  description?: string;
}

// Helper to format time
const formatTime = (dateString: string | null): string => {
  if (!dateString) return 'All Day';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Time';
    
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC' // Ensure consistent timezone handling
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid Time';
  }
};

// Helper to get time range string
const getTimeRange = (start: string | null, end: string | null): string => {
  if (!start && !end) return 'All Day';
  if (!start) return `Until ${formatTime(end)}`;
  if (!end) return `From ${formatTime(start)}`;
  
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return 'Invalid Time Range';
    }
    
    // If same day, show time range, otherwise include dates
    if (startDate.toDateString() === endDate.toDateString()) {
      return `${formatTime(start)} - ${formatTime(end)}`;
    } else {
      // Show date and time for multi-day events
      return `${startDate.toLocaleString()} - ${endDate.toLocaleString()}`;
    }
  } catch (error) {
    console.error('Error creating time range:', error);
    return 'Invalid Time Range';
  }
};

interface CalendarWidgetProps {
  onExpand?: () => void;
  icon?: React.ReactNode;
  date?: Date;
}

export function CalendarWidget({ onExpand, icon, date = new Date() }: CalendarWidgetProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Format date as YYYY-MM-DD
  const dateString = date.toISOString().split('T')[0];

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5004/get_calendar_events?date=${dateString}`);
        if (!response.ok) {
          throw new Error('Failed to fetch calendar events');
        }
        const data = await response.json();
        setEvents(data.events || []);
      } catch (err) {
        console.error('Error fetching calendar events:', err);
        setError('Failed to load calendar events');
        // Fallback to sample data if API fails
        setEvents([
          {
            id: '1',
            title: 'Sample Meeting',
            start_time: new Date().setHours(10, 0, 0, 0).toString(),
            end_time: new Date().setHours(11, 0, 0, 0).toString(),
            type: 'meeting',
            attendees: ['John', 'Jane', 'Bob']
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [dateString]);

  // Get the next upcoming event
  const now = new Date();
  const upcomingEvents = events
    .filter(event => new Date(event.end_time) > now)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const nextEvent = upcomingEvents[0];
  const frontContent = (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">
        {date.toDateString() === new Date().toDateString() 
          ? "Today's schedule:" 
          : `Schedule for ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}:`
        }
      </p>
      
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="p-3 text-sm text-red-500 bg-red-50 rounded">{error}</div>
      ) : events.length === 0 ? (
        <div className="text-sm text-gray-500 text-center py-4">No events scheduled</div>
      ) : (
        <ul className="space-y-3">
          {events.slice(0, 3).map((event) => (
            <li key={event.id} className="flex items-start gap-2">
              <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${
                event.type === 'important' ? 'bg-red-500' : 
                event.type === 'meeting' ? 'bg-blue-500' : 'bg-gray-300'
              }`}></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 font-medium">{event.summary}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-500">
                    {getTimeRange(event.start_time, event.end_time)}
                  </span>
                  {event.attendees && event.attendees.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {event.attendees.length} {event.attendees.length === 1 ? 'person' : 'people'}
                    </Badge>
                  )}
                </div>
                {event.location && (
                  <div className="text-xs text-gray-500 mt-1">{event.location}</div>
                )}
              </div>
            </li>
          ))}
          {events.length > 3 && (
            <li className="text-xs text-blue-600 text-center pt-2">
              +{events.length - 3} more events
            </li>
          )}
        </ul>
      )}
      
      {nextEvent && (
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                Next: {nextEvent.summary}
              </p>
              <p className="text-xs text-gray-500">
                {formatTime(nextEvent.start_time)}
              </p>
            </div>
            <Badge 
              variant={nextEvent.type === 'important' ? 'destructive' : 'default'}
              className="text-xs"
            >
              {nextEvent.type}
            </Badge>
          </div>
        </div>
      )}
      
      <p className="text-xs text-gray-500 mt-4 italic">
        {onExpand ? 'Click to manage schedule' : 'Swipe to see full calendar'}
      </p>
    </div>
  );

  const backContent = (
    <div className="space-y-6">
      {/* Today's Timeline */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">
          {date.toDateString() === new Date().toDateString() 
            ? "Today's Timeline" 
            : `Timeline for ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`
          }
        </h4>
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded">{error}</div>
          ) : events.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-4">No events scheduled</div>
          ) : (
            events.map((event) => (
              <div key={event.id} className={`p-3 rounded-lg border-l-4 ${
                event.type === "important" ? "bg-red-50 border-red-300" : 
                event.type === "meeting" ? "bg-blue-50 border-blue-300" : 
                "bg-green-50 border-green-300"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-sm">{event.summary}</h5>
                  <Badge 
                    variant={event.type === "important" ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {event.attendees?.length || 0} {event.attendees?.length === 1 ? 'person' : 'people'}
                  </Badge>
                </div>
                <div className="text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{getTimeRange(event.start_time, event.end_time)}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Time Grid Overview */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Time Blocks</h4>
        <div className="grid grid-cols-4 gap-2">
          {events.length > 0 ? (
            // Show first 4 events or available time slots
            Array(4).fill(0).map((_, index) => {
              const event = events[index];
              if (!event) return (
                <div key={`empty-${index}`} className="text-center">
                  <div className="text-xs text-gray-500 mb-1">--:--</div>
                  <div className="h-10 rounded bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center">
                    <span className="text-xs text-gray-400">Free</span>
                  </div>
                </div>
              );
              
              const startTime = new Date(event.start_time);
              const timeStr = startTime.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              });
              
              return (
                <div key={event.id} className="text-center">
                  <div className="text-xs text-gray-500 mb-1">{timeStr}</div>
                  <div 
                    className={`h-10 rounded text-xs flex items-center justify-center overflow-hidden ${
                      event.type === 'important' ? 'bg-red-50 text-red-800' : 
                      event.type === 'meeting' ? 'bg-blue-50 text-blue-800' : 
                      'bg-green-50 text-green-800'
                    }`}
                  >
                    <span className="truncate px-1">{event.summary}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-4 text-center py-4 text-sm text-gray-500">
              No events scheduled
            </div>
          )}
        </div>
      </div>

      {/* Calendar Actions */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
        <div className="space-y-2">
          <Button size="sm" className="w-full justify-start">
            {/* <Shield className="h-4 w-4 mr-2" /> */}
            Defend Focus Time (2 hours available)
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline" className="justify-start">
              {/* <RotateCcw className="h-4 w-4 mr-2" /> */}
              Reschedule
            </Button>
            <Button size="sm" variant="outline" className="justify-start">
              {/* <Mail className="h-4 w-4 mr-2" /> */}
              Send Note
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Stats */}
      <div className="bg-blue-50 p-3 rounded-lg">
        <h5 className="font-medium text-sm mb-2">Today's Summary</h5>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="font-medium text-blue-600">{events.length}</div>
            <div className="text-gray-600">Meetings</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-green-600">4</div>
            <div className="text-gray-600">Free Hours</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-orange-600">1</div>
            <div className="text-gray-600">Priority</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <FlippableCard
      icon={icon || <Calendar className="h-5 w-5" />}
      title="Today"
      frontContent={frontContent}
      backContent={backContent}
      onExpand={onExpand}
    />
  );
}