// modules/projects/interface/projects.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { ProjectsService } from '../application/projects.service';
import { CreateProjectDto } from '../application/dto/create-project.dto';
import { JwtAuthGuard } from '../../../shared/application/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/application/guards/roles.guard';
import { Roles } from '../../../shared/application/decorators/roles.decorator';
import { UserRole } from '../../../shared/domain/enums';
import { CurrentUser } from '../../../shared/application/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  list() {
    return this.projectsService.list();
  }

  @Get('dashboard/:id')
  dashboard(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.dashboard(id);
  }

  @Get(':id')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.projectsService.getOne(id);
  }

  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  create(@Body() dto: CreateProjectDto, @CurrentUser('id') actorId: number) {
    return this.projectsService.create(dto, actorId);
  }

  @Post('update/:id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateProjectDto,
    @CurrentUser('id') actorId: number,
  ) {
    return this.projectsService.update(id, dto, actorId);
  }

  @Post('status/:id/:status')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  setStatus(
    @Param('id', ParseIntPipe) id: number,
    @Param('status') status: 'active' | 'inactive',
    @CurrentUser('id') actorId: number,
  ) {
    return this.projectsService.setStatus(id, status, actorId);
  }

  @Post('cover/:id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dir = join(process.cwd(), 'uploads', 'covers');
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `cover-${unique}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  uploadCover(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') actorId: number,
  ) {
    const url = `/uploads/covers/${file.filename}`;
    return this.projectsService.updateCover(id, url, actorId);
  }
}