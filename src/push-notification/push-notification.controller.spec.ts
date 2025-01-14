import { Test, TestingModule } from '@nestjs/testing';
import { PushNotificationController } from './push-notification.controller';

describe('PushNotificationController', () => {
  let controller: PushNotificationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PushNotificationController],
    }).compile();

    controller = module.get<PushNotificationController>(
      PushNotificationController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
