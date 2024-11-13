import {
  Processor,
  InjectQueue,
  OnQueueCompleted,
  OnQueueFailed,
  Process,
} from '@nestjs/bull';
import { Job, JobStatus, Queue } from 'bull';
import { PreOrderService } from './pre-order.service';
import { PRE_ORDER_STATUS } from 'src/common/enum/preOrder.enum';
import { forwardRef, Inject, NotFoundException } from '@nestjs/common';
import { UUID } from 'crypto';
import { delay } from 'rxjs';

@Processor('preorder')
export class PreOrderProcessor {
  constructor(
    @Inject(forwardRef(() => PreOrderService))
    private readonly preOrderService: PreOrderService,
    @InjectQueue('preorder') private readonly preOrderQueue: Queue,
  ) {}

  @Process('process-preorder')
  async handlePreOrderJob(job: Job) {
    try {
      const { acceptedProducts, rejectedProducts, status } = job.data;

      console.log(`Job ${job.id} processed.`);
      await this.preOrderService.handleProviderResponse(
        job.id as UUID,
        acceptedProducts,
        rejectedProducts,
        PRE_ORDER_STATUS.timeout,
      );
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error(PRE_ORDER_STATUS.timeout);
      } else {
        throw err; // Rethrow other errors for further handling
      }
    }
  }

  async addPreOrderJob(preOrderId: string, data: any) {
    const targetTime = new Date(data.delay);
    const delay = Number(targetTime) - Number(new Date());

    await this.preOrderQueue.add(
      'process-preorder',
      { ...data },
      { jobId: preOrderId, delay: delay },
    );
  }

  async updatePreOrderJob(id: UUID, data: any) {
    const job = await this.getPreOrderJob(id);
    await job.remove();
    const { acceptedProducts, rejectedProducts } = data;

    // Calling the service to handle provider's response and update status
    const updatedStatus =
      acceptedProducts.length > 0 && rejectedProducts.length > 0
        ? PRE_ORDER_STATUS.partialyAccepted // Handle partially accepted case
        : acceptedProducts.length > 0
        ? PRE_ORDER_STATUS.accepted
        : PRE_ORDER_STATUS.rejected;

    await this.preOrderService.handleProviderResponse(
      id,
      acceptedProducts,
      rejectedProducts,
      updatedStatus,
    );

    return;
  }

  async finishJob(preOrderId: string) {
    try {
      const job = await this.getPreOrderJob(preOrderId);
      await job.moveToCompleted();
    } catch (error) {
      throw error;
    }
  }

  async getPreOrderJob(preOrderId: string) {
    try {
      const job = await this.preOrderQueue.getJob(preOrderId);
      if (!job) {
        throw new Error(`Job with preOrderId ${preOrderId} not found`);
      }
      return job;
    } catch (error) {
      throw new NotFoundException(
        `Job with preOrderId ${preOrderId} not found`,
      );
    }
  }

  async getAllActivePreOrderJobs() {
    try {
      const jobStates: JobStatus[] = [
        'completed',
        'failed',
        'waiting',
        'active',
        'delayed',
      ];

      const jobs = {};

      for (const state of jobStates) {
        // Retrieve jobs in each state
        jobs[state] = await this.preOrderQueue.getJobs([state]);
      }

      return jobs;
    } catch (error) {
      throw error;
    }
  }

  async clearAllJobs() {
    try {
      await this.preOrderQueue.obliterate({ force: true });
      const message = 'All jobs have been removed from the queue.';
      console.log(message);
      return message;
    } catch (error) {
      console.error('Failed to obliterate the queue:', error);
    }
  }

  @OnQueueCompleted()
  async onCompleted(job: Job) {
    await job.remove(); // Remove job if accepted
  }

  @OnQueueFailed()
  async onFailed(job: Job, error: Error) {
    const { acceptedProducts, rejectedProducts } = job.data;
    if (
      error.message.includes('job stalled') ||
      error.message.includes(PRE_ORDER_STATUS.timeout)
    ) {
      console.log(`Job ${job.id} timed out.`);
      job.update({ ...job.data, status: PRE_ORDER_STATUS.timeout });

      await this.preOrderService.handleProviderResponse(
        job.id as UUID,
        acceptedProducts,
        rejectedProducts,
        PRE_ORDER_STATUS.timeout,
      );
      await job.remove();
    } else if (job.data.status === PRE_ORDER_STATUS.rejected) {
      await job.remove();
    }
  }
}
