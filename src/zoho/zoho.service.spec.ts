import { Test, TestingModule } from '@nestjs/testing';
import { ZohoService } from './zoho.service';
import { getModelToken } from '@nestjs/mongoose';
import { ZohoToken } from './zoho-token.schema';

describe('ZohoService', () => {
  let service: ZohoService;

  const mockZohoTokenModel = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ZohoService,
        {
          provide: getModelToken(ZohoToken.name),
          useValue: mockZohoTokenModel,
        },
      ],
    }).compile();

    service = module.get<ZohoService>(ZohoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
