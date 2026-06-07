// OS Shell — global shell operations
export const osShell = {
  navigate(route: string) {
    // TODO: wire to router
    console.log('Navigate to:', route);
  },
  goBack() {
    // TODO: wire to router
  },
  showToast(message: string) {
    // TODO: wire to toast system
    console.log('Toast:', message);
  },
};

export default osShell;
