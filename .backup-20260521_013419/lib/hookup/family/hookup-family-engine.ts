export function createFamilyLink(
  userA: string,
  userB: string
) {

  return {
    type: "FAMILY_INTRODUCED_PAIR",
    users: [userA, userB],
    permissions: {
      shared_visibility: true,
      guardian_view: true,
      extended_network: true,
    },
  };
}
