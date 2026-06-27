import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

describe('MailService', () => {
  let service: MailService;

  const mockConfig = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        SMTP_HOST: 'smtp.gmail.com',
        SMTP_PORT: '587',
        SMTP_USER: 'test@gmail.com',
        SMTP_PASS: 'app-password',
        EMAIL_FROM: 'Test <test@gmail.com>',
      };
      return config[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MailService, { provide: ConfigService, useValue: mockConfig }],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendMail', () => {
    it('should not throw when called', async () => {
      await expect(
        service.sendMail({
          to: 'user@example.com',
          subject: 'Test',
          html: '<p>test</p>',
        }),
      ).resolves.toBeUndefined();
    });
  });
});
