import { describe, expect, it, jest } from '@jest/globals';
import { Repository } from 'typeorm';
import { ResourcesService } from './resources.service';
import { ResourceDownload } from './resource-download.entity';

describe('ResourcesService', () => {
  it('normalizes student levels before filtering resource lists', async () => {
    const resourcesRepository = {
      createQueryBuilder: jest.fn(),
    } as any;
    const downloadRepository = {} as unknown as Repository<ResourceDownload>;
    const studentRepository = {
      findOne: jest.fn(async () => ({ level: 'Hifz Program' })),
    } as any;

    const service = new ResourcesService(resourcesRepository, downloadRepository, studentRepository);

    const qb = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => []),
    } as any;

    resourcesRepository.createQueryBuilder.mockReturnValue(qb);

    await service.findAll('student-id', 'student', '', 'All');

    expect(qb.andWhere).toHaveBeenCalled();
    const levelFilterCall = qb.andWhere.mock.calls.find((call: any[]) => call[1]?.allLevels === 'All Levels');

    expect(levelFilterCall).toBeDefined();
    expect(levelFilterCall?.[1]).toHaveProperty('allLevels', 'All Levels');
    expect(levelFilterCall?.[1]).toHaveProperty('levelVariants');
    expect(levelFilterCall?.[1].levelVariants).toEqual(['Hifz', 'Hifz Program']);
  });
});
