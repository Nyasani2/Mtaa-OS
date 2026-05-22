import { View, Text, StyleSheet } from 'react-native';
import { JobCard } from "@/lib/jobs/components/JobCard";
import { useJobsStore } from "@/lib/jobs/hooks/use-jobs-store";

export default function JobsScreen() {
  const { jobs } = useJobsStore();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Jobs</Text>
      {jobs?.map((job: any) => (
        <JobCard key={job.id} job={job} onApply={() => {}} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 16 },
});
