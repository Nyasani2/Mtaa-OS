export type FreightJob = {
  id: string;
  pickup: string;
  destination: string;
  cargoType: string;
  status: 'pending' | 'assigned' | 'in_transit' | 'completed';
  assignedDriverId?: string;
};

class FreightDispatchEngine {
  private jobs: FreightJob[] = [];

  getJobs() {
    return this.jobs;
  }

  createJob(job: FreightJob) {
    this.jobs.push(job);
  }

  assignDriver(jobId: string, driverId: string) {
    this.jobs = this.jobs.map((job) => {
      if (job.id === jobId) {
        return {
          ...job,
          assignedDriverId: driverId,
          status: 'assigned',
        };
      }

      return job;
    });
  }

  updateStatus(
    jobId: string,
    status: FreightJob['status']
  ) {
    this.jobs = this.jobs.map((job) => {
      if (job.id === jobId) {
        return {
          ...job,
          status,
        };
      }

      return job;
    });
  }

  removeJob(jobId: string) {
    this.jobs = this.jobs.filter(
      (job) => job.id !== jobId
    );
  }
}

export const freightDispatchEngine =
  new FreightDispatchEngine();
