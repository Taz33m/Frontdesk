import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { ArrowLeft, ArrowRight, Loader2, Check } from 'lucide-react';

type Persona = 'student' | 'professional' | 'both';
type WorkingStyle = 'batch' | 'spread' | 'hybrid';
type StudyCadence = 'long' | 'short' | 'no-preference';
type MeetingPreference = 'few-long' | 'many-short' | 'no-preference';
type MeetingTime = 'morning' | 'afternoon' | 'flexible';

interface OnboardingData {
  persona: Persona;
  workingStyle: WorkingStyle;
  timezone: string;
  lms?: string;
  assignmentReminders?: boolean;
  studyCadence?: StudyCadence;
  stocks?: string[];
  meetingPreference?: MeetingPreference;
  meetingTime?: MeetingTime;
}

const timezones = [
  'Pacific Time (US & Canada) — UTC−08:00',
  'Mountain Time (US & Canada) — UTC−07:00',
  'Central Time (US & Canada) — UTC−06:00',
  'Eastern Time (US & Canada) — UTC−05:00',
  'Greenwich Mean Time — UTC+00:00',
  'Central European Time — UTC+01:00',
  'Eastern European Time — UTC+02:00',
  'India Standard Time — UTC+05:30',
  'China Standard Time — UTC+08:00',
  'Japan Standard Time — UTC+09:00',
  'Australian Eastern Time — UTC+10:00',
];

const commonStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'JPM', 'V', 'WMT'];

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const [data, setData] = useState<OnboardingData>({
    persona: 'student',
    workingStyle: 'hybrid',
    timezone: '',
  });
  const navigate = useNavigate();

  // Auto-detect timezone
  useEffect(() => {
    if (step === 3 && !data.timezone) {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const timezoneMatch = timezones.find(tz => tz.includes(userTimezone.split('/')[1] || userTimezone));
      if (timezoneMatch) {
        setData(prev => ({ ...prev, timezone: timezoneMatch }));
      }
    }
  }, [step, data.timezone]);

  // Auto-redirect after showing completion message
  useEffect(() => {
    if (step === 5) {
      const timer = setTimeout(() => {
        handleComplete();
      }, 1500); // 1.5 seconds delay before redirect
      
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Save user preferences to localStorage
      localStorage.setItem('userPreferences', JSON.stringify(data));
      
      // Mark onboarding as complete
      localStorage.setItem('isNewUser', 'false');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStock = (stock: string) => {
    setSelectedStocks(prev =>
      prev.includes(stock)
        ? prev.filter(s => s !== stock)
        : [...prev, stock]
    );
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4 text-center">
            <h3 className="text-lg font-medium">Step 1 — Persona</h3>
            <p className="text-sm text-gray-600 mb-2">Are you a...</p>
            <RadioGroup
              value={data.persona}
              onValueChange={(value: Persona) => setData({ ...data, persona: value })}
              className="space-y-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="student" id="student" />
                <Label htmlFor="student">Student</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="professional" id="professional" />
                <Label htmlFor="professional">Professional</Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4 text-center">
            <h3 className="text-lg font-medium">Step 2 — Working Style</h3>
            <p className="text-sm text-gray-600 mb-2">How do you usually prefer to work?</p>
            <RadioGroup
              value={data.workingStyle}
              onValueChange={(value: WorkingStyle) => setData({ ...data, workingStyle: value })}
              className="space-y-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="batch" id="batch" />
                <Label htmlFor="batch">Get work done all at once (Batch)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="spread" id="spread" />
                <Label htmlFor="spread">Spread work across the day (Spread)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hybrid" id="hybrid" />
                <Label htmlFor="hybrid">Let Desk decide (Hybrid)</Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 text-center">
            <h3 className="text-lg font-medium">Step 3 — Timezone</h3>
            <p className="text-sm text-gray-600 mb-2">Which timezone are you in?</p>
            <Select
              value={data.timezone}
              onValueChange={value => setData({ ...data, timezone: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your timezone" />
              </SelectTrigger>
              <SelectContent>
                {timezones.map(tz => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              {!data.timezone ? 'Detecting your timezone...' : `Detected: ${data.timezone}`}
            </p>
          </div>
        );

      case 4:
        if (data.persona === 'student' || data.persona === 'both') {
          return (
            <div className="space-y-4 text-center">
              <h3 className="text-lg font-medium">Step 4 — Student Preferences</h3>
              
              <div className="space-y-4">
                <div>
                  <Label>Which Learning Management System do you use?</Label>
                  <Select
                    value={data.lms || ''}
                    onValueChange={value => setData({ ...data, lms: value })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select LMS" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="canvas">Canvas</SelectItem>
                      <SelectItem value="blackboard">Blackboard</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label>Assignment due date reminders</Label>
                    <p className="text-sm text-gray-500">Get notified before assignments are due</p>
                  </div>
                  <Switch
                    checked={data.assignmentReminders}
                    onCheckedChange={checked => setData({ ...data, assignmentReminders: checked })}
                  />
                </div>

                <div>
                  <Label>Preferred study cadence</Label>
                  <RadioGroup
                    value={data.studyCadence || 'no-preference'}
                    onValueChange={(value: StudyCadence) => setData({ ...data, studyCadence: value })}
                    className="mt-2 space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="long" id="long-sessions" />
                      <Label htmlFor="long-sessions">Long deep-work blocks</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="short" id="short-sessions" />
                      <Label htmlFor="short-sessions">Short, frequent sessions</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no-preference" id="no-pref-sessions" />
                      <Label htmlFor="no-pref-sessions">No preference</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          );
        } else {
          return (
            <div className="space-y-4 text-center">
              <h3 className="text-lg font-medium">Step 4 — Professional Preferences</h3>
              
              <div className="space-y-6">
                <div>
                  <Label>Stocks to track</Label>
                  <p className="text-sm text-gray-500 mb-2">Select stocks you want to keep an eye on</p>
                  <div className="flex flex-wrap gap-2">
                    {commonStocks.map(stock => (
                      <Button
                        key={stock}
                        type="button"
                        variant={selectedStocks.includes(stock) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleStock(stock)}
                        className="rounded-full"
                      >
                        {selectedStocks.includes(stock) && <Check className="mr-1 h-3 w-3" />}
                        {stock}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Meeting preference</Label>
                  <RadioGroup
                    value={data.meetingPreference || 'no-preference'}
                    onValueChange={(value: MeetingPreference) => setData({ ...data, meetingPreference: value })}
                    className="mt-2 space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="few-long" id="few-long" />
                      <Label htmlFor="few-long">Few long meetings</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="many-short" id="many-short" />
                      <Label htmlFor="many-short">Many short check-ins</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no-preference" id="meet-no-pref" />
                      <Label htmlFor="meet-no-pref">No preference</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label>Preferred meeting time</Label>
                  <RadioGroup
                    value={data.meetingTime || 'flexible'}
                    onValueChange={(value: MeetingTime) => setData({ ...data, meetingTime: value as MeetingTime })}
                    className="mt-2 space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="morning" id="morning" />
                      <Label htmlFor="morning">Morning</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="afternoon" id="afternoon" />
                      <Label htmlFor="afternoon">Afternoon</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="flexible" id="flexible" />
                      <Label htmlFor="flexible">Flexible</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          );
        }

      case 5:
        return (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-medium">You're all set!</h3>
            <p className="text-gray-600">Your preferences have been saved. Let's get started with Desk.</p>
          </div>
        );

      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return !!data.persona;
      case 2:
        return !!data.workingStyle;
      case 3:
        return !!data.timezone;
      case 4:
        if (data.persona === 'student' || data.persona === 'both') {
          return true; // All fields are optional
        } else {
          return true; // All fields are optional for professionals too
        }
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-2 sm:p-4">
      <div className="w-full max-w-xs">
        <Card className="overflow-hidden border border-gray-100 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-500 p-4 text-white">
            <div className="flex items-center justify-center">
              <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center">
                <Check className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-4 sm:p-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </CardContent>

          {step !== 5 && (
            <CardFooter className="flex justify-between border-t border-gray-100 bg-gray-50 px-3 py-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handlePrevious}
                disabled={step === 1 || loading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              
              <Button
                type="button"
                onClick={handleNext}
                disabled={!isStepValid() || loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                {step === 4 ? 'Complete Setup' : 'Continue'}
              </Button>
            </CardFooter>
          )}
        </Card>

        <div className="mt-6 text-center text-sm text-gray-500">
          Step {step} of 5
          <div className="mt-2 flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full ${
                  i <= step ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
