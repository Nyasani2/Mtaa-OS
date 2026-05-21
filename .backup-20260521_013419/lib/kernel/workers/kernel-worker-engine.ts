type WorkerTask = {
  id: string;
  type: string;
  payload?: any;
};

class KernelWorkerEngine {

  private queue: WorkerTask[] = [];

  enqueue(task: WorkerTask) {

    this.queue.push(task);

    console.log(
      "[WORKER ENQUEUED]",
      task.type
    );
  }

  process() {

    while (this.queue.length > 0) {

      const task = this.queue.shift();

      console.log(
        "[WORKER PROCESSING]",
        task?.type
      );
    }
  }
}

export const kernelWorkerEngine =
  new KernelWorkerEngine();
