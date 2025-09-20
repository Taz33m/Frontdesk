import { CheckSquare, Calendar, Clock, Plus, Filter, TrendingUp, Target, User } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Progress } from "../ui/progress";
import { Separator } from "../ui/separator";

const allTasks = [
  {
    id: 1,
    title: "Complete Q4 Performance Review",
    description: "Prepare comprehensive review of team performance and individual achievements for quarterly assessment",
    dueDate: "Today, 3:00 PM",
    priority: "high",
    type: "work",
    progress: 75,
    assignee: "You",
    tags: ["performance", "quarterly"]
  },
  {
    id: 2,
    title: "Submit Project Proposal",
    description: "Draft and submit the new client onboarding project proposal with timeline and budget estimates",
    dueDate: "Tomorrow, 9:00 AM",
    priority: "medium",
    type: "work",
    progress: 45,
    assignee: "You",
    tags: ["proposal", "client"]
  },
  {
    id: 3,
    title: "Team Standup Meeting Prep",
    description: "Review sprint progress and prepare talking points for Monday team standup",
    dueDate: "Monday, 10:00 AM", 
    priority: "low",
    type: "work",
    progress: 20,
    assignee: "You",
    tags: ["meeting", "sprint"]
  },
  {
    id: 4,
    title: "Update Marketing Dashboard",
    description: "Refresh analytics data and create new visualizations for the marketing performance dashboard",
    dueDate: "Tuesday, 2:00 PM",
    priority: "medium",
    type: "work",
    progress: 60,
    assignee: "Sarah Chen",
    tags: ["analytics", "dashboard"]
  },
  {
    id: 5,
    title: "Code Review - Authentication Module",
    description: "Review pull requests for the new authentication system and provide feedback to development team",
    dueDate: "Wednesday, 11:00 AM",
    priority: "high",
    type: "work", 
    progress: 0,
    assignee: "John Miller",
    tags: ["code-review", "security"]
  },
  {
    id: 6,
    title: "Client Meeting Preparation",
    description: "Prepare slides and agenda for upcoming client presentation on project milestones",
    dueDate: "Thursday, 4:00 PM",
    priority: "medium",
    type: "work",
    progress: 30,
    assignee: "Alex Rodriguez",
    tags: ["client", "presentation"]
  }
];

const stockData = [
  { symbol: "AAPL", name: "Apple Inc.", price: "$173.50", change: "+1.2%", changeValue: "+$2.05", positive: true },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: "$2,840.25", change: "-0.8%", changeValue: "-$22.80", positive: false },
  { symbol: "MSFT", name: "Microsoft Corp.", price: "$378.85", change: "+0.5%", changeValue: "+$1.89", positive: true },
  { symbol: "TSLA", name: "Tesla Inc.", price: "$242.64", change: "+2.1%", changeValue: "+$5.01", positive: true },
  { symbol: "AMZN", name: "Amazon.com Inc.", price: "$3,127.50", change: "-1.2%", changeValue: "-$38.04", positive: false },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: "$421.89", change: "+3.4%", changeValue: "+$13.87", positive: true }
];

export function ExpandedTasksWidget() {
  const completedTasks = allTasks.filter(task => task.progress === 100);
  const inProgressTasks = allTasks.filter(task => task.progress > 0 && task.progress < 100);
  const notStartedTasks = allTasks.filter(task => task.progress === 0);
  
  const highPriorityTasks = allTasks.filter(task => task.priority === "high");
  const overallProgress = allTasks.reduce((acc, task) => acc + task.progress, 0) / allTasks.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Left Column - Task List */}
      <div className="lg:col-span-2 space-y-4">
        {/* Search and Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input placeholder="Search tasks..." />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>

        {/* High Priority Tasks */}
        {highPriorityTasks.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-red-500" />
              <h3 className="font-medium">High Priority ({highPriorityTasks.length})</h3>
            </div>
            <div className="space-y-3">
              {highPriorityTasks.map((task) => (
                <div key={task.id} className="p-4 rounded-lg border-2 border-red-200 bg-red-50">
                  <div className="flex items-start gap-3">
                    <CheckSquare className="h-5 w-5 text-gray-400 mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{task.title}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="text-xs">{task.priority}</Badge>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {task.dueDate}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                      <div className="flex items-center justify-between">
                        <Progress value={task.progress} className="flex-1 mr-4" />
                        <span className="text-sm text-gray-500">{task.progress}%</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex gap-1">
                          {task.tags.map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                        <Button size="sm" variant="outline">
                          <Calendar className="h-4 w-4 mr-1" />
                          Plan Block
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* In Progress Tasks */}
        {inProgressTasks.length > 0 && (
          <div>
            <h3 className="font-medium mb-3">In Progress ({inProgressTasks.length})</h3>
            <div className="space-y-3">
              {inProgressTasks.filter(t => t.priority !== "high").map((task) => (
                <div key={task.id} className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <CheckSquare className="h-5 w-5 text-gray-400 mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{task.title}</h4>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={task.priority === "medium" ? "secondary" : "outline"} 
                            className="text-xs"
                          >
                            {task.priority}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <User className="h-3 w-3" />
                            {task.assignee}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                      <div className="flex items-center justify-between">
                        <Progress value={task.progress} className="flex-1 mr-4" />
                        <span className="text-sm text-gray-500">{task.progress}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Not Started Tasks */}
        {notStartedTasks.length > 0 && (
          <div>
            <h3 className="font-medium mb-3 text-gray-600">Not Started ({notStartedTasks.length})</h3>
            <div className="space-y-3">
              {notStartedTasks.map((task) => (
                <div key={task.id} className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 opacity-60">
                  <div className="flex items-start gap-3">
                    <CheckSquare className="h-5 w-5 text-gray-400 mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium">{task.title}</h4>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {task.dueDate}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{task.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Column - Analytics & Stock Ticker */}
      <div className="space-y-4">
        {/* Task Analytics */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium mb-3">Task Analytics</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Overall Progress</span>
                <span className="font-medium">{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center p-2 bg-white rounded">
                <div className="font-medium text-lg text-green-600">{completedTasks.length}</div>
                <div className="text-gray-600">Completed</div>
              </div>
              <div className="text-center p-2 bg-white rounded">
                <div className="font-medium text-lg text-blue-600">{inProgressTasks.length}</div>
                <div className="text-gray-600">In Progress</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Ticker */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <h3 className="font-medium">Market Watch</h3>
          </div>
          <div className="space-y-2">
            {stockData.map((stock) => (
              <div key={stock.symbol} className="flex items-center justify-between p-2 bg-white rounded text-sm">
                <div>
                  <div className="font-medium">{stock.symbol}</div>
                  <div className="text-xs text-gray-600">{stock.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{stock.price}</div>
                  <div className={`text-xs ${stock.positive ? 'text-green-600' : 'text-red-600'}`}>
                    {stock.change} ({stock.changeValue})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="font-medium mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <Button className="w-full justify-start" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create New Task
            </Button>
            <Button variant="outline" className="w-full justify-start" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Planning Block
            </Button>
            <Button variant="outline" className="w-full justify-start" size="sm">
              <Target className="h-4 w-4 mr-2" />
              Review Priorities
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}