import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

const BUSINESS_HOURS = [
  { day: 'Mon', hours: '09:00 am – 05:00 pm' },
  { day: 'Tue', hours: '09:00 am – 05:00 pm' },
  { day: 'Wed', hours: '09:00 am – 05:00 pm' },
  { day: 'Thu', hours: '09:00 am – 05:00 pm' },
  { day: 'Fri', hours: '09:00 am – 05:00 pm' },
  { day: 'Sat', hours: 'Closed' },
  { day: 'Sun', hours: 'Closed' },
];

export default function BusinessHours() {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Get current day (0 = Sunday, 1 = Monday, etc.)
  const today = new Date().getDay();
  // Convert to our array index (Monday = 0)
  const currentDayIndex = today === 0 ? 6 : today - 1;
  
  const isOpen = currentDayIndex < 5; // Open Monday-Friday
  const currentDay = BUSINESS_HOURS[currentDayIndex];

  return (
    <div className="mt-8">
      <h3 className="font-medium mb-4">Hours</h3>
      <motion.div
        className="space-y-2"
        initial={false}
      >
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between bg-white/50 backdrop-blur-sm rounded-lg p-4 hover:bg-white/60 transition-colors"
        >
          <span className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>
              {isOpen ? 'Open today' : 'Closed today'} {currentDay.hours !== 'Closed' && currentDay.hours}
            </span>
          </span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </motion.button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="bg-white/30 backdrop-blur-sm rounded-lg p-4 mt-2 space-y-2">
                {BUSINESS_HOURS.map((schedule, index) => (
                  <motion.div
                    key={schedule.day}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex justify-between items-center p-2 rounded ${
                      index === currentDayIndex
                        ? 'bg-yellow-100/50 font-medium'
                        : 'hover:bg-white/30'
                    }`}
                  >
                    <span>{schedule.day}</span>
                    <span>{schedule.hours}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}