import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useEffect } from "react";
import { X, Minus, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface TrainingSession {
  id: string;
  date: string;
  trainingType: string;
  sessionNumber?: number;
  rpe: number;
  load: number;
  participantCount: number;
  totalAthletes: number;
  duration: number;
  emotionalLoad?: number;
}

interface SessionSheetProps {
  open: boolean;
  onClose: () => void;
  session: TrainingSession | null;
  onSave: (sessionId: string, duration: number) => void;
  isLoading: boolean;
}

export default function SessionSheet({ open, onClose, session, onSave, isLoading }: SessionSheetProps) {
  const [duration, setDuration] = useState(60);

  useEffect(() => {
    if (session) {
      setDuration(session.duration);
    }
  }, [session]);

  if (!session) return null;

  const increment = () => setDuration(d => Math.min(240, d + 5));
  const decrement = () => setDuration(d => Math.max(15, d - 5));

  // Calculate live session load
  const emotionalFactor = session.emotionalLoad || 1.25; // Default fallback
  const typeWeight = session.trainingType === 'Field Training' ? 1.25 : 1.0;
  const calculatedLoad = Math.round(session.rpe * emotionalFactor * duration * typeWeight);

  const hasChanged = duration !== session.duration;

  const formatSessionName = (type: string, sessionNumber?: number) => {
    if (sessionNumber && sessionNumber > 1) {
      return `${type} (Session ${sessionNumber})`;
    }
    return type;
  };

  const presetDurations = [45, 60, 90];

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-full"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-full"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-t-2xl bg-zinc-900 p-6 text-left align-middle shadow-xl transition-all border-t border-zinc-700">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-medium text-white">
                    {format(new Date(session.date), "d MMM")} — {formatSessionName(session.trainingType, session.sessionNumber)}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Session Details */}
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">RPE</span>
                    <span className="text-white font-medium">{session.rpe}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-zinc-400">Participants</span>
                    <span className="text-white font-medium flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {session.participantCount} / {session.totalAthletes}
                    </span>
                  </div>

                  {/* Duration Editor */}
                  <div className="space-y-3">
                    <span className="text-zinc-400">Duration</span>
                    
                    {/* Stepper Controls */}
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={decrement}
                        className="w-12 h-12 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
                        disabled={duration <= 10}
                      >
                        <Minus className="h-5 w-5 text-white" />
                      </button>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={duration}
                          onChange={(e) => setDuration(Math.max(10, parseInt(e.target.value) || 10))}
                          className="w-16 text-center text-xl font-bold bg-transparent text-white border-none outline-none"
                          min="10"
                        />
                        <span className="text-zinc-400">min</span>
                      </div>
                      
                      <button
                        onClick={increment}
                        className="w-12 h-12 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
                      >
                        <Plus className="h-5 w-5 text-white" />
                      </button>
                    </div>

                    {/* Preset Chips */}
                    <div className="flex justify-center gap-2">
                      {presetDurations.map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setDuration(preset)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            duration === preset
                              ? 'bg-primary text-black'
                              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live Session Load */}
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Session Load</span>
                    <span className="text-white font-medium">{calculatedLoad} AU</span>
                  </div>
                </div>

                {/* Save Button */}
                <div className="mt-6">
                  <Button
                    onClick={() => onSave(session.id, duration)}
                    disabled={!hasChanged || isLoading}
                    className="w-full bg-primary text-black hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}