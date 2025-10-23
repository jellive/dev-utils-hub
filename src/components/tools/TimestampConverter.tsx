import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Copy } from 'lucide-react';
import { toast } from 'sonner';

type TimestampUnit = 'seconds' | 'milliseconds';

const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'EST (New York)' },
  { value: 'America/Los_Angeles', label: 'PST (Los Angeles)' },
  { value: 'Europe/London', label: 'GMT (London)' },
  { value: 'Europe/Paris', label: 'CET (Paris)' },
  { value: 'Asia/Tokyo', label: 'JST (Tokyo)' },
  { value: 'Asia/Shanghai', label: 'CST (Shanghai)' },
  { value: 'Asia/Seoul', label: 'KST (Seoul)' },
];

export function TimestampConverter() {
  const [timestamp, setTimestamp] = useState('');
  const [unit, setUnit] = useState<TimestampUnit>('milliseconds');
  const [timezone, setTimezone] = useState('UTC');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCurrentTime = () => {
    const now = Date.now();
    setTimestamp(unit === 'seconds' ? Math.floor(now / 1000).toString() : now.toString());
  };

  const getDateFromTimestamp = (): Date | null => {
    if (!timestamp) return null;
    const ts = parseInt(timestamp);
    if (isNaN(ts)) return null;
    return new Date(unit === 'seconds' ? ts * 1000 : ts);
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMs < 0) {
      const absDiffSec = Math.abs(diffSec);
      const absDiffMin = Math.abs(diffMin);
      const absDiffHour = Math.abs(diffHour);
      const absDiffDay = Math.abs(diffDay);

      if (absDiffDay > 0) return `in ${absDiffDay} day${absDiffDay > 1 ? 's' : ''}`;
      if (absDiffHour > 0) return `in ${absDiffHour} hour${absDiffHour > 1 ? 's' : ''}`;
      if (absDiffMin > 0) return `in ${absDiffMin} minute${absDiffMin > 1 ? 's' : ''}`;
      return `in ${absDiffSec} second${absDiffSec > 1 ? 's' : ''}`;
    }

    if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    if (diffHour > 0) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    return `${diffSec} second${diffSec > 1 ? 's' : ''} ago`;
  };

  const date = getDateFromTimestamp();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Timestamp Converter</h2>

      <Tabs defaultValue="timestamp-to-date" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timestamp-to-date">Timestamp to Date</TabsTrigger>
          <TabsTrigger value="date-to-timestamp">Date to Timestamp</TabsTrigger>
        </TabsList>

        {/* Timestamp to Date Tab */}
        <TabsContent value="timestamp-to-date" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Timestamp Input</CardTitle>
              <CardDescription>Enter a Unix timestamp to convert</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={timestamp}
                  onChange={(e) => setTimestamp(e.target.value)}
                  placeholder="Enter timestamp..."
                  className="flex-1"
                />
                <Select value={unit} onValueChange={(v) => setUnit(v as TimestampUnit)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seconds">Seconds</SelectItem>
                    <SelectItem value="milliseconds">Milliseconds</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleCurrentTime} variant="outline" className="gap-2">
                  <Clock className="h-4 w-4" />
                  Now
                </Button>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-300">
                  Current time: {currentTime.toLocaleString()} ({Math.floor(currentTime.getTime() / 1000)})
                </p>
              </div>
            </CardContent>
          </Card>

          {date && (
            <>
              {/* Date Formats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">ISO 8601</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-sm font-mono break-all">{date.toISOString()}</code>
                      <Button
                        onClick={() => handleCopy(date.toISOString())}
                        variant="ghost"
                        size="sm"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Local Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-sm font-mono break-all">{date.toLocaleString()}</code>
                      <Button
                        onClick={() => handleCopy(date.toLocaleString())}
                        variant="ghost"
                        size="sm"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">UTC</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-sm font-mono break-all">{date.toUTCString()}</code>
                      <Button
                        onClick={() => handleCopy(date.toUTCString())}
                        variant="ghost"
                        size="sm"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Relative Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-sm font-mono">{getRelativeTime(date)}</code>
                      <Button
                        onClick={() => handleCopy(getRelativeTime(date))}
                        variant="ghost"
                        size="sm"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Date Components */}
              <Card>
                <CardHeader>
                  <CardTitle>Date Components</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Year</p>
                      <p className="text-lg font-semibold">{date.getFullYear()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Month</p>
                      <p className="text-lg font-semibold">{date.getMonth() + 1}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Day</p>
                      <p className="text-lg font-semibold">{date.getDate()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Hour</p>
                      <p className="text-lg font-semibold">{date.getHours()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Minute</p>
                      <p className="text-lg font-semibold">{date.getMinutes()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Second</p>
                      <p className="text-lg font-semibold">{date.getSeconds()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Date to Timestamp Tab */}
        <TabsContent value="date-to-timestamp" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Select Date</CardTitle>
                <CardDescription>Choose a date from the calendar</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Timezone</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {selectedDate && (
                <Card>
                  <CardHeader>
                    <CardTitle>Timestamp</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Seconds</p>
                        <code className="text-sm font-mono">
                          {Math.floor(selectedDate.getTime() / 1000)}
                        </code>
                      </div>
                      <Button
                        onClick={() => handleCopy(Math.floor(selectedDate.getTime() / 1000).toString())}
                        variant="ghost"
                        size="sm"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Milliseconds</p>
                        <code className="text-sm font-mono">{selectedDate.getTime()}</code>
                      </div>
                      <Button
                        onClick={() => handleCopy(selectedDate.getTime().toString())}
                        variant="ghost"
                        size="sm"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
