import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsService } from '../services/jobsService';
import type { JobPost, JobApplication, JobFilter } from '../types';

export function useJobs() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<JobFilter>({});
  const [searchQuery, setSearchQuery] = useState('');

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['streets', 'jobs', 'list', filters, searchQuery],
    queryFn: () => jobsService.getJobs({ ...filters, search: searchQuery }),
  });

  const { data: myApplications } = useQuery({
    queryKey: ['streets', 'jobs', 'applications'],
    queryFn: () => jobsService.getMyApplications(),
  });

  const { data: myListings } = useQuery({
    queryKey: ['streets', 'jobs', 'my-listings'],
    queryFn: () => jobsService.getMyListings(),
  });

  const apply = useMutation({
    mutationFn: ({ jobId, coverLetter }: { jobId: string; coverLetter: string }) =>
      jobsService.applyToJob(jobId, coverLetter),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'jobs', 'applications'] });
    },
  });

  const postJob = useMutation({
    mutationFn: (job: Omit<JobPost, 'id' | 'createdAt'>) => jobsService.postJob(job),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'jobs', 'my-listings'] });
    },
  });

  const closeJob = useMutation({
    mutationFn: (jobId: string) => jobsService.closeJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streets', 'jobs'] });
    },
  });

  return {
    jobs,
    myApplications,
    myListings,
    isLoading,
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    apply,
    postJob,
    closeJob,
  };
}
