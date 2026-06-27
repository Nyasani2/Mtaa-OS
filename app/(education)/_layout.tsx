import { Stack } from 'expo-router';

export default function EducationLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="student-dashboard" />
      <Stack.Screen name="parent-dashboard" />
      <Stack.Screen name="teacher-dashboard" />
      <Stack.Screen name="courses/index" />
      <Stack.Screen name="courses/create" />
      <Stack.Screen name="courses/[id]" />
      <Stack.Screen name="assignments/index" />
      <Stack.Screen name="assignments/create" />
      <Stack.Screen name="assignments/[id]" />
      <Stack.Screen name="exams/index" />
      <Stack.Screen name="exams/create" />
      <Stack.Screen name="exams/[id]" />
      <Stack.Screen name="attendance/index" />
      <Stack.Screen name="grades/index" />
      <Stack.Screen name="timetable/index" />
      <Stack.Screen name="library/index" />
      <Stack.Screen name="library/upload" />
      <Stack.Screen name="fees/index" />
      <Stack.Screen name="announcements/index" />
      <Stack.Screen name="announcements/create" />
      <Stack.Screen name="messages/index" />
      <Stack.Screen name="my-grades" />
    </Stack>
  );
}
