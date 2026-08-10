import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('서비스 정보를 반환한다', () => {
      expect(appController.getServiceInfo()).toEqual({
        service: 'queue-commerce-api',
        status: 'running',
      });
    });
  });
});
