import { Controller, Get } from '@nestjs/common';
import { WebsiteCmsService } from './website-cms.service';

@Controller('website/home')
export class WebsiteCmsPublicController {
  constructor(private readonly cmsService: WebsiteCmsService) {}

  @Get('mission')
  getMission() {
    return this.cmsService.getPublicMissionContent();
  }

  @Get('programs')
  getPrograms() {
    return this.cmsService.getPublicProgramsContent();
  }
}
