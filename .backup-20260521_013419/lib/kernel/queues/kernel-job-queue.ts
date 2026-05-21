type KernelJob = {
  id: string;
  name: string;
  payload?: any;
};

class KernelJobQueue {

  private jobs: KernelJob[] = [];

  add(job: KernelJob) {

    this.jobs.push(job);

    console.log(
      "[JOB ADDED]",
      job.name
    );
  }

  next() {
    return this.jobs.shift();
  }

  size() {
    return this.jobs.length;
  }
}

export const kernelJobQueue =
  new KernelJobQueue();
