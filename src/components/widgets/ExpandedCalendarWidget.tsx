import { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Video, 
  MapPin, 
  Users, 
  Plus,
  Loader2,
  AlertCircle,
  Shield
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Separator } from "../ui/separator";

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  type: string;
  attendees?: string[];
  location?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  color?: string; // Added missing color property
  duration?: number; // Added duration in minutes
}

// Helper to format date as YYYY-MM-DD
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Helper to format time
const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

// Helper to get time range string
const getTimeRange = (start: string, end: string): string => {
  return `${formatTime(start)} - ${formatTime(end)}`;
};

// Generate time slots from 8 AM to 8 PM
const generateTimeSlots = () => {
  return Array.from({ length: 13 }, (_, i) => {
    const hour = i + 8; // 8 AM to 8 PM
    const time12 = hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 ${hour === 12 ? 'PM' : 'AM'}`;
    return {
      time: time12,
      hour24: `${hour.toString().padStart(2, '0')}:00`,
      events: [] as CalendarEvent[]
    };
  });
};

export function ExpandedCalendarWidget() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState(generateTimeSlots());

  // Format date for API
  const dateString = formatDate(currentDate);

  // Fetch events for the current date
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
            title: 'Team Standup',
            start_time: new Date(currentDate.setHours(10, 0, 0, 0)).toISOString(),
            end_time: new Date(currentDate.setHours(10, 30, 0, 0)).toISOString(),
            type: 'meeting',
            attendees: ['John', 'Jane', 'Bob'],
            location: 'Conference Room A'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [dateString]);

  // Map events to time slots whenever events change
  useEffect(() => {
    const slots = generateTimeSlots();
    const slotsWithEvents = slots.map(slot => {
      const slotHour = parseInt(slot.hour24.split(':')[0]);
      const slotEvents = events.filter(event => {
        const eventStartHour = new Date(event.start_time).getHours();
        const eventEndHour = new Date(event.end_time).getHours();
        // Include events that overlap with this time slot
        return eventStartHour <= slotHour && eventEndHour >= slotHour;
      }).map(event => ({
        ...event,
        // Calculate duration in minutes
        duration: (new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / (1000 * 60),
        // Set a default color if not provided
        color: event.color || 'border-blue-500 bg-blue-50'
      }));
      
      return {
        ...slot,
        events: slotEvents
      };
    });
    setTimeSlots(slotsWithEvents);
  }, [events]);

  // Get upcoming meetings (next 3 events after current time)
  const now = new Date();
  const upcomingMeetings = events
    .filter(event => new Date(event.end_time) > now)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 3);

  // Navigation functions
  const goToPreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
      {/* Main Calendar View - Takes up 3 columns */}
      <div className="lg:col-span-3">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-medium">Today - {currentDate.toLocaleDateString()}</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </Button>
            <Button size="sm">
              <Shield className="h-4 w-4 mr-2" />
              Defend Focus
            </Button>
            <Button size="sm" onClick={goToPreviousDay}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous Day
            </Button>
            <Button size="sm" onClick={goToNextDay}>
              <ChevronRight className="h-4 w-4 mr-2" />
              Next Day
            </Button>
            <Button size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>
        </div>

        {/* Time Grid */}
        <div className="border rounded-lg overflow-hidden">
          {timeSlots.map((slot, index) => (
            <div key={index} className="flex border-b border-gray-200 last:border-b-0 min-h-[80px]">
              {/* Time Column */}
              <div className="w-20 p-3 border-r border-gray-200 text-sm text-gray-600 bg-gray-50">
                {slot.time}
              </div>
              
              {/* Event Column */}
              <div className="flex-1 p-2 relative">
                {slot.events.length > 0 ? (
                  <div className="space-y-1">
                    {slot.events.map((event) => (
                      <div
                        key={event.id}
                        className={`p-3 rounded-lg border-l-4 cursor-pointer hover:shadow-sm transition-shadow ${event.color || 'border-gray-300 bg-gray-50'}`}
                        style={{ minHeight: '60px' }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm">{event.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {event.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs opacity-75 mb-1">
                          <Clock className="h-3 w-3" />
                          {event.time}
                        </div>
                        <div className="flex items-center gap-1 text-xs opacity-75 mb-2">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </div>
                        <p className="text-xs opacity-75 line-clamp-2">{event.description}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <Users className="h-3 w-3 opacity-75" />
                          <div className="flex -space-x-1">
                            {event.attendees.slice(0, 3).map((attendee, i) => (
                              <Avatar key={i} className="h-5 w-5 border border-white">
                                <AvatarFallback className="text-xs">{attendee}</AvatarFallback>
                              </Avatar>
                            ))}
                            {event.attendees.length > 3 && (
                              <div className="h-5 w-5 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                                +{event.attendees.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                    Available
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Sidebar - Meeting Details & Actions */}
      <div className="space-y-4">
        {/* Next Meeting */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-medium mb-3">Next Meeting</h3>
          {upcomingMeetings[0] ? (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">{upcomingMeetings[0].title}</h4>
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Clock className="h-3 w-3" />
                {upcomingMeetings[0].time}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <MapPin className="h-3 w-3" />
                {upcomingMeetings[0].location}
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" className="flex-1">
                  <Video className="h-3 w-3 mr-1" />
                  Join
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600">No upcoming meetings</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <Button size="sm" variant="outline" className="w-full justify-start">
              <Shield className="h-4 w-4 mr-2" />
              Defend Focus Time
            </Button>
            <Button size="sm" variant="outline" className="w-full justify-start">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reschedule Meeting
            </Button>
            <Button size="sm" variant="outline" className="w-full justify-start">
              <Mail className="h-4 w-4 mr-2" />
              Send Update
            </Button>
          </div>
        </div>

        {/* Today's Summary */}
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="font-medium mb-3">Today's Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total meetings:</span>
              <span className="font-medium">{todayEvents.filter(e => e.type === 'meeting' || e.type === 'important').length}</span>
            </div>
            <div className="flex justify-between">
              <span>Focus time:</span>
              <span className="font-medium">2 hours</span>
            </div>
            <div className="flex justify-between">
              <span>Available slots:</span>
              <span className="font-medium">{timeSlots.filter(s => s.events.length === 0).length}</span>
            </div>
          </div>
        </div>

        {/* Upcoming This Week */}
        <div className="bg-yellow-50 rounded-lg p-4">
          <h3 className="font-medium mb-3">This Week</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>8 meetings scheduled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>12 hours focus time</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>3 client presentations</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}