export function linkCrossAppExperience(
  hookup_event: any,
  transport_event: any
) {

  return {
    unified_experience: true,
    linked: [
      hookup_event,
      transport_event
    ],
    seamless_flow: true,
  };
}
