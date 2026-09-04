// modules/plan/interface/plan.controller.ts
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
import { PlanService } from '../application/plan.service';
import { UpdatePlanDto } from '../application/dto/plan.dto';
import { CreateBlockDto, UpdateBlockDto } from '../application/dto/plan.dto';
import { CreateLotDto, UpdateLotDto } from '../application/dto/lot.dto';
import { JwtAuthGuard } from '../../../shared/application/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/application/guards/roles.guard';
import { Roles } from '../../../shared/application/decorators/roles.decorator';
import { UserRole } from '../../../shared/domain/enums';
import { CurrentUser } from '../../../shared/application/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('plan')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  // ---- plan ----
  @Get('project/:projectId')
  getByProject(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.planService.getByProject(projectId);
  }

  @Post('update/:projectId')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  update(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: UpdatePlanDto,
    @CurrentUser('id') actorId: number,
  ) {
    return this.planService.update(projectId, dto, actorId);
  }

  @Post('image/:projectId')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dir = join(process.cwd(), 'uploads', 'plans');
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `plan-${unique}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  uploadImage(
    @Param('projectId', ParseIntPipe) projectId: number,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') actorId: number,
  ) {
    const url = `/uploads/plans/${file.filename}`;
    return this.planService.uploadImage(projectId, url, actorId);
  }

  // ---- manzanas ----
  @Post('block/:projectId')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  createBlock(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateBlockDto,
    @CurrentUser('id') actorId: number,
  ) {
    return this.planService.createBlock(projectId, dto, actorId);
  }

  @Post('block/update/:blockId')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  updateBlock(
    @Param('blockId', ParseIntPipe) blockId: number,
    @Body() dto: UpdateBlockDto,
    @CurrentUser('id') actorId: number,
  ) {
    return this.planService.updateBlock(blockId, dto, actorId);
  }

  @Post('block/delete/:blockId')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  deleteBlock(@Param('blockId', ParseIntPipe) blockId: number, @CurrentUser('id') actorId: number) {
    return this.planService.deleteBlock(blockId, actorId);
  }

  @Post('block/duplicate/:blockId')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  duplicateBlock(@Param('blockId', ParseIntPipe) blockId: number, @CurrentUser('id') actorId: number) {
    return this.planService.duplicateBlock(blockId, actorId);
  }

  // ---- lotes ----
  @Post('lot/:projectId')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  createLot(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateLotDto,
    @CurrentUser('id') actorId: number,
  ) {
    return this.planService.createLot(projectId, dto, actorId);
  }

  @Post('lot/update/:lotId')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  updateLot(
    @Param('lotId', ParseIntPipe) lotId: number,
    @Body() dto: UpdateLotDto,
    @CurrentUser('id') actorId: number,
  ) {
    return this.planService.updateLot(lotId, dto, actorId);
  }

  @Post('lot/status/:lotId')
  changeStatus(
    @Param('lotId', ParseIntPipe) lotId: number,
    @Body('status') status: string,
    @Body('note') note: string | undefined,
    @CurrentUser('id') actorId: number,
  ) {
    return this.planService.changeStatus(lotId, status, actorId, note);
  }

  @Post('lot/delete/:lotId')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  deleteLot(@Param('lotId', ParseIntPipe) lotId: number, @CurrentUser('id') actorId: number) {
    return this.planService.deleteLot(lotId, actorId);
  }

  @Get('lot/history/:lotId')
  lotHistory(@Param('lotId', ParseIntPipe) lotId: number) {
    return this.planService.lotHistory(lotId);
  }
}