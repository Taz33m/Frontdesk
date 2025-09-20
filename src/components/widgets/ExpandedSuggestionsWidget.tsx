import { Lightbulb, Check, X, Clock, Info, Brain, Calendar, TrendingUp } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Separator } from "../ui/separator";

const allSuggestions = [
  {
    id: 1,
    title: "Morning Focus Block",
    description: "2-hour deep work session for quarterly report",
    time: "9:00 AM - 11:00 AM",
    date: "Today",
    reason: "Based on your productivity patterns, you're most focused in the morning. Your historical data shows 40% higher output during 9-11 AM.",
    type: "focus",
    confidence: "high",
    impact: "high",
    effort: "low",
    aiScore: 92,
    benefits: ["Increased productivity", "Better work quality", "Reduced interruptions"]
  },
  {
    id: 2,
    title: "Quick Team Sync",
    description: "15min standup with design team",
    time: "2:30 PM - 2:45 PM",
    date: "Today",
    reason: "You haven't connected with the design team this week. Sarah Chen mentioned needing input on the new mockups.",
    type: "meeting",
    confidence: "medium", 
    impact: "medium",
    effort: "low",
    aiScore: 76,
    benefits: ["Better team alignment", "Faster decision making", "Improved communication"]
  },
  {
    id: 3,
    title: "Email Cleanup Session", 
    description: "Process and organize inbox",
    time: "4:00 PM - 4:30 PM",
    date: "Today",
    reason: "Your inbox has 47 unread emails. A focused cleanup session now will prevent weekend work spillover.",
    type: "admin",
    confidence: "high",
    impact: "medium", 
    effort: "medium",
    aiScore: 68,
    benefits: ["Reduced stress", "Clear inbox", "Better organization"]
  },
  {
    id: 4,
    title: "Client Check-in Call",
    description: "Brief status update with Johnson Corp",
    time: "10:00 AM - 10:15 AM",
    date: "Tomorrow",
    reason: "Johnson Corp project milestone is due next week. Proactive communication could prevent last-minute issues.",
    type: "client",
    confidence: "medium",
    impact: "high",
    effort: "low",
    aiScore: 84,
    benefits: ["Stronger client relationship", "Risk mitigation", "Proactive communication"]
  },
  {
    id: 5,
    title: "Code Review Block",
    description: "Review pending pull requests",
    time: "1:00 PM - 2:00 PM", 
    date: "Tomorrow",
    reason: "5 PRs are waiting for your review. The authentication module changes are blocking other developers.",
    type: "review",
    confidence: "high",
    impact: "high",
    effort: "medium",
    aiScore: 89,
    benefits: ["Unblock team", "Maintain code quality", "Faster development cycle"]
  },
  {
    id: 6,
    title: "Learning Session",
    description: "Explore new AI productivity tools",
    time: "3:00 PM - 4:00 PM",
    date: "Monday",
    reason: "Industry trends show 35% productivity gains with new AI tools. Your current toolset hasn't been updated in 6 months.",
    type: "learning",
    confidence: "medium",
    impact: "high",
    effort: "high", 
    aiScore: 71,
    benefits: ["Skill development", "Competitive advantage", "Tool optimization"]
  }
];

const calendarWeek = [
  {
    day: "Today",
    date: "Sep 20",
    events: [
      { type: "existing", title: "Team Standup", time: "10:00", color: "bg-blue-200" },
      { type: "suggestion", title: "Focus Block", time: "9:00", color: "bg-yellow-200", id: 1 },
      { type: "suggestion", title: "Team Sync", time: "14:30", color: "bg-yellow-200", id: 2 }
    ]
  },
  {
    day: "Tomorrow", 
    date: "Sep 21",
    events: [
      { type: "existing", title: "Client Call", time: "14:00", color: "bg-blue-200" },
      { type: "suggestion", title: "Client Check-in", time: "10:00", color: "bg-yellow-200", id: 4 },
      { type: "suggestion", title: "Code Review", time: "13:00", color: "bg-yellow-200", id: 5 }
    ]
  },
  {
    day: "Monday",
    date: "Sep 23", 
    events: [
      { type: "existing", title: "Planning Meeting", time: "9:00", color: "bg-blue-200" },
      { type: "suggestion", title: "Learning Session", time: "15:00", color: "bg-yellow-200", id: 6 }
    ]
  }
];

const productivityInsights = [
  {
    metric: "Focus Time This Week",
    value: "18.5 hours",
    change: "+2.3 hours", 
    positive: true,
    description: "Above your weekly average"
  },
  {
    metric: "Meeting Efficiency",
    value: "87%",
    change: "+5%",
    positive: true,
    description: "Meetings ending on time"
  },
  {
    metric: "Email Response Time",
    value: "2.4 hours",
    change: "-30min",
    positive: true,
    description: "Average response time"
  },
  {
    metric: "Suggestion Acceptance",
    value: "73%",
    change: "+8%",
    positive: true,
    description: "AI suggestions you've accepted"
  }
];

