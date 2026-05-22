// Kernel Scheduler — consolidated into module runtime
// This file exists for backward compatibility only

export const scheduleTask = (task: () => void, delay: number) => {
  setTimeout(task, delay);
};

export const scheduleRecurring = (task: () => void, interval: number) => {
  return setInterval(task, interval);
};

export default { scheduleTask, scheduleRecurring };
