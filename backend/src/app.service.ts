import { Injectable } from '@nestjs/common';

export interface ServiceInfo {
  service: string;
  status: 'running';
}

@Injectable()
export class AppService {
  getServiceInfo(): ServiceInfo {
    return { service: 'queue-commerce-api', status: 'running' };
  }
}