export function ExpandedSuggestionsWidget() {
  const todaySuggestions = allSuggestions.filter(s => s.date === "Today");
  const upcomingSuggestions = allSuggestions.filter(s => s.date !== "Today");
  const avgAiScore = Math.round(allSuggestions.reduce((acc, s) => acc + s.aiScore, 0) / allSuggestions.length);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Left Column - Suggestions List */}
      <div className="lg:col-span-2 space-y-4">
        {/* AI Insights Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium">AI Productivity Suggestions</h3>
            <Badge variant="secondary" className="text-xs">
              {allSuggestions.length} recommendations
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">AI Confidence:</span>
            <Badge className="bg-green-100 text-green-800">{avgAiScore}%</Badge>
          </div>
        </div>

        {/* Today's Suggestions */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Today's Suggestions ({todaySuggestions.length})
          </h4>
          <div className="space-y-3">
            {todaySuggestions.map((suggestion) => (
              <TooltipProvider key={suggestion.id}>
                <div className="p-4 rounded-lg border-2 border-yellow-200 bg-yellow-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{suggestion.title}</h4>
                        <Badge 
                          variant={suggestion.confidence === 'high' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {suggestion.confidence} confidence
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {suggestion.time}
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          AI Score: {suggestion.aiScore}%
                        </div>
                      </div>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Info className="h-3 w-3 text-blue-600" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <div className="space-y-2">
                          <p className="font-medium">Why this suggestion?</p>
                          <p className="text-sm">{suggestion.reason}</p>
                          <div className="mt-2">
                            <p className="font-medium text-xs">Expected benefits:</p>
                            <ul className="text-xs mt-1 space-y-1">
                              {suggestion.benefits.map((benefit, i) => (
                                <li key={i}>• {benefit}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1 text-xs">
                      <span>Impact:</span>
                      <div className={`w-2 h-2 rounded-full ${
                        suggestion.impact === 'high' ? 'bg-green-500' : 
                        suggestion.impact === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`} />
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <span>Effort:</span>
                      <div className={`w-2 h-2 rounded-full ${
                        suggestion.effort === 'low' ? 'bg-green-500' : 
                        suggestion.effort === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">
                      <Check className="h-3 w-3 mr-1" />
                      Accept & Schedule
                    </Button>
                    <Button size="sm" variant="outline">
                      Maybe Later
                    </Button>
                    <Button size="sm" variant="outline">
                      <X className="h-3 w-3" />
                      Dismiss
                    </Button>
                  </div>
                </div>
              </TooltipProvider>
            ))}
          </div>
        </div>

        <Separator />

        {/* Upcoming Suggestions */}
        <div>
          <h4 className="font-medium mb-3">Upcoming Suggestions ({upcomingSuggestions.length})</h4>
          <div className="space-y-3">
            {upcomingSuggestions.map((suggestion) => (
              <div key={suggestion.id} className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{suggestion.title}</h4>
                      <Badge variant="outline" className="text-xs">{suggestion.date}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{suggestion.description}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {suggestion.time}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-blue-600">{suggestion.aiScore}%</div>
                    <div className="text-xs text-gray-500">AI Score</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column - Calendar & Analytics */}
      <div className="space-y-4">
        {/* Mini Calendar with Suggestions */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium mb-3">Suggestion Calendar</h3>
          <div className="space-y-3">
            {calendarWeek.map((day, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{day.day}</span>
                  <span className="text-xs text-gray-500">{day.date}</span>
                </div>
                <div className="space-y-1">
                  {day.events.map((event, j) => (
                    <div 
                      key={j}
                      className={`text-xs p-2 rounded ${event.color} ${
                        event.type === 'suggestion' ? 'border-l-2 border-yellow-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{event.title}</span>
                        <span>{event.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Productivity Insights */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-medium mb-3">Productivity Insights</h3>
          <div className="space-y-3">
            {productivityInsights.map((insight, i) => (
              <div key={i} className="bg-white rounded p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{insight.metric}</span>
                  <span className={`text-xs ${insight.positive ? 'text-green-600' : 'text-red-600'}`}>
                    {insight.change}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg">{insight.value}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Learning Status */}
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="font-medium mb-3">AI Learning Progress</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Pattern Recognition</span>
                <span>94%</span>
              </div>
              <Progress value={94} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Preference Learning</span>
                <span>87%</span>
              </div>
              <Progress value={87} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Context Awareness</span>
                <span>91%</span>
              </div>
              <Progress value={91} />
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-3">
            AI suggestions improve as it learns your preferences and work patterns.
          </p>
        </div>
      </div>
    </div>
  );
}