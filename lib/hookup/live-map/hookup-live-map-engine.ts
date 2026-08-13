export function buildLiveMap(users: any[]) {

  return users.map((user: any) => {

    return {
      id: user.user_id,
      position: {
        lat: user.latitude,
        lng: user.longitude,
      },
      status: user.activity_type,
      visibility: user.visibility_mode,
    };
  });
}
