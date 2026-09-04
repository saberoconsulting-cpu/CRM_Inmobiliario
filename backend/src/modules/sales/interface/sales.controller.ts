// modules/sales/interface/sales.controller.ts
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SalesService } from '../application/sales.service';
import { CreateSaleDto } from '../application/dto/sale.dto';
import { JwtAuthGuard } from '../../../shared/application/guards/jwt-auth.guard';
import { CurrentUser } from '../../../shared/application/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  list(
    @Query('projectId') projectId?: string,
    @Query('agentId') agentId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.salesService.list({
      projectId: projectId ? Number(projectId) : undefined,
      agentId: agentId ? Number(agentId) : undefined,
      from,
      to,
      status,
      search,
    });
  }

  @Post()
  create(@Body() dto: CreateSaleDto, @CurrentUser('id') actorId: number) {
    return this.salesService.create(dto, actorId);
  }
}