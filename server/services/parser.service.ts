import * as chrono from 'chrono-node';
import type { PriorityLevel } from '../types.ts';

export interface ParsedTaskInput {
  title: string;
  deadline?: string; // ISO string
  estimatedEffort?: number; // hours
  priority?: PriorityLevel;
  category?: string;
  rawText: string;
}

export function parseNaturalLanguageTask(text: string): ParsedTaskInput {
  let workingText = text.trim();
  let estimatedEffort = 1;
  let priority: PriorityLevel = 'Medium';
  let category = 'General';

  // 1. Detect Category (#tag or category:name)
  const tagMatch = workingText.match(/#([a-zA-Z0-9_-]+)/);
  if (tagMatch) {
    category = tagMatch[1].charAt(0).toUpperCase() + tagMatch[1].slice(1);
    workingText = workingText.replace(tagMatch[0], ' ').trim();
  }

  // 2. Detect Priority
  if (/\b(high priority|p1|urgent|critical|asap|important)\b/i.test(workingText)) {
    priority = 'High';
    workingText = workingText.replace(/\b(high priority|p1|urgent|critical|asap|important)\b/gi, ' ').trim();
  } else if (/\b(low priority|p3|minor|low)\b/i.test(workingText)) {
    priority = 'Low';
    workingText = workingText.replace(/\b(low priority|p3|minor|low)\b/gi, ' ').trim();
  } else if (/\b(medium priority|p2|normal|medium)\b/i.test(workingText)) {
    priority = 'Medium';
    workingText = workingText.replace(/\b(medium priority|p2|normal|medium)\b/gi, ' ').trim();
  }

  // 3. Detect Effort / Duration (e.g., "3 hours", "2.5h", "30 mins", "1.5 hrs", "45m")
  const hourMatch = workingText.match(/\b(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/i);
  const minMatch = workingText.match(/\b(\d+)\s*(?:minutes?|mins?|m)\b/i);

  if (hourMatch) {
    estimatedEffort = parseFloat(hourMatch[1]);
    workingText = workingText.replace(hourMatch[0], ' ').trim();
  } else if (minMatch) {
    estimatedEffort = Math.max(0.25, Math.round((parseInt(minMatch[1], 10) / 60) * 10) / 10);
    workingText = workingText.replace(minMatch[0], ' ').trim();
  }

  // 4. Parse Date & Time using chrono-node
  const parsedDates = chrono.parse(workingText, new Date(), { forwardDate: true });
  let deadline: string | undefined = undefined;

  if (parsedDates.length > 0) {
    const firstDate = parsedDates[0];
    const parsedDate = firstDate.date();
    
    // If no explicit time was specified (e.g. "by Friday"), default to end of day 17:00
    if (!firstDate.start.isCertain('hour')) {
      parsedDate.setHours(17, 0, 0, 0);
    }
    
    deadline = parsedDate.toISOString();

    // Remove the date text substring
    const matchedText = firstDate.text;
    // Replace with empty string
    workingText = workingText.replace(matchedText, ' ').trim();
  } else {
    // Default to tomorrow 17:00 if no date parsed
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(17, 0, 0, 0);
    deadline = tomorrow.toISOString();
  }

  // 5. Clean up remaining title
  let cleanTitle = workingText
    .replace(/\bby\b/gi, '')
    .replace(/\bdue\b/gi, '')
    .replace(/\bfor\b/gi, '')
    .replace(/\bat\b/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/^[,;.\-\s]+|[,;.\-\s]+$/g, '')
    .trim();

  if (!cleanTitle) {
    cleanTitle = 'New Scheduled Task';
  }

  return {
    title: cleanTitle,
    deadline,
    estimatedEffort: Math.max(0.1, estimatedEffort),
    priority,
    category,
    rawText: text,
  };
}
