export function matchFace(
  user_face_vector: number[],
  stored_face_vector: number[]
) {

  let distance = 0;

  for (let i = 0; i < user_face_vector.length; i++) {
    distance += Math.abs(
      user_face_vector[i] -
        stored_face_vector[i]
    );
  }

  const similarity =
    100 - Math.min(distance, 100);

  return {
    match: similarity > 80,
    similarity_score: similarity,
  };
}
