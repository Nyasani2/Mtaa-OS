import {
  updateReputation
} from "./hookup-passport-engine";

export async function onNegativeEvent(
  passport_id: string
) {

  await updateReputation(passport_id, -15);
}

export async function onPositiveEvent(
  passport_id: string
) {

  await updateReputation(passport_id, +10);
}
