import { Test, TestingModule } from '@nestjs/testing';
import { ExtractorController } from './extractor.controller';

describe('ExtractorController', () => {
  let controller: ExtractorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExtractorController],
    }).compile();

    controller = module.get<ExtractorController>(ExtractorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
