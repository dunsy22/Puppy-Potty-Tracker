// DogPottyTracker.tsx
import React, { useState, useEffect } from 'react';
import { format, formatDistanceToNow, differenceInMinutes } from 'date-fns';

// Simple UI components to avoid missing external dependencies
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'destructive' | 'default' };
const Button: React.FC<ButtonProps> = ({ variant = 'default', className = '', ...props }) => {
  const base = 'px-3 py-1 rounded font-semibold';
  const variantClass = variant === 'destructive' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white';
  return <button className={`${base} ${variantClass} ${className}`} {...props} />;
};

const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => (
  <div className={`border rounded shadow-sm ${className}`} {...props} />
);

const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...props }) => (
  <div className={`p-4 ${className}`} {...props} />
);

const DEFAULT_THRESHOLD_HOURS = 8.0;
const AUDIO_URL = "/alarm.mp3"; // Add your audio file to the public directory

export default function DogPottyTracker() {
  const [lastPeeTime, setLastPeeTime] = useState<Date | null>(null);
  const [lastPoopTime, setLastPoopTime] = useState<Date | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [now, setNow] = useState<Date>(new Date());
  const [thresholdHours, setThresholdHours] = useState<number>(DEFAULT_THRESHOLD_HOURS);
  const [alarmActive, setAlarmActive] = useState<boolean>(false);
  const audio = new Audio(AUDIO_URL);

  useEffect(() => {
    const storedPee = localStorage.getItem("lastPeeTime");
    const storedPoop = localStorage.getItem("lastPoopTime");
    const storedHistory = localStorage.getItem("history");
    const storedThreshold = localStorage.getItem("thresholdHours");
    if (storedPee) setLastPeeTime(new Date(storedPee));
    if (storedPoop) setLastPoopTime(new Date(storedPoop));
    if (storedHistory) setHistory(JSON.parse(storedHistory));
    if (storedThreshold) setThresholdHours(parseFloat(storedThreshold));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000); // every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isTimeToGoOut()) {
      if (!alarmActive) {
        audio.loop = true;
        audio.play().catch(() => {});
        setAlarmActive(true);
      }
    } else {
      audio.pause();
      audio.currentTime = 0;
      setAlarmActive(false);
    }
  }, [now, lastPeeTime, lastPoopTime, thresholdHours]);

  const saveAndTrack = (type: "pee" | "poop") => {
    const newTime = new Date();
    const formatted = `${format(newTime, 'PPpp')} - ${type}`;
    setHistory((prev) => {
      const updated = [formatted, ...prev];
      localStorage.setItem("history", JSON.stringify(updated));
      return updated;
    });
    if (type === "pee") {
      setLastPeeTime(newTime);
      localStorage.setItem("lastPeeTime", newTime.toISOString());
    } else {
      setLastPoopTime(newTime);
      localStorage.setItem("lastPoopTime", newTime.toISOString());
    }
  };

  const minutesSince = (time: Date | null) => {
    if (!time) return Infinity;
    return differenceInMinutes(now, time);
  };

  const isTimeToGoOut = () => {
    const thresholdMinutes = thresholdHours * 60;
    return (
      minutesSince(lastPeeTime) > thresholdMinutes ||
      minutesSince(lastPoopTime) > thresholdMinutes
    );
  };

  const acknowledgeAlert = () => {
    audio.pause();
    audio.currentTime = 0;
    setAlarmActive(false);
  };

  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const newVal = isNaN(value) || value <= 0 ? DEFAULT_THRESHOLD_HOURS : value;
    setThresholdHours(newVal);
    localStorage.setItem("thresholdHours", newVal.toString());
  };

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold">Dog Potty Tracker</h1>

      <div className="space-y-2">
        <label htmlFor="threshold" className="block font-semibold">Time Threshold (hours):</label>
        <input
          id="threshold"
          type="number"
          step="0.1"
          min="0.1"
          value={thresholdHours}
          onChange={handleThresholdChange}
          className="border rounded p-1 w-full"
        />
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div>
            <strong>Last Pee:</strong> {lastPeeTime ? `${formatDistanceToNow(lastPeeTime, { addSuffix: true })} (${format(lastPeeTime, 'PPpp')})` : "Not recorded"}
          </div>
          <div>
            <strong>Last Poop:</strong> {lastPoopTime ? `${formatDistanceToNow(lastPoopTime, { addSuffix: true })} (${format(lastPoopTime, 'PPpp')})` : "Not recorded"}
          </div>
          <div className="space-x-2">
            <Button onClick={() => saveAndTrack("pee")}>Mark Pee</Button>
            <Button onClick={() => saveAndTrack("poop")}>Mark Poop</Button>
          </div>
        </CardContent>
      </Card>

      {isTimeToGoOut() && (
        <div className="text-red-600 font-semibold">
          🚨 Time to let the dog out!
          <div className="mt-2">
            <Button onClick={acknowledgeAlert} variant="destructive">Acknowledge</Button>
          </div>
        </div>
      )}

      <div className="mt-4">
        <h2 className="font-semibold text-lg">Event History</h2>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          {history.length > 0 ? history.map((entry, index) => (
            <li key={index}>{entry}</li>
          )) : <li>No events recorded yet.</li>}
        </ul>
      </div>
    </div>
  );
}

// PWA Support
// Add the following files to complete PWA functionality:
// 1. public/manifest.json
// 2. public/manifest-icon.png
// 3. src/service-worker.ts (or js) and register it in your main index.tsx
