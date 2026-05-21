export function filterVisibility(user: any) {

  if (user.visibility_mode === "GHOST") {
    return null;
  }

  if (user.visibility_mode === "PRIVATE") {
    return {
      activity: "HIDDEN",
      location: null,
    };
  }

  return user;
}
