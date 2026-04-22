import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GeminiController } from './gemini.controller';
import { GeminiService } from './gemini.service';

jest.mock('@thallesp/nestjs-better-auth', () => ({
  AuthGuard: class MockAuthGuard {},
}));
jest.mock('../limit.guard', () => ({
  LimitGuard: class MockLimitGuard {},
}));

describe('GeminiController', () => {
  let controller: GeminiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GeminiController],
      providers: [
        GeminiService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: string) => {
              if (key === 'GEMINI_API_KEY') return 'test-api-key';
              if (key === 'GEMINI_MODEL') return 'gemini-2.0-flash';
              throw new Error(`Missing config key: ${key}`);
            },
          },
        },
      ],
    }).compile();

    controller = module.get<GeminiController>(GeminiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
