import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GeminiService } from './gemini.service';

describe('GeminiService', () => {
  let service: GeminiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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

    service = module.get<GeminiService>(GeminiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
